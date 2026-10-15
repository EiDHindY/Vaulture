using System;
using System.Diagnostics;
using System.Net;
using System.IO;
using System.Net.Http;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;
using Supabase.Gotrue;

namespace Vaulture.Core.Services
{
    public static class SupabaseService
    {
        public static Supabase.Client Client { get; private set; } = null!;

        public static async Task InitializeAsync()
        {
            var url = "https://efeulgghyeplxyyvisxb.supabase.co";
            var key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmZXVsZ2doeWVwbHh5eXZpc3hiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzODIxNjYsImV4cCI6MjEwNjk1ODE2Nn0.atZ5gz7hN9QHOJTdC1rVqcbrYL020QCqwTCSzpc1aD8";

            var options = new Supabase.SupabaseOptions
            {
                AutoRefreshToken = true,
                AutoConnectRealtime = false,
                SessionHandler = new DiskSessionHandler()
            };

            Client = new Supabase.Client(url, key, options);
            await Client.InitializeAsync();
        }

        private static HttpListener? _currentListener;
        private static readonly object _listenerLock = new();

        public static void CancelPendingAuth()
        {
            lock (_listenerLock)
            {
                if (_currentListener != null)
                {
                    try { _currentListener.Stop(); _currentListener.Close(); } catch { }
                    _currentListener = null;
                }
            }
        }

        public static async Task AuthenticateWithGoogleAsync(Action<string>? onAuthUrl = null, CancellationToken ct = default)
        {
            CancelPendingAuth();

            var redirectUri = "http://127.0.0.1:54321/callback/";
            
            var signInOptions = new SignInOptions
            {
                RedirectTo = redirectUri,
                FlowType = Supabase.Gotrue.Constants.OAuthFlowType.PKCE,
                QueryParams = new Dictionary<string, string>
                {
                    { "prompt", "select_account" }
                }
            };

            var providerState = await Client.Auth.SignIn(Supabase.Gotrue.Constants.Provider.Google, signInOptions);
            string authUrl = providerState.Uri.ToString();
            onAuthUrl?.Invoke(authUrl);
            
            // Start HttpListener
            var listener = new HttpListener();
            listener.Prefixes.Add(redirectUri);
            lock (_listenerLock)
            {
                _currentListener = listener;
            }
            listener.Start();

            // Open browser
            OpenBrowser(authUrl);

            // Wait for response with timeout
            using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(90));
            using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(ct, timeoutCts.Token);
            using var reg = linkedCts.Token.Register(() =>
            {
                try { listener.Stop(); } catch { }
            });
            
