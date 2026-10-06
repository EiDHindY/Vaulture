using System;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Drive.v3;
using Google.Apis.Services;
using Google.Apis.Oauth2.v2;
using Google.Apis.Util.Store;

namespace Vaulture.Core.Services;

public class GoogleDriveSyncService
{
    private static readonly string[] Scopes = { DriveService.Scope.DriveFile, Oauth2Service.Scope.UserinfoProfile, Oauth2Service.Scope.UserinfoEmail };
    private const string ApplicationName = "Vaulture Password Manager";
    private const string BackupFolderName = "Vaulture Backups";
    
    private DriveService? _driveService;
    private Oauth2Service? _oauthService;

    public string? LoggedInEmail { get; private set; }
    public string? LoggedInName { get; private set; }
    public string? LoggedInAvatarUrl { get; private set; }

    /// <summary>
    /// Authenticates the user and initializes the DriveService.
    /// </summary>
    public async Task<bool> AuthenticateAsync(string clientSecretsPath, string credentialsStorePath)
    {
        if (!File.Exists(clientSecretsPath))
            return false;

        using var stream = new FileStream(clientSecretsPath, FileMode.Open, FileAccess.Read);
        
        var credential = await GoogleWebAuthorizationBroker.AuthorizeAsync(
            GoogleClientSecrets.FromStream(stream).Secrets,
            Scopes,
            "user",
            CancellationToken.None,
            new FileDataStore(credentialsStorePath, true));

        _driveService = new DriveService(new BaseClientService.Initializer()
        {
            HttpClientInitializer = credential,
            ApplicationName = ApplicationName,
        });
        
        _oauthService = new Oauth2Service(new BaseClientService.Initializer()
        {
            HttpClientInitializer = credential,
            ApplicationName = ApplicationName,
        });

        // Fetch User Info
        try
        {
            var userInfo = await _oauthService.Userinfo.Get().ExecuteAsync();
            LoggedInEmail = userInfo.Email;
            LoggedInName = userInfo.Name;
            LoggedInAvatarUrl = userInfo.Picture;
        }
        catch
        {
            // Ignore if profile fetch fails
        }

        return true;
    }

    public async Task UpsertBackupAsync(string dbFilePath)
    {
        if (_driveService == null)
            throw new InvalidOperationException("Service is not authenticated.");

        var fileName = Path.GetFileName(dbFilePath);
        
        // 1. Find or create the backup folder
        string folderId = await GetOrCreateFolderAsync(BackupFolderName);

        // 2. Search for existing backup file in that folder
        var listRequest = _driveService.Files.List();
        listRequest.Q = $"name = '{fileName}' and '{folderId}' in parents and trashed = false";
        listRequest.Fields = "files(id, name)";
        var listResponse = await listRequest.ExecuteAsync();
        var existingFile = listResponse.Files.FirstOrDefault();

        // 3. Upload or Update
        var fileMetadata = new Google.Apis.Drive.v3.Data.File()
        {
            Name = fileName
        };

        await using var stream = new FileStream(dbFilePath, FileMode.Open, FileAccess.Read);

        if (existingFile != null)
        {
            // Update existing file (Upsert)
            var updateRequest = _driveService.Files.Update(fileMetadata, existingFile.Id, stream, "application/octet-stream");
            await updateRequest.UploadAsync();
        }
        else
        {
            // Create new file
            fileMetadata.Parents = new[] { folderId };
            var createRequest = _driveService.Files.Create(fileMetadata, stream, "application/octet-stream");
            await createRequest.UploadAsync();
        }
    }

    private async Task<string> GetOrCreateFolderAsync(string folderName)
    {
        if (_driveService == null) throw new InvalidOperationException("Not authenticated");

        var listRequest = _driveService.Files.List();
        listRequest.Q = $"name = '{folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false";
        listRequest.Fields = "files(id, name)";
        var listResponse = await listRequest.ExecuteAsync();
        var folder = listResponse.Files.FirstOrDefault();

        if (folder != null)
        {
            return folder.Id;
        }

        // Create the folder
        var folderMetadata = new Google.Apis.Drive.v3.Data.File()
        {
            Name = folderName,
            MimeType = "application/vnd.google-apps.folder"
        };
        var createRequest = _driveService.Files.Create(folderMetadata);
        createRequest.Fields = "id";
        var newFolder = await createRequest.ExecuteAsync();
        
        return newFolder.Id;
    }
}
