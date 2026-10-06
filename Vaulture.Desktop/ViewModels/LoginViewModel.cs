using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using System;
using System.IO;
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
            // 1. Derive Key
            string key = EncryptionService.DeriveKeyFromPassword(MasterPassword);

            // 2. Determine DB Path
            string appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            string vaultDir = Path.Combine(appData, "Vaulture");
            if (!Directory.Exists(vaultDir)) Directory.CreateDirectory(vaultDir);
            
            string dbPath = Path.Combine(vaultDir, "vault.db");

            // 3. Initialize DbContext
            var dbContext = new VaultDbContext(dbPath, key);
            
            // 4. Ensure DB created (This will also throw if the key is wrong on an existing DB, due to SQLCipher)
            dbContext.Database.EnsureCreated();

            // 5. Navigate to Dashboard, passing the valid context
            _mainViewModel.NavigateTo(new DashboardViewModel(_mainViewModel, dbContext));
        }
        catch (Exception ex)
        {
            ErrorMessage = "Failed to unlock vault. Incorrect password or corrupted database.";
        }
    }
}
