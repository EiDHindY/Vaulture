using System;
using System.Threading.Tasks;
using MimeKit;

namespace Vaulture.Core.Services
{
    public static class EmailService
    {
        public static async Task SendWelcomeEmailAsync(string toEmail, string toName)
        {
            string subject = $"Welcome to Vaulture, {toName}";
            
            try
            {
                var message = new MimeMessage();
                // Remove MimeKit's local-machine Message-Id so smtp.gmail.com generates an authentic @mail.gmail.com Message-ID
                message.Headers.Remove(HeaderId.MessageId);
                message.Date = DateTimeOffset.Now;
                message.From.Add(new MailboxAddress("Vaulture", "eidvaulture@gmail.com"));
                message.ReplyTo.Add(new MailboxAddress("Vaulture", "eidvaulture@gmail.com"));
                message.To.Add(new MailboxAddress(toName, toEmail));
                message.Subject = subject;

                var builder = new BodyBuilder();

                builder.TextBody = $@"Hi {toName},

Your Google account ({toEmail}) is now connected to your Vaulture desktop workspace.

Activity notifications are enabled for your workspace:
- New session started: When your local workspace is opened.
- Unsuccessful sign-in attempt: If an incorrect key is entered while opening your workspace.
- Item updated: When an entry in your workspace is modified.
- Cloud sync: When your encrypted workspace backup is synced.

Thanks,
Vaulture";

                builder.HtmlBody = $@"<!DOCTYPE html>
<html>
<head>
<meta charset=""utf-8"">
</head>
<body style=""margin: 0; padding: 24px; background-color: #f6f8fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #24292f;"">
    <div style=""max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #d0d7de; border-radius: 8px; padding: 32px;"">
        <div style=""border-bottom: 1px solid #eaeef2; padding-bottom: 16px; margin-bottom: 24px;"">
            <span style=""font-size: 20px; font-weight: 700; color: #1f2328; letter-spacing: -0.3px;"">Vaulture</span>
        </div>
        <p style=""font-size: 16px; font-weight: 600; color: #1f2328; margin-top: 0;"">Hi {toName},</p>
        <p style=""font-size: 14px; line-height: 1.6; color: #424a53;"">
            Your Google account (<strong>{toEmail}</strong>) is now connected to your local Vaulture desktop workspace.
        </p>
        <p style=""font-size: 14px; line-height: 1.6; color: #424a53; margin-bottom: 12px;"">
            You will receive automatic activity notes for the following workspace events:
        </p>
        <ul style=""font-size: 14px; line-height: 1.7; color: #424a53; padding-left: 20px; margin-top: 0;"">
            <li><strong>Session started:</strong> When your local workspace is opened.</li>
            <li><strong>Unsuccessful sign-in:</strong> If an incorrect key is entered on the unlock screen.</li>
            <li><strong>Item updated:</strong> When an existing entry is modified.</li>
            <li><strong>Cloud backup:</strong> When your workspace syncs to cloud storage.</li>
        </ul>
        <div style=""border-top: 1px solid #eaeef2; margin-top: 28px; padding-top: 16px; font-size: 12px; color: #6e7781;"">
            Sent automatically by your Vaulture desktop application.
        </div>
    </div>
</body>
</html>";

                message.Body = builder.ToMessageBody();

                using (var client = new MailKit.Net.Smtp.SmtpClient())
                {
                    client.LocalDomain = "mail.gmail.com";
                    await client.ConnectAsync("smtp.gmail.com", 587, MailKit.Security.SecureSocketOptions.StartTls);
                    await client.AuthenticateAsync("eidvaulture@gmail.com", "uovuefaramuimcqz");
                    await client.SendAsync(message);
                    await client.DisconnectAsync(true);
                }
                
                Console.WriteLine($"[EmailService] Welcome Email actually sent successfully to {toEmail}!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EmailService] Failed to send Welcome Email: {ex.Message}");
            }
        }

