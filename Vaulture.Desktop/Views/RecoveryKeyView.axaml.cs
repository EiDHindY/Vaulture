using Avalonia.Controls;
using Avalonia.Interactivity;
using Avalonia.Input.Platform;
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
        if (topLevel?.Clipboard != null && sender is Button btn && btn.CommandParameter is string textToCopy)
        {
            await topLevel.Clipboard.SetTextAsync(textToCopy);
            
            var oldContent = btn.Content;
            btn.Content = "Copied!";
            await System.Threading.Tasks.Task.Delay(2000);
            btn.Content = oldContent;
        }
    }
}