            try
            {
                var context = await listener.GetContextAsync();
                var response = context.Response;
                
                string? code = context.Request.QueryString["code"];
                
                if (!string.IsNullOrEmpty(code) && providerState.PKCEVerifier != null)
                {
                    await Client.Auth.ExchangeCodeForSession(providerState.PKCEVerifier, code);
                    
                    string responseString = """
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <title>Vaulture - Authenticated</title>
                        <style>
                            body {
                                background-color: #121214;
                                color: #ffffff;
                                font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: center;
                                height: 100vh;
                                margin: 0;
                                user-select: none;
                            }
                            .container {
                                text-align: center;
                                background-color: #1e1e24;
                                padding: 40px 32px;
                                border-radius: 16px;
                                box-shadow: 0 12px 32px rgba(0,0,0,0.6);
                                border: 1px solid #2a2a36;
                                max-width: 440px;
                                width: 90%;
                                box-sizing: border-box;
                            }
                            .success-icon {
                                color: #10b981;
                                font-size: 42px;
                                margin-bottom: 12px;
                                font-weight: bold;
                                line-height: 1;
                            }
                            h1 { margin: 0 0 10px 0; font-size: 22px; font-weight: 700; color: #f3f4f6; }
                            p { color: #9ca3af; margin: 0 0 20px 0; font-size: 14px; line-height: 1.5; }
                            .sub-text { font-size: 13px; color: #6b7280; margin-top: 16px; line-height: 1.4; }
                            .close-btn {
                                display: inline-flex;
                                align-items: center;
                                justify-content: center;
                                gap: 8px;
                                width: 100%;
                                padding: 12px 24px;
                                background-color: #10b981;
                                color: #ffffff;
                                border: none;
                                border-radius: 10px;
                                font-weight: 600;
                                font-size: 15px;
                                cursor: pointer;
                                box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
                                transition: all 0.2s ease;
                                box-sizing: border-box;
                            }
                            .close-btn:hover {
                                background-color: #059669;
                                box-shadow: 0 6px 18px rgba(16, 185, 129, 0.45);
                            }
                            .close-btn:active {
                                transform: scale(0.98);
                            }
                            .btn-clicked {
                                background-color: #272732 !important;
                                color: #9ca3af !important;
                                border: 1px solid #3f3f50 !important;
                                box-shadow: none !important;
                                cursor: default !important;
                            }
                            .hint-box {
                                display: none;
                                background: rgba(16, 185, 129, 0.08);
                                border: 1px solid rgba(16, 185, 129, 0.25);
                                border-radius: 10px;
                                padding: 14px;
                                margin-top: 16px;
                                font-size: 13px;
                                line-height: 1.6;
                                color: #d1fae5;
                                text-align: center;
                                animation: fadeIn 0.3s ease;
                            }
                            @keyframes fadeIn {
                                from { opacity: 0; transform: translateY(-4px); }
                                to { opacity: 1; transform: translateY(0); }
                            }
                            kbd {
                                background: #111116;
                                border: 1px solid #374151;
                                border-radius: 4px;
                                padding: 2px 6px;
                                font-family: inherit;
                                font-size: 12px;
                                color: #f9fafb;
                                box-shadow: 0 1px 2px rgba(0,0,0,0.4);
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <img src="data:image/png;base64,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" alt="Vaulture Logo" style="width: 100px; height: 100px; margin-bottom: 20px; border-radius: 50%; box-shadow: 0 4px 12px rgba(0,0,0,0.3);" />
                            <div class="success-icon">✓</div>
                            <h1>Authentication Successful</h1>
                            <p>You have successfully linked your Google account to Vaulture.</p>
                            <button id="closeBtn" class="close-btn" onclick="handleClose();">
                                <span>Close Tab</span>
                            </button>
                            <div id="hintBox" class="hint-box">
                                <strong>Return to Vaulture</strong><br>
                                Browser security prevents tabs opened by other apps from closing automatically.<br>
                                Press <kbd>Ctrl + W</kbd> (or <kbd>⌘ + W</kbd>) or click the <strong>✕</strong> on this tab.
                            </div>
                            <div id="subText" class="sub-text">You can safely close this browser tab and return to the Vaulture app.</div>
                        </div>
                        <script>
                            function tryClose() {
                                try {
                                    window.open('', '_self', '');
                                    window.close();
                                } catch (e) {}
                            }

                            function handleClose() {
                                tryClose();
                                const btn = document.getElementById('closeBtn');
                                const hint = document.getElementById('hintBox');
                                const sub = document.getElementById('subText');
                                if (btn) {
                                    btn.classList.add('btn-clicked');
                                    btn.innerHTML = '<span>✓ Ready to Close (Ctrl+W)</span>';
                                }
                                if (hint) {
                                    hint.style.display = 'block';
                                }
                                if (sub) {
                                    sub.style.display = 'none';
                                }
                            }

                            // Attempt to auto-close the tab after 1.5 seconds
                            setTimeout(tryClose, 1500);
                        </script>
                    </body>
                    </html>
                    """;
                    byte[] buffer = System.Text.Encoding.UTF8.GetBytes(responseString);
                    response.ContentLength64 = buffer.Length;
                    await response.OutputStream.WriteAsync(buffer, 0, buffer.Length);
                }
                else
                {
                    string responseString = "<html><body><h1>Authentication Failed</h1><p>No code returned.</p></body></html>";
                    byte[] buffer = System.Text.Encoding.UTF8.GetBytes(responseString);
                    response.ContentLength64 = buffer.Length;
                    await response.OutputStream.WriteAsync(buffer, 0, buffer.Length);
                }
                
                response.Close();
            }
            catch (HttpListenerException)
            {
                throw new OperationCanceledException("Authentication cancelled.");
            }
            catch (ObjectDisposedException)
            {
                throw new OperationCanceledException("Authentication cancelled.");
            }
            catch (Exception ex)
            {
                throw new Exception("Supabase Auth Error: " + ex.Message, ex);
            }
            finally
            {
                lock (_listenerLock)
                {
                    if (_currentListener == listener)
                        _currentListener = null;
                }
                try { listener.Close(); } catch { }
            }
        }

