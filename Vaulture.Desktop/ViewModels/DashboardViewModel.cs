using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using System.Collections.ObjectModel;
using Vaulture.Core.Models;

namespace Vaulture.Desktop.ViewModels;

public partial class DashboardViewModel : ViewModelBase
{
    private readonly MainViewModel _mainViewModel;

    [ObservableProperty]
    public partial ObservableCollection<Folder> Folders { get; set; } = new();

    [ObservableProperty]
    public partial ObservableCollection<Entry> CurrentEntries { get; set; } = new();

    public DashboardViewModel(MainViewModel mainViewModel)
    {
        _mainViewModel = mainViewModel;
        LoadDummyData();
    }

    [RelayCommand]
    private void LockVault()
    {
        // Go back to login screen
        _mainViewModel.NavigateTo(new LoginViewModel(_mainViewModel));
    }

    private void LoadDummyData()
    {
        var root1 = new Folder { Name = "Personal" };
        var root2 = new Folder { Name = "Work" };
        
        root1.SubFolders.Add(new Folder { Name = "Banking" });
        root1.SubFolders.Add(new Folder { Name = "Social Media" });

        Folders.Add(root1);
        Folders.Add(root2);

        CurrentEntries.Add(new Entry { Title = "Google Account", Username = "user@gmail.com", Url = "https://google.com" });
        CurrentEntries.Add(new Entry { Title = "Bank of America", Username = "user123", Url = "https://bankofamerica.com" });
    }
}
