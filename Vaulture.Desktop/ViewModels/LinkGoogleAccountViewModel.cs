using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Vaulture.Core.Data;
using Vaulture.Core.Services;
using System.Threading.Tasks;

namespace Vaulture.Desktop.ViewModels;

public partial class LinkGoogleAccountViewModel : ViewModelBase
{
    private readonly MainViewModel _mainViewModel;
    private readonly VaultDbContext _dbContext;

    [ObservableProperty]
    public partial string StatusMessage { get; set; } = string.Empty;

    public LinkGoogleAccountViewModel(MainViewModel mainViewModel, VaultDbContext dbContext)
    {
        _mainViewModel = mainViewModel;
        _dbContext = dbContext;
    }

    [RelayCommand]
    private async Task LinkGoogleAccount()
    {
        StatusMessage = "Opening browser for authentication...";
        try
        {
            await NotificationService.AuthenticateAsync();
            StatusMessage = "Google Account successfully linked!";
            
            // Give them a moment to read the success message
            await Task.Delay(1500);
            
            await NotificationService.SendNotificationAsync(
                "Vaulture: Email Notifications Enabled", 
                "Your Google Account has been successfully linked to Vaulture. You will now receive security alerts when important actions occur in your vault.");
                
            ContinueToDashboard();
        }
        catch (System.Exception ex)
        {
            StatusMessage = "Failed to link account: " + ex.Message;
        }
    }

    [RelayCommand]
    private void Skip()
    {
        ContinueToDashboard();
    }
    
    private void ContinueToDashboard()
    {
        _mainViewModel.NavigateTo(new DashboardViewModel(_mainViewModel, _dbContext));
    }
}
