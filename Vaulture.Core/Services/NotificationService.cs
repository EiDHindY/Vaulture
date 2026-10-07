using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Gmail.v1;
using Google.Apis.Gmail.v1.Data;
using Google.Apis.Services;
using Google.Apis.Util.Store;
using MimeKit;

namespace Vaulture.Core.Services;

public static class NotificationService
{
    private static readonly string[] Scopes = { GmailService.Scope.GmailSend, "https://www.googleapis.com/auth/drive.file" };
    
    // We will use a placeholder client ID and secret since this is a local app
    // In production, you would create an OAuth 2.0 Client ID in Google Cloud Console
    private const string ClientId = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
    private const string ClientSecret = "YOUR_GOOGLE_CLIENT_SECRET";

    public static async Task<UserCredential> AuthenticateAsync()
    {
        string appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
        string credPath = Path.Combine(appData, "Vaulture", "Google.Apis.Auth");

        var secrets = new ClientSecrets
        {
            ClientId = ClientId,
            ClientSecret = ClientSecret
        };

        // Note: For a real local app, ClientId must be a real Desktop Client ID
        return await GoogleWebAuthorizationBroker.AuthorizeAsync(
            secrets,
            Scopes,
            "user",
            CancellationToken.None,
            new FileDataStore(credPath, true));
    }

    public static async Task SendNotificationAsync(string subject, string body)
    {
        try
        {
            string machineName = Environment.MachineName;
            string timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
            string fullBody = $"{body}\n\n---\nSecurity Metadata:\nTime: {timestamp}\nDevice: {machineName}";

            if (ClientId == "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com")
            {
                Console.WriteLine("----------------------------------------");
                Console.WriteLine($"[SIMULATED EMAIL TO SELF]");
                Console.WriteLine($"Subject: {subject}");
                Console.WriteLine($"Body:\n{fullBody}");
                Console.WriteLine("----------------------------------------");
                return;
            }

            var credential = await AuthenticateAsync();

            var service = new GmailService(new BaseClientService.Initializer
            {
                HttpClientInitializer = credential,
                ApplicationName = "Vaulture"
            });

            // Get the user's email address by making a call to their profile
            var profile = await service.Users.GetProfile("me").ExecuteAsync();
            string emailAddress = profile.EmailAddress;

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress("Vaulture Security", emailAddress));
            message.To.Add(new MailboxAddress("Me", emailAddress));
            message.Subject = subject;
            
            message.Body = new TextPart("plain") { Text = fullBody };

            using var memoryStream = new MemoryStream();
            await message.WriteToAsync(memoryStream);
            
            var rawMessage = Convert.ToBase64String(memoryStream.ToArray())
                .Replace("+", "-")
                .Replace("/", "_")
                .Replace("=", "");

            var gmailMessage = new Message { Raw = rawMessage };
            
            await service.Users.Messages.Send(gmailMessage, "me").ExecuteAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to send notification: {ex.Message}");
            // Fail silently so it doesn't crash the app if offline
        }
    }
}
