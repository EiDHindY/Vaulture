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

    public LoginViewModel(MainViewModel mainViewModel)
    {
        _mainViewModel = mainViewModel;
    }

    [RelayCommand]
    private async Task Login()
    {
        ErrorMessage = "";
        
        if (string.IsNullOrWhiteSpace(MasterPassword))
        {
            ErrorMessage = "Please enter your master password.";
            return;
        }

        try
        {
            // 1. Derive Key
            string key = EncryptionService.DeriveKeyFromPassword(MasterPassword);

            string appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            string vaultDir = Path.Combine(appData, "Vaulture");
            if (!Directory.Exists(vaultDir)) Directory.CreateDirectory(vaultDir);
            
            string dbPath = Path.Combine(vaultDir, "vault.db");
            string secretsPath = Path.Combine(vaultDir, "client_secrets.json");
            string credentialsPath = Path.Combine(vaultDir, "Google.Apis.Auth");

            if (!File.Exists(secretsPath))
            {
                ErrorMessage = "Mandatory: Please place 'client_secrets.json' in " + vaultDir + " to enable Google Drive Backup.";
                return;
            }

            // 2. Initialize DbContext (Local Unlock)
            var dbContext = new VaultDbContext(dbPath, key);
            dbContext.Database.EnsureCreated();

            // 3. Mandatory Google Drive Authentication
            var driveService = new GoogleDriveSyncService();
            bool googleAuthSuccess = await driveService.AuthenticateAsync(secretsPath, credentialsPath);

            if (!googleAuthSuccess)
            {
                ErrorMessage = "Google Drive authentication failed. This is required to access your vault.";
                dbContext.Dispose();
                return;
            }

            // 4. Navigate to Dashboard, passing the valid context
            _mainViewModel.NavigateTo(new DashboardViewModel(_mainViewModel, dbContext));
        }
        catch (Exception)
        {
            ErrorMessage = "Failed to unlock vault. Incorrect password or corrupted database.";
        }
    }

}
