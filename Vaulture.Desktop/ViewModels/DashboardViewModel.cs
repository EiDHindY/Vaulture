using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using System.Collections.ObjectModel;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Vaulture.Core.Data;
using Vaulture.Core.Models;

namespace Vaulture.Desktop.ViewModels;

public partial class DashboardViewModel : ViewModelBase
{
    private readonly MainViewModel _mainViewModel;
    private readonly VaultDbContext _dbContext;

    [ObservableProperty]
    public partial ObservableCollection<Folder> Folders { get; set; } = new();

    [ObservableProperty]
    public partial ObservableCollection<Entry> CurrentEntries { get; set; } = new();

    // Settings state
    [ObservableProperty]
    public partial bool IsSettingsVisible { get; set; } = false;

    [ObservableProperty]
    public partial bool IsSettingsSuccessVisible { get; set; } = false;

    [ObservableProperty]
    public partial string NewMasterPassword { get; set; } = string.Empty;

    [ObservableProperty]
    public partial string NewRecoveryKey { get; set; } = string.Empty;

    [ObservableProperty]
    public partial string SettingsErrorMessage { get; set; } = string.Empty;

    public DashboardViewModel(MainViewModel mainViewModel, VaultDbContext dbContext)
    {
        _mainViewModel = mainViewModel;
        _dbContext = dbContext;
        LoadData();
    }

    [RelayCommand]
    private void ShowSettings()
    {
        IsSettingsVisible = true;
        SettingsErrorMessage = "";
        NewMasterPassword = "";
        GenerateNewMasterPassword(); // Auto-generate a strong one to encourage good habits
    }

    [RelayCommand]
    private void HideSettings()
    {
        IsSettingsVisible = false;
        IsSettingsSuccessVisible = false;
    }

    [RelayCommand]
    private void GenerateNewMasterPassword()
    {
        const string chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()_-+=";
        var random = new System.Random();
        var pass = new char[20];
        for (int i = 0; i < pass.Length; i++) pass[i] = chars[random.Next(chars.Length)];
        NewMasterPassword = new string(pass);
    }

    [RelayCommand]
    private void ApplyNewMasterPassword()
    {
        if (string.IsNullOrWhiteSpace(NewMasterPassword))
        {
            SettingsErrorMessage = "Password cannot be empty.";
            return;
        }

        try
        {
            // 1. Re-key the database using PRAGMA rekey
            string newKey = Vaulture.Core.Services.EncryptionService.DeriveKeyFromPassword(NewMasterPassword);
            _dbContext.Database.ExecuteSqlRaw($"PRAGMA rekey = '{newKey}';");

            // 2. Generate a new Emergency Recovery Key
            string appData = System.Environment.GetFolderPath(System.Environment.SpecialFolder.ApplicationData);
            string recoveryPath = System.IO.Path.Combine(appData, "Vaulture", "recovery.dat");

            NewRecoveryKey = Vaulture.Core.Services.EncryptionService.GenerateRecoveryKey();
            Vaulture.Core.Services.EncryptionService.CreateRecoveryFile(NewMasterPassword, NewRecoveryKey, recoveryPath);

            // 3. Show Success Screen
            IsSettingsVisible = false;
            IsSettingsSuccessVisible = true;
            
            _ = Vaulture.Core.Services.NotificationService.SendNotificationAsync("Master Password Changed", "Your Vaulture Master Password was just changed, and the database was re-encrypted.");
        }
        catch (System.Exception ex)
        {
            SettingsErrorMessage = "Failed to change password: " + ex.Message;
        }
    }

    [RelayCommand]
    private void LockVault()
    {
        _dbContext.Dispose();
        _mainViewModel.NavigateTo(new LoginViewModel(_mainViewModel));
    }

    private void LoadData()
    {
        Folders.Clear();
        CurrentEntries.Clear();

        // Load root folders
        var rootFolders = _dbContext.Folders
            .Include(f => f.SubFolders)
            .Where(f => f.ParentFolderId == null)
            .ToList();

        foreach (var folder in rootFolders)
        {
            Folders.Add(folder);
        }

        // Load all entries for now (In the future, we'll filter by selected folder)
        var allEntries = _dbContext.Entries.ToList();
        foreach (var entry in allEntries)
        {
            CurrentEntries.Add(entry);
        }
    }

    [RelayCommand]
    private void AddDummyEntry()
    {
        var entry = new Entry 
        { 
            Title = "New Entry", 
            Username = "user", 
            Password = "password123", 
            Url = "https://example.com" 
        };
        
        _dbContext.Entries.Add(entry);
        _dbContext.SaveChanges();
        
        CurrentEntries.Add(entry);
    }
}
