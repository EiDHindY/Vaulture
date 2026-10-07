using Avalonia.Controls;
using Avalonia.Interactivity;
using Vaulture.Desktop.ViewModels;

namespace Vaulture.Desktop.Views;

public partial class RecoveryKeyView : UserControl
{
    public RecoveryKeyView()
    {
        InitializeComponent();
    }

    private async void CopyKey_Click(object? sender, RoutedEventArgs e)
    {
        var topLevel = TopLevel.GetTopLevel(this);
        if (topLevel?.Clipboard != null && DataContext is RecoveryKeyViewModel vm)
        {
            await topLevel.Clipboard.SetTextAsync(vm.RecoveryKey);
            
            if (sender is Button btn)
            {
                var oldContent = btn.Content;
                btn.Content = "Copied!";
                await System.Threading.Tasks.Task.Delay(2000);
                btn.Content = oldContent;
            }
        }
    }
}
