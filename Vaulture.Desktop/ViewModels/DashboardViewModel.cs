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

    public DashboardViewModel(MainViewModel mainViewModel, VaultDbContext dbContext)
    {
        _mainViewModel = mainViewModel;
        _dbContext = dbContext;
        LoadData();
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
