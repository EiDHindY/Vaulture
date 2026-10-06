using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using System;
using System.IO;
using Vaulture.Core.Data;
using Vaulture.Core.Services;

namespace Vaulture.Desktop.ViewModels;

public partial class RecoveryKeyViewModel : ViewModelBase
{
    private readonly MainViewModel _mainViewModel;
    private readonly VaultDbContext _dbContext;

    [ObservableProperty]
    public partial string RecoveryKey { get; set; }

    public RecoveryKeyViewModel(MainViewModel mainViewModel, VaultDbContext dbContext, string masterPassword)
    {
        _mainViewModel = mainViewModel;
        _dbContext = dbContext;

        string appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
        string recoveryPath = Path.Combine(appData, "Vaulture", "recovery.dat");

        RecoveryKey = EncryptionService.GenerateRecoveryKey();
        EncryptionService.CreateRecoveryFile(masterPassword, RecoveryKey, recoveryPath);
    }

    [RelayCommand]
    private void ContinueToDashboard()
    {
        _mainViewModel.NavigateTo(new DashboardViewModel(_mainViewModel, _dbContext));
    }
}
