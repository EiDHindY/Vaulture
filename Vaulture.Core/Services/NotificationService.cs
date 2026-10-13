using System;
using System.Threading.Tasks;

namespace Vaulture.Core.Services;

public static class NotificationService
{
    public static async Task SendNotificationAsync(string subject, string body, string color = "#3498db", string emoji = "ℹ️")
    {
        try
        {
            if (SupabaseService.IsLinked)
            {
                var profile = SupabaseService.GetUserProfile();
                if (!string.IsNullOrEmpty(profile.Email))
                {
                    await EmailService.SendSecurityAlertAsync(profile.Email, profile.Name, subject, body, color, emoji);
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to send notification: {ex.Message}");
        }
    }
}