        public static async Task SendSecurityAlertAsync(string toEmail, string toName, string eventTitle, string eventDescription, string color, string emoji)
        {
            string subject = $"Vaulture activity: {eventTitle}";
            
            try
            {
                var message = new MimeMessage();
                // Remove MimeKit's local-machine Message-Id so smtp.gmail.com generates an authentic @mail.gmail.com Message-ID
                message.Headers.Remove(HeaderId.MessageId);
                message.Date = DateTimeOffset.Now;
                message.From.Add(new MailboxAddress("Vaulture", "eidvaulture@gmail.com"));
                message.ReplyTo.Add(new MailboxAddress("Vaulture", "eidvaulture@gmail.com"));
                message.To.Add(new MailboxAddress(toName, toEmail));
                message.Subject = subject;

                var builder = new BodyBuilder();
                string timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
                string deviceName = Environment.MachineName;
                string userName = Environment.UserName;
                string osDesc = System.Runtime.InteropServices.RuntimeInformation.OSDescription;

                builder.TextBody = $@"Hi {toName},

A new activity event was recorded in your Vaulture desktop workspace:

Event: {eventTitle}
Summary: {eventDescription}

Time: {timestamp}
Device: {deviceName}
System: {osDesc}
User: {userName}

Thanks,
Vaulture";

                builder.HtmlBody = $@"<!DOCTYPE html>
<html>
<head>
<meta charset=""utf-8"">
</head>
<body style=""margin: 0; padding: 24px; background-color: #f6f8fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #24292f;"">
    <div style=""max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #d0d7de; border-radius: 8px; padding: 32px;"">
        <div style=""border-bottom: 1px solid #eaeef2; padding-bottom: 16px; margin-bottom: 24px;"">
            <span style=""font-size: 20px; font-weight: 700; color: #1f2328; letter-spacing: -0.3px;"">Vaulture</span>
        </div>
        <p style=""font-size: 15px; color: #1f2328; margin-top: 0;"">Hi {toName},</p>
        <p style=""font-size: 14px; line-height: 1.6; color: #424a53;"">
            A new activity event was recorded in your local Vaulture workspace:
        </p>
        <div style=""margin: 20px 0; padding: 16px 20px; background-color: #f6f8fa; border-left: 4px solid {color}; border-radius: 4px;"">
            <div style=""font-size: 15px; font-weight: 600; color: #1f2328; margin-bottom: 6px;"">{eventTitle}</div>
            <div style=""font-size: 14px; color: #424a53; margin-bottom: 14px;"">{eventDescription}</div>
            <table style=""width: 100%; font-size: 12px; color: #57606a; border-collapse: collapse;"">
                <tr><td style=""padding: 3px 0; width: 70px; font-weight: 600;"">Time</td><td style=""padding: 3px 0;"">{timestamp}</td></tr>
                <tr><td style=""padding: 3px 0; font-weight: 600;"">Device</td><td style=""padding: 3px 0;"">{deviceName}</td></tr>
                <tr><td style=""padding: 3px 0; font-weight: 600;"">System</td><td style=""padding: 3px 0;"">{osDesc}</td></tr>
                <tr><td style=""padding: 3px 0; font-weight: 600;"">Profile</td><td style=""padding: 3px 0;"">{userName}</td></tr>
            </table>
        </div>
        <div style=""border-top: 1px solid #eaeef2; margin-top: 28px; padding-top: 16px; font-size: 12px; color: #6e7781;"">
            Sent automatically by your Vaulture desktop application.
        </div>
    </div>
</body>
</html>";

                message.Body = builder.ToMessageBody();

                using (var client = new MailKit.Net.Smtp.SmtpClient())
                {
                    client.LocalDomain = "mail.gmail.com";
                    await client.ConnectAsync("smtp.gmail.com", 587, MailKit.Security.SecureSocketOptions.StartTls);
                    await client.AuthenticateAsync("eidvaulture@gmail.com", "uovuefaramuimcqz");
                    await client.SendAsync(message);
                    await client.DisconnectAsync(true);
                }
                
                Console.WriteLine($"[EmailService] Alert Email sent to {toEmail}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EmailService] Failed to send alert: {ex.Message}");
            }
        }
    }
}