        public record CloudBackupData(byte[] DatabaseBytes, byte[]? RecoveryBytes, string? LastModified);

        public record CloudBackupStatus(
            bool IsLinked,
            bool Exists,
            bool IsUpToDate,
            string? LastModifiedFormatted,
            DateTime? LastModifiedUtc,
            string? ErrorMessage = null
        );

        public static async Task<CloudBackupStatus> GetBackupStatusAsync(string dbFilePath)
        {
            try
            {
                var user = Client?.Auth?.CurrentUser ?? new DiskSessionHandler().LoadSession()?.User;
                if (user == null || string.IsNullOrEmpty(user.Id))
                {
                    return new CloudBackupStatus(
                        IsLinked: false,
                        Exists: false,
                        IsUpToDate: false,
                        LastModifiedFormatted: null,
                        LastModifiedUtc: null,
                        ErrorMessage: null
                    );
                }

                if (Client == null) await InitializeAsync();
                if (Client == null)
                {
                    return new CloudBackupStatus(
                        IsLinked: true,
                        Exists: false,
                        IsUpToDate: false,
                        LastModifiedFormatted: null,
                        LastModifiedUtc: null,
                        ErrorMessage: "Failed to connect to Supabase."
                    );
                }

                var storage = Client.Storage.From("vault-backups");
                var files = await storage.List(user.Id);
                var dbMeta = files?.FirstOrDefault(f => f.Name == "vault.db");

                if (dbMeta == null)
                {
                    return new CloudBackupStatus(
                        IsLinked: true,
                        Exists: false,
                        IsUpToDate: false,
                        LastModifiedFormatted: null,
                        LastModifiedUtc: null,
                        ErrorMessage: null
                    );
                }

                var cloudTime = dbMeta.UpdatedAt ?? dbMeta.CreatedAt;
                string? formatted = cloudTime?.ToLocalTime().ToString("MMM d, yyyy h:mm tt");

                bool isUpToDate = true;
                if (File.Exists(dbFilePath) && cloudTime.HasValue)
                {
                    var localTime = File.GetLastWriteTimeUtc(dbFilePath);
                    var walPath = dbFilePath + "-wal";
                    if (File.Exists(walPath))
                    {
                        var walTime = File.GetLastWriteTimeUtc(walPath);
                        if (walTime > localTime) localTime = walTime;
                    }

                    // If local was modified more than 5 seconds after the cloud backup was saved, changes are pending
                    if (localTime > cloudTime.Value.AddSeconds(5))
                    {
                        isUpToDate = false;
                    }
                }

                return new CloudBackupStatus(
                    IsLinked: true,
                    Exists: true,
                    IsUpToDate: isUpToDate,
                    LastModifiedFormatted: formatted,
                    LastModifiedUtc: cloudTime,
                    ErrorMessage: null
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error checking cloud backup status: {ex.Message}");
                return new CloudBackupStatus(
                    IsLinked: IsLinked,
                    Exists: false,
                    IsUpToDate: false,
                    LastModifiedFormatted: null,
                    LastModifiedUtc: null,
                    ErrorMessage: ex.Message
                );
            }
        }

        public static void SignOut()
        {
            try { Client?.Auth?.SignOut(); } catch { }
            try { new DiskSessionHandler().DestroySession(); } catch { }
        }

        public static bool IsLinked => (Client?.Auth?.CurrentUser ?? new DiskSessionHandler().LoadSession()?.User) != null;

        public static async Task<bool> UploadBackupAsync(string dbFilePath, string? recoveryFilePath = null)
        {
            try
            {
                var user = Client?.Auth?.CurrentUser ?? new DiskSessionHandler().LoadSession()?.User;
                if (user == null || string.IsNullOrEmpty(user.Id)) return false;

                if (!File.Exists(dbFilePath)) return false;
                byte[] data = await File.ReadAllBytesAsync(dbFilePath);
                if (Client == null) await InitializeAsync();
                if (Client == null) return false;
                var storage = Client.Storage.From("vault-backups");
                await storage.Upload(data, $"{user.Id}/vault.db", new Supabase.Storage.FileOptions { Upsert = true });

                if (!string.IsNullOrEmpty(recoveryFilePath) && File.Exists(recoveryFilePath))
                {
                    byte[] recData = await File.ReadAllBytesAsync(recoveryFilePath);
                    await storage.Upload(recData, $"{user.Id}/recovery.dat", new Supabase.Storage.FileOptions { Upsert = true });
                }

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Upload backup error: {ex.Message}");
                return false;
            }
        }

        public static async Task<CloudBackupData?> DownloadBackupAsync()
        {
            try
            {
                var user = Client?.Auth?.CurrentUser ?? new DiskSessionHandler().LoadSession()?.User;
                if (user == null || string.IsNullOrEmpty(user.Id)) return null;

                if (Client == null) await InitializeAsync();
                if (Client == null) return null;
                var storage = Client.Storage.From("vault-backups");

                byte[]? dbBytes = null;
                try
                {
                    dbBytes = await storage.Download($"{user.Id}/vault.db", (Supabase.Storage.TransformOptions?)null);
                }
                catch { }

                if (dbBytes == null || dbBytes.Length == 0)
                {
                    return null;
                }

                byte[]? recoveryBytes = null;
                try
                {
                    recoveryBytes = await storage.Download($"{user.Id}/recovery.dat", (Supabase.Storage.TransformOptions?)null);
                }
                catch { }

                string? lastModified = null;
                try
                {
                    var files = await storage.List(user.Id);
                    var dbMeta = files?.FirstOrDefault(f => f.Name == "vault.db");
                    if (dbMeta != null)
                    {
                        var dt = dbMeta.UpdatedAt ?? dbMeta.CreatedAt;
                        if (dt != null)
                            lastModified = dt.Value.ToLocalTime().ToString("MMM d, yyyy h:mm tt");
                    }
                }
                catch { }

                return new CloudBackupData(dbBytes, recoveryBytes, lastModified);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Download backup error: {ex.Message}");
                return null;
            }
        }

        public static (string Name, string Email, string PictureUrl) GetUserProfile()
        {
            var user = Client?.Auth?.CurrentUser ?? new DiskSessionHandler().LoadSession()?.User;
            if (user == null) return ("Unlinked", "No account linked", "");

            string email = user.Email ?? "";
            
            string name = email.Contains("@") ? email.Split('@')[0] : "User";
            string picture = "";

            if (user.UserMetadata != null)
            {
                if (user.UserMetadata.TryGetValue("full_name", out var fnObj) && fnObj?.ToString() is string fn)
                    name = fn;
                else if (user.UserMetadata.TryGetValue("name", out var nObj) && nObj?.ToString() is string n)
                    name = n;

                if (user.UserMetadata.TryGetValue("avatar_url", out var picObj) && picObj?.ToString() is string pic)
                    picture = pic;
                else if (user.UserMetadata.TryGetValue("picture", out var pObj) && pObj?.ToString() is string p)
                    picture = p;
            }

            // Per-user avatar cache to prevent cross-account avatar leaks and stale images
            var folder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "Vaulture");
            var legacyAvatar = Path.Combine(folder, "avatar.jpg");
            if (File.Exists(legacyAvatar))
            {
                try { File.Delete(legacyAvatar); } catch { }
            }

            string userKey = !string.IsNullOrEmpty(user.Id) ? user.Id : (!string.IsNullOrEmpty(user.Email) ? user.Email : "default");
            using var sha = System.Security.Cryptography.SHA256.Create();
            string hash = Convert.ToHexString(sha.ComputeHash(System.Text.Encoding.UTF8.GetBytes(userKey))).Substring(0, 16).ToLowerInvariant();
            
            var userAvatarPath = Path.Combine(folder, $"avatar_{hash}.dat");
            var userUrlPath = Path.Combine(folder, $"avatar_{hash}.url");

            // If we have an avatar URL from Google/Supabase
            if (!string.IsNullOrEmpty(picture) && picture.StartsWith("http"))
            {
                bool needDownload = true;
                if (File.Exists(userAvatarPath) && File.Exists(userUrlPath))
                {
                    try
                    {
                        string cachedUrl = File.ReadAllText(userUrlPath);
                        if (cachedUrl == picture)
                        {
                            needDownload = false;
                        }
                    }
                    catch { }
                }

                if (needDownload)
                {
                    try
                    {
                        using var http = new HttpClient();
                        http.Timeout = TimeSpan.FromSeconds(5);
                        byte[] bytes = http.GetByteArrayAsync(picture).GetAwaiter().GetResult();
                        if (bytes != null && bytes.Length > 0)
                        {
                            Directory.CreateDirectory(folder);
                            File.WriteAllBytes(userAvatarPath, bytes);
                            File.WriteAllText(userUrlPath, picture);
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Error downloading fresh avatar: {ex.Message}");
                    }
                }
            }

            // Return base64 from the per-user cached avatar if present
            if (File.Exists(userAvatarPath))
            {
                try
                {
                    byte[] bytes = File.ReadAllBytes(userAvatarPath);
                    if (bytes.Length > 0)
                    {
                        string mime = "image/jpeg";
                        if (bytes.Length > 8 && bytes[0] == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47)
                            mime = "image/png";
                        else if (bytes.Length > 2 && bytes[0] == 0xFF && bytes[1] == 0xD8)
                            mime = "image/jpeg";
                        else if (bytes.Length > 4 && bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F')
                            mime = "image/webp";

                        picture = $"data:{mime};base64," + Convert.ToBase64String(bytes);
                    }
                }
                catch { }
            }

            return (name, email, picture);
        }

        public static object? GetLinkedAccountInfo()
        {
            if (!IsLinked) return null;
            var prof = GetUserProfile();
            if (string.IsNullOrEmpty(prof.Email)) return null;
            return new { name = prof.Name, email = prof.Email, picture = prof.PictureUrl };
        }

        public static void OpenBrowser(string url)
        {
            try
            {
                Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
                return;
            }
            catch { }

            try
            {
                Process.Start("xdg-open", $"\"{url}\"");
                return;
            }
            catch { }

            try
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = "/bin/sh",
                    Arguments = $"-c \"xdg-open '{url}'\"",
                    CreateNoWindow = true
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error launching browser: {ex.Message}");
            }
        }
    }

    public class DiskSessionHandler : Supabase.Gotrue.Interfaces.IGotrueSessionPersistence<Supabase.Gotrue.Session>
    {
        private readonly string _cacheFile;

        public DiskSessionHandler()
        {
            var folder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "Vaulture");
            Directory.CreateDirectory(folder);
            _cacheFile = Path.Combine(folder, "supabase_session.json");
        }

        public void SaveSession(Supabase.Gotrue.Session session)
        {
            var json = Newtonsoft.Json.JsonConvert.SerializeObject(session);
            File.WriteAllText(_cacheFile, json);
        }

        public Supabase.Gotrue.Session? LoadSession()
        {
            if (File.Exists(_cacheFile))
            {
                var json = File.ReadAllText(_cacheFile);
                return Newtonsoft.Json.JsonConvert.DeserializeObject<Supabase.Gotrue.Session>(json);
            }
            return null;
        }

        public void DestroySession()
        {
            if (File.Exists(_cacheFile))
                File.Delete(_cacheFile);
        }
    }
}
