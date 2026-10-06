using System;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Drive.v3;
using Google.Apis.Services;
using Google.Apis.Util.Store;

namespace Vaulture.Core.Services;

public class GoogleDriveSyncService
{
    private static readonly string[] Scopes = { DriveService.Scope.DriveFile };
    private const string ApplicationName = "Vaulture Password Manager";
    private const string BackupFolderName = "Vaulture Backups";
    
    private DriveService? _driveService;

    /// <summary>
    /// Authenticates the user and initializes the DriveService.
    /// Requires a client_secrets.json file embedded or placed next to the executable.
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
