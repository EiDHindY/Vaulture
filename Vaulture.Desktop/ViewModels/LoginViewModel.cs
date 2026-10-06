using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

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

        // TODO: In a real implementation, we'd verify the hash/unlock the DB here.
        // For scaffolding, we just navigate to the dashboard.
        _mainViewModel.NavigateTo(new DashboardViewModel(_mainViewModel));
    }
}
