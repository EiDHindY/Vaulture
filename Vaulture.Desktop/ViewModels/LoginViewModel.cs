using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using System;
using System.IO;
using System.Threading.Tasks;
using Vaulture.Core.Data;
using Vaulture.Core.Services;

namespace Vaulture.Desktop.ViewModels;

public partial class LoginViewModel : ViewModelBase
{
    private readonly MainViewModel _mainViewModel;

    [ObservableProperty]
    public partial string MasterPassword { get; set; } = string.Empty;

    [ObservableProperty]
    public partial string ErrorMessage { get; set; } = string.Empty;

    [ObservableProperty]
    public partial string? UserEmail { get; set; }

    [ObservableProperty]
    public partial string? UserName { get; set; }

    [ObservableProperty]
    public partial Avalonia.Media.Imaging.Bitmap? UserAvatar { get; set; }

    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(IsNotGoogleAuthenticated))]
    public partial bool IsGoogleAuthenticated { get; set; } = false;

    public bool IsNotGoogleAuthenticated => !IsGoogleAuthenticated;

    [ObservableProperty]
    public partial bool IsFirstTimeSetup { get; set; } = false;

    [ObservableProperty]
    public partial bool IsNotFirstTimeSetup { get; set; } = true;

    public LoginViewModel(MainViewModel mainViewModel)
    {
        _mainViewModel = mainViewModel;
        
        string appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
        string dbPath = Path.Combine(appData, "Vaulture", "vault.db");
        IsFirstTimeSetup = !File.Exists(dbPath);
        IsNotFirstTimeSetup = !IsFirstTimeSetup;
    }

    [RelayCommand]
    private async Task SignInWithGoogle()
    {
        ErrorMessage = "";
        
        string appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
        string vaultDir = Path.Combine(appData, "Vaulture");
        if (!Directory.Exists(vaultDir)) Directory.CreateDirectory(vaultDir);

        string secretsPath = Path.Combine(vaultDir, "client_secrets.json");
        string credentialsPath = Path.Combine(vaultDir, "Google.Apis.Auth");

        if (!File.Exists(secretsPath))
        {
            ErrorMessage = "Mandatory: Please place 'client_secrets.json' in " + vaultDir + " to enable Google Drive Backup.";
            return;
        }

        try
        {
            var driveService = new GoogleDriveSyncService();
            bool success = await driveService.AuthenticateAsync(secretsPath, credentialsPath);

            if (success)
            {
                UserEmail = driveService.LoggedInEmail;
                UserName = driveService.LoggedInName;
                
                if (!string.IsNullOrEmpty(driveService.LoggedInAvatarUrl))
                {
                    try
                    {
                        using var httpClient = new System.Net.Http.HttpClient();
                        var imageBytes = await httpClient.GetByteArrayAsync(driveService.LoggedInAvatarUrl);
                        using var ms = new MemoryStream(imageBytes);
                        UserAvatar = new Avalonia.Media.Imaging.Bitmap(ms);
                    }
                    catch { /* ignore */ }
                }
                
                IsGoogleAuthenticated = true;
                ErrorMessage = "";
            }
            else
            {
                ErrorMessage = "Google Drive authentication failed. This is required to access your vault.";
            }
        }
        catch (Exception ex)
        {
            ErrorMessage = "Authentication error: " + ex.Message;
        }
    }

    [RelayCommand]
    private void Login()
    {
        ErrorMessage = "";
        
        if (string.IsNullOrWhiteSpace(MasterPassword))
        {
            ErrorMessage = "Please enter your master password.";
            return;
        }

        try
        {
            string key = EncryptionService.DeriveKeyFromPassword(MasterPassword);

            string appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            string vaultDir = Path.Combine(appData, "Vaulture");
            string dbPath = Path.Combine(vaultDir, "vault.db");

            var dbContext = new VaultDbContext(dbPath, key);
            dbContext.Database.EnsureCreated();

            if (IsFirstTimeSetup)
            {
                _mainViewModel.NavigateTo(new RecoveryKeyViewModel(_mainViewModel, dbContext, MasterPassword));
            }
            else
            {
                _mainViewModel.NavigateTo(new DashboardViewModel(_mainViewModel, dbContext));
            }
        }
        catch (Exception)
        {
            ErrorMessage = "Failed to unlock vault. Incorrect password or corrupted database.";
        }
    }

    [RelayCommand]
    private void GenerateMasterPassword()
    {
        const string chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()_-+=";
        var random = new Random();
        var pass = new char[20];
        for (int i = 0; i < pass.Length; i++)
        {
            pass[i] = chars[random.Next(chars.Length)];
        }
        MasterPassword = new string(pass);
    }

    [RelayCommand]
    private void SignOut()
    {
        // Clear cached auth tokens
        string appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
        string credentialsPath = Path.Combine(appData, "Vaulture", "Google.Apis.Auth");
        if (Directory.Exists(credentialsPath))
        {
            Directory.Delete(credentialsPath, true);
        }

        // Reset state
        IsGoogleAuthenticated = false;
        UserEmail = null;
        UserName = null;
        UserAvatar = null;
    }
}
