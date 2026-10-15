using System;
using System.Threading.Tasks;
using MimeKit;

namespace Vaulture.Core.Services
{
    public static class EmailService
    {
        private static byte[]? GetLogoBytes()
        {
            try
            {
                var asm = typeof(EmailService).Assembly;
                using var stream = asm.GetManifestResourceStream("Vaulture.Core.Assets.logo.png");
                if (stream != null)
                {
                    using var ms = new System.IO.MemoryStream();
                    stream.CopyTo(ms);
                    return ms.ToArray();
                }
            }
            catch { }

            string[] fallbackPaths = new[]
            {
                System.IO.Path.Combine(AppContext.BaseDirectory, "Assets", "logo.png"),
                System.IO.Path.Combine(System.IO.Directory.GetCurrentDirectory(), "Assets", "logo.png"),
                System.IO.Path.Combine(System.IO.Directory.GetCurrentDirectory(), "Vaulture.Core", "Assets", "logo.png"),
                System.IO.Path.Combine(System.IO.Directory.GetCurrentDirectory(), "ui", "public", "logo.png"),
                System.IO.Path.Combine(System.IO.Directory.GetCurrentDirectory(), "Vaulture.Photino", "ui", "public", "logo.png"),
                "/home/dod/Projects/Vaulture/Vaulture.Core/Assets/logo.png",
                "/home/dod/Projects/Vaulture/Vaulture.Photino/ui/public/logo.png"
            };

            foreach (var path in fallbackPaths)
            {
                if (System.IO.File.Exists(path))
                {
                    try { return System.IO.File.ReadAllBytes(path); } catch { }
                }
            }

            return null;
        }

