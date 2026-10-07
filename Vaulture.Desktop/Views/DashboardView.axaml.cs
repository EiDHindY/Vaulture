using Avalonia.Controls;
using Avalonia.Input.Platform;

namespace Vaulture.Desktop.Views;

public partial class DashboardView : UserControl
{
    public DashboardView()
    {
        InitializeComponent();
    }

    private async void CopyKey_Click(object? sender, Avalonia.Interactivity.RoutedEventArgs e)
    {
        var topLevel = Avalonia.Controls.TopLevel.GetTopLevel(this);
        if (topLevel?.Clipboard != null && sender is Avalonia.Controls.Button btn && btn.CommandParameter is string textToCopy)
        {
            await topLevel.Clipboard.SetTextAsync(textToCopy);
            
            var oldContent = btn.Content;
            btn.Content = "Copied!";
            await System.Threading.Tasks.Task.Delay(2000);
            btn.Content = oldContent;
        }
    }
}
