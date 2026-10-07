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
    public partial bool IsFirstTimeSetup { get; set; } = false;

    [ObservableProperty]
    public partial bool IsNotFirstTimeSetup { get; set; } = true;

    [ObservableProperty]
    public partial bool IsForgotPasswordVisible { get; set; } = false;

    [ObservableProperty]
    public partial string RecoveryKeyInput { get; set; } = string.Empty;

    public LoginViewModel(MainViewModel mainViewModel)
    {
        _mainViewModel = mainViewModel;
        
        string appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
        string dbPath = Path.Combine(appData, "Vaulture", "vault.db");
        IsFirstTimeSetup = !File.Exists(dbPath);
        IsNotFirstTimeSetup = !IsFirstTimeSetup;
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
        catch (Exception ex)
        {
            Console.WriteLine($"DB Error: {ex}");
            ErrorMessage = "Error: " + ex.Message;
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
    private void ShowForgotPassword()
    {
        IsForgotPasswordVisible = true;
        IsNotFirstTimeSetup = false;
        ErrorMessage = "";
    }

    [RelayCommand]
    private void HideForgotPassword()
    {
        IsForgotPasswordVisible = false;
        IsNotFirstTimeSetup = true;
        ErrorMessage = "";
    }

    [RelayCommand]
    private void RecoverVault()
    {
        ErrorMessage = "";
        if (string.IsNullOrWhiteSpace(RecoveryKeyInput))
        {
            ErrorMessage = "Please enter your Recovery Key.";
            return;
        }

        try
        {
            string appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            string recoveryPath = Path.Combine(appData, "Vaulture", "recovery.dat");

            if (!File.Exists(recoveryPath))
            {
                ErrorMessage = "Recovery file not found. Factory Reset is the only option.";
                return;
            }

            string recoveredPassword = EncryptionService.RecoverMasterPassword(RecoveryKeyInput, recoveryPath);
            MasterPassword = recoveredPassword;
            
            ErrorMessage = "Vault recovered! Copy this master password and keep it safe.";
            
            // Go back to login screen with password filled in
            HideForgotPassword();
        }
        catch (Exception ex)
        {
            ErrorMessage = "Invalid Recovery Key.";
            Console.WriteLine(ex);
        }
    }

    [RelayCommand]
    private void FactoryReset()
    {
        string appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
        string vaultDir = Path.Combine(appData, "Vaulture");
        
        try
        {
            if (Directory.Exists(vaultDir))
            {
                var dbPath = Path.Combine(vaultDir, "vault.db");
                var recPath = Path.Combine(vaultDir, "recovery.dat");
                if (File.Exists(dbPath)) File.Delete(dbPath);
                if (File.Exists(recPath)) File.Delete(recPath);
            }
            
            // Reset state
            MasterPassword = "";
            RecoveryKeyInput = "";
            ErrorMessage = "";
            IsForgotPasswordVisible = false;
            
            // Re-evaluate first time setup
            IsFirstTimeSetup = true;
            IsNotFirstTimeSetup = false;
        }
        catch (Exception ex)
        {
            ErrorMessage = "Failed to factory reset: " + ex.Message;
        }
    }
}