        public static async Task SendWelcomeEmailAsync(string toEmail, string toName)
        {
            string subject = $"Welcome to Vaulture, {toName}";
            
            try
            {
                var message = new MimeMessage();
                message.Headers.Remove(HeaderId.MessageId);
                message.Date = DateTimeOffset.Now;
                message.From.Add(new MailboxAddress("Vaulture", "eidvaulture@gmail.com"));
                message.ReplyTo.Add(new MailboxAddress("Vaulture", "eidvaulture@gmail.com"));
                message.To.Add(new MailboxAddress(toName, toEmail));
                message.Subject = subject;

                var builder = new BodyBuilder();

                var logoBytes = GetLogoBytes();
                if (logoBytes != null && logoBytes.Length > 0)
                {
                    var img = builder.LinkedResources.Add("logo.png", logoBytes, new ContentType("image", "png"));
                    img.ContentId = "vaulture-logo";
                    img.ContentDisposition = new ContentDisposition(ContentDisposition.Inline);
                }

                string timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
                string deviceName = Environment.MachineName;
                string userName = Environment.UserName;
                string osDesc = System.Runtime.InteropServices.RuntimeInformation.OSDescription;

                builder.TextBody = $@"Hi {toName},

Your Google account ({toEmail}) is now connected to your Vaulture desktop workspace.

Action: Google Account Connected
Time: {timestamp}
Device: {deviceName}
System: {osDesc}
Profile: {userName}

Activity notifications are active for your workspace:
- Session Started: When your local workspace is unlocked.
- Unsuccessful Sign-In: If an incorrect key is entered.
- Vault Entry Updated: When a saved item is modified.
- Cloud Backup: When your encrypted vault backup syncs.

Thanks,
Vaulture Team";

                builder.HtmlBody = $@"<!DOCTYPE html>
<html>
<head>
<meta charset=""utf-8"">
<meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
</head>
<body style=""margin: 0; padding: 36px 16px; background-color: #0a0a0c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;"">
    <div style=""max-width: 520px; margin: 0 auto; background-color: #17171a; border: 1px solid #27272a; border-radius: 18px; padding: 36px 30px; box-shadow: 0 16px 36px rgba(0, 0, 0, 0.5);"">
        
        <!-- Header with App Logo -->
        <div style=""text-align: center; margin-bottom: 24px;"">
            <img src=""cid:vaulture-logo"" width=""64"" height=""64"" alt=""Vaulture Logo"" style=""display: block; width: 64px; height: 64px; margin: 0 auto 12px auto; object-fit: contain; border-radius: 50%;"" />
            <h1 style=""margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.4px;"">Vaulture</h1>
            <p style=""margin: 4px 0 0 0; font-size: 13px; color: #71717a;"">Personal Encrypted Vault</p>
        </div>

        <div style=""height: 1px; background-color: #27272a; margin: 20px 0 24px 0;""></div>

        <p style=""font-size: 15px; font-weight: 600; color: #ffffff; margin: 0 0 10px 0;"">Welcome, {toName}!</p>
        <p style=""font-size: 14px; line-height: 1.6; color: #a1a1aa; margin: 0 0 20px 0;"">
            Your Google account (<span style=""color: #10b981; font-weight: 500;"">{toEmail}</span>) is now connected to your local Vaulture workspace.
        </p>

        <!-- Notification Overview Box -->
        <div style=""background-color: #0e0e11; border: 1px solid #27272a; border-left: 4px solid #10b981; border-radius: 10px; padding: 18px 20px; margin-bottom: 24px;"">
            <div style=""font-size: 14px; font-weight: 600; color: #ffffff; margin-bottom: 12px;"">Automatic Activity Notifications</div>
            <ul style=""list-style-type: none; padding: 0; margin: 0; font-size: 13px; line-height: 1.8; color: #a1a1aa;"">
                <li style=""margin-bottom: 6px;""><strong style=""color: #e4e4e7;"">Session Started:</strong> When your local workspace is unlocked.</li>
                <li style=""margin-bottom: 6px;""><strong style=""color: #e4e4e7;"">Unsuccessful Sign-In:</strong> When an incorrect key is entered.</li>
                <li style=""margin-bottom: 6px;""><strong style=""color: #e4e4e7;"">Vault Entry Updated:</strong> When a saved item is modified.</li>
                <li><strong style=""color: #e4e4e7;"">Cloud Backup:</strong> When your encrypted vault syncs to cloud storage.</li>
            </ul>

            <div style=""background-color: #141418; border: 1px solid #222226; border-radius: 8px; padding: 12px 14px; margin-top: 16px;"">
                <table style=""width: 100%; font-size: 12px; color: #71717a; border-collapse: collapse;"">
                    <tr>
                        <td style=""padding: 4px 0; width: 65px; font-weight: 600; color: #71717a;"">Action</td>
                        <td style=""padding: 4px 0; color: #f4f4f5; font-weight: 600;"">Google Account Connected</td>
                    </tr>
                    <tr>
                        <td style=""padding: 4px 0; font-weight: 600; color: #71717a;"">Time</td>
                        <td style=""padding: 4px 0; color: #e4e4e7; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;"">{timestamp}</td>
                    </tr>
                    <tr>
                        <td style=""padding: 4px 0; font-weight: 600; color: #71717a;"">Device</td>
                        <td style=""padding: 4px 0; color: #e4e4e7;"">{deviceName}</td>
                    </tr>
                    <tr>
                        <td style=""padding: 4px 0; font-weight: 600; color: #71717a;"">System</td>
                        <td style=""padding: 4px 0; color: #e4e4e7;"">{osDesc}</td>
                    </tr>
                    <tr>
                        <td style=""padding: 4px 0; font-weight: 600; color: #71717a;"">Profile</td>
                        <td style=""padding: 4px 0; color: #e4e4e7;"">{userName}</td>
                    </tr>
                </table>
            </div>
        </div>

        <div style=""border-top: 1px solid #27272a; margin-top: 28px; padding-top: 18px; text-align: center; font-size: 12px; color: #71717a; line-height: 1.5;"">
            End-to-End Encrypted Desktop Vault<br>
            <span style=""font-size: 11px; color: #52525b;"">Sent automatically by your Vaulture desktop application.</span>
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
                message.Headers.Remove(HeaderId.MessageId);
                message.Date = DateTimeOffset.Now;
                message.From.Add(new MailboxAddress("Vaulture", "eidvaulture@gmail.com"));
                message.ReplyTo.Add(new MailboxAddress("Vaulture", "eidvaulture@gmail.com"));
                message.To.Add(new MailboxAddress(toName, toEmail));
                message.Subject = subject;

                var builder = new BodyBuilder();

                var logoBytes = GetLogoBytes();
                if (logoBytes != null && logoBytes.Length > 0)
                {
                    var img = builder.LinkedResources.Add("logo.png", logoBytes, new ContentType("image", "png"));
                    img.ContentId = "vaulture-logo";
                    img.ContentDisposition = new ContentDisposition(ContentDisposition.Inline);
                }

                string timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
                string deviceName = Environment.MachineName;
                string userName = Environment.UserName;
                string osDesc = System.Runtime.InteropServices.RuntimeInformation.OSDescription;
                string accentColor = string.IsNullOrWhiteSpace(color) ? "#10b981" : color;

                builder.TextBody = $@"Hi {toName},

A new activity event was recorded in your Vaulture desktop workspace:

Action: {eventTitle}
Time: {timestamp}
Device: {deviceName}
System: {osDesc}
Profile: {userName}

Summary: {eventDescription}

Thanks,
Vaulture Team";

                builder.HtmlBody = $@"<!DOCTYPE html>
<html>
<head>
<meta charset=""utf-8"">
<meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
</head>
<body style=""margin: 0; padding: 36px 16px; background-color: #0a0a0c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;"">
    <div style=""max-width: 520px; margin: 0 auto; background-color: #17171a; border: 1px solid #27272a; border-radius: 18px; padding: 36px 30px; box-shadow: 0 16px 36px rgba(0, 0, 0, 0.5);"">
        
        <!-- Header with App Logo -->
        <div style=""text-align: center; margin-bottom: 24px;"">
            <img src=""cid:vaulture-logo"" width=""64"" height=""64"" alt=""Vaulture Logo"" style=""display: block; width: 64px; height: 64px; margin: 0 auto 12px auto; object-fit: contain; border-radius: 50%;"" />
            <h1 style=""margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.4px;"">Vaulture</h1>
            <p style=""margin: 4px 0 0 0; font-size: 13px; color: #71717a;"">Personal Encrypted Vault</p>
        </div>

        <div style=""height: 1px; background-color: #27272a; margin: 20px 0 24px 0;""></div>

        <p style=""font-size: 15px; font-weight: 600; color: #ffffff; margin: 0 0 8px 0;"">Hi {toName},</p>
        <p style=""font-size: 14px; line-height: 1.6; color: #a1a1aa; margin: 0 0 20px 0;"">
            A new activity event was recorded in your local Vaulture workspace:
        </p>

        <!-- Event Box -->
        <div style=""background-color: #0e0e11; border: 1px solid #27272a; border-left: 4px solid {accentColor}; border-radius: 10px; padding: 18px 20px; margin-bottom: 24px;"">
            <div style=""font-size: 15px; font-weight: 600; color: #ffffff; margin-bottom: 6px;"">{eventTitle}</div>
            <div style=""font-size: 13px; line-height: 1.5; color: #a1a1aa; margin-bottom: 16px;"">{eventDescription}</div>
            
            <div style=""background-color: #141418; border: 1px solid #222226; border-radius: 8px; padding: 12px 14px;"">
                <table style=""width: 100%; font-size: 12px; color: #71717a; border-collapse: collapse;"">
                    <tr>
                        <td style=""padding: 4px 0; width: 65px; font-weight: 600; color: #71717a;"">Action</td>
                        <td style=""padding: 4px 0; color: #f4f4f5; font-weight: 600;"">{eventTitle}</td>
                    </tr>
                    <tr>
                        <td style=""padding: 4px 0; font-weight: 600; color: #71717a;"">Time</td>
                        <td style=""padding: 4px 0; color: #e4e4e7; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;"">{timestamp}</td>
                    </tr>
                    <tr>
                        <td style=""padding: 4px 0; font-weight: 600; color: #71717a;"">Device</td>
                        <td style=""padding: 4px 0; color: #e4e4e7;"">{deviceName}</td>
                    </tr>
                    <tr>
                        <td style=""padding: 4px 0; font-weight: 600; color: #71717a;"">System</td>
                        <td style=""padding: 4px 0; color: #e4e4e7;"">{osDesc}</td>
                    </tr>
                    <tr>
                        <td style=""padding: 4px 0; font-weight: 600; color: #71717a;"">Profile</td>
                        <td style=""padding: 4px 0; color: #e4e4e7;"">{userName}</td>
                    </tr>
                </table>
            </div>
        </div>

        <div style=""border-top: 1px solid #27272a; margin-top: 28px; padding-top: 18px; text-align: center; font-size: 12px; color: #71717a; line-height: 1.5;"">
            End-to-End Encrypted Desktop Vault<br>
            <span style=""font-size: 11px; color: #52525b;"">Sent automatically by your Vaulture desktop application.</span>
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
