using CommunityToolkit.Mvvm.ComponentModel;
using System;

namespace Vaulture.Desktop.ViewModels;

public partial class MainViewModel : ViewModelBase
{
    [ObservableProperty]
    public partial ViewModelBase CurrentViewModel { get; set; } = null!;

    public MainViewModel()
    {
        // On startup, we show the login screen
        CurrentViewModel = new LoginViewModel(this);
    }

    public void NavigateTo(ViewModelBase viewModel)
    {
        CurrentViewModel = viewModel;
    }
}
