using System;
using System.IO;
using System.Text.Json;
using System.Linq;
using Photino.NET;
using Vaulture.Core.Data;
using Vaulture.Core.Models;
using Vaulture.Core.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.Sqlite;
using Vaulture.Photino.Services;

namespace Vaulture.Photino
{
    class Program
    {
        static readonly string VaultDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "Vaulture");
        static readonly string DbPath = Path.Combine(VaultDir, "vault.db");
        static readonly string RecoveryPath = Path.Combine(VaultDir, "recovery.dat");
        static VaultDbContext? CurrentDbContext;

        [STAThread]
        static void Main(string[] args)
        {
            // Crucial fix for WebKitGTK on Linux with NVIDIA GPUs:
            // WebKitGTK's default DMA-BUF renderer causes severe stuttering, buffer locks, and 100% CPU spikes on NVIDIA.
            if (OperatingSystem.IsLinux())
            {
                Environment.SetEnvironmentVariable("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
                try
                {
                    GlibNative.g_set_prgname("Vaulture");
                    GlibNative.g_set_application_name("Vaulture");
                }
                catch { }
            }

            Directory.CreateDirectory(VaultDir);

            string windowTitle = "Vaulture";
            string devUrl = "http://localhost:5173";
            
            // Check possible locations for the compiled production bundle
            string distFile = Path.Combine(AppContext.BaseDirectory, "ui", "dist", "index.html");
            if (!File.Exists(distFile))
            {
                distFile = Path.Combine(Directory.GetCurrentDirectory(), "ui", "dist", "index.html");
            }
            if (!File.Exists(distFile))
            {
                distFile = Path.Combine(Directory.GetCurrentDirectory(), "Vaulture.Photino", "ui", "dist", "index.html");
            }

            string targetUrl = devUrl;
            bool isDevServerRunning = false;
            try
            {
                using var http = new System.Net.Http.HttpClient { Timeout = TimeSpan.FromMilliseconds(400) };
                var res = http.GetAsync(devUrl).GetAwaiter().GetResult();
                isDevServerRunning = res.IsSuccessStatusCode;
            }
            catch { }

            if (!isDevServerRunning && File.Exists(distFile))
            {
                targetUrl = distFile;
                Console.WriteLine($"[Vaulture] Running in standalone production mode: {targetUrl}");
            }
            else
            {
                Console.WriteLine($"[Vaulture] Connected to Vite development server: {devUrl}");
            }

            string preferredIcon = OperatingSystem.IsWindows() ? "Vaulture.ico" : "Vaulture.png";
            string fallbackIcon = OperatingSystem.IsWindows() ? "Vaulture.png" : "Vaulture.ico";

            string iconPath = Path.Combine(AppContext.BaseDirectory, preferredIcon);
            if (!File.Exists(iconPath)) iconPath = Path.Combine(AppContext.BaseDirectory, fallbackIcon);
            if (!File.Exists(iconPath)) iconPath = Path.Combine(Directory.GetCurrentDirectory(), preferredIcon);
            if (!File.Exists(iconPath)) iconPath = Path.Combine(Directory.GetCurrentDirectory(), fallbackIcon);

            var window = new PhotinoWindow()
                .SetTitle(windowTitle)
                .SetUseOsDefaultSize(false)
                .SetSize(new System.Drawing.Size(1024, 768))
                .Center();

            if (File.Exists(iconPath))
            {
                try { window.SetIconFile(iconPath); } catch { }
            }

            window.Load(targetUrl);

            window.RegisterWebMessageReceivedHandler((object? sender, string message) =>
            {
                var w = (PhotinoWindow)sender!;
                try 
                {
                    var data = JsonDocument.Parse(message).RootElement;
                    string type = data.GetProperty("type").GetString() ?? "";
                    
                    if (type == "READY")
                    {
                        bool vaultExists = File.Exists(DbPath);
                        var response = new {
                            type = "INIT",
                            payload = new {
                                vaultExists = vaultExists,
                                linkedAccount = vaultExists ? SupabaseService.GetLinkedAccountInfo() : null
                            }
                        };
                        w.SendWebMessage(JsonSerializer.Serialize(response));
                    }
                    else if (type == "LOGIN")
                    {
                        string pass = data.GetProperty("payload").GetString() ?? "";
                        _ = Task.Run(() =>
                        {
                            try
                            {
                                string key = EncryptionService.DeriveKeyFromPassword(pass);
                                var db = new VaultDbContext(DbPath, key);
                                // Verify key by querying folders
                                _ = db.Folders.Count();
                                CurrentDbContext = db;
                                try
                                {
                                    db.Database.ExecuteSqlRaw(@"
                                        CREATE TABLE IF NOT EXISTS ""PasswordHistories"" (
                                            ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_PasswordHistories"" PRIMARY KEY AUTOINCREMENT,
                                            ""EntryId"" INTEGER NOT NULL,
                                            ""OldPassword"" TEXT NOT NULL,
                                            ""ChangedAt"" TEXT NOT NULL,
                                            CONSTRAINT ""FK_PasswordHistories_Entries_EntryId"" FOREIGN KEY (""EntryId"") REFERENCES ""Entries"" (""Id"") ON DELETE CASCADE
                                        );
                                    ");
                                }
                                catch { }

                                try { db.Database.ExecuteSqlRaw(@"ALTER TABLE ""Entries"" ADD COLUMN ""Icon"" TEXT;"); } catch { }
                                try { db.Database.ExecuteSqlRaw(@"ALTER TABLE ""Folders"" ADD COLUMN ""Icon"" TEXT;"); } catch { }

                                w.SendWebMessage(JsonSerializer.Serialize(new {
                                    type = "LOGIN_RESULT",
                                    payload = new { success = true }
                                }));

                                _ = Task.Run(async () =>
                                {
                                    await NotificationService.SendNotificationAsync(
                                        "Vault Unlocked",
                                        "Your local Vaulture workspace was opened on this device.",
                                        "#10b981",
                                        ""
                                    );
                                });
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"Login failed: {ex.Message}");
                                w.SendWebMessage(JsonSerializer.Serialize(new {
                                    type = "LOGIN_RESULT",
                                    payload = new { success = false, error = "Incorrect master password." }
                                }));

                                _ = Task.Run(async () =>
                                {
                                    await NotificationService.SendNotificationAsync(
                                        "Unsuccessful Sign-In Attempt",
                                        "An unsuccessful attempt was made to open your local Vaulture workspace on this device.",
                                        "#d29922",
                                        ""
                                    );
                                });
                            }
                        });
                    }
                    else if (type == "CREATE_VAULT")
                    {
                        var payload = data.GetProperty("payload");
                        string pass = payload.GetProperty("password").GetString() ?? "";
                        string recKey = payload.GetProperty("recoveryKey").GetString() ?? "";
                        _ = Task.Run(async () =>
                        {
                            try
                            {
                                // Auto-backup existing vault to cloud if linked before replacing
                                if (SupabaseService.IsLinked && File.Exists(DbPath))
                                {
                                    try
                                    {
                                        await SupabaseService.UploadBackupAsync(DbPath, RecoveryPath);
                                    }
                                    catch { }
                                }

                                Directory.CreateDirectory(VaultDir);

                                // Clear any existing connection pools and old files to ensure fresh encryption
                                SqliteConnection.ClearAllPools();
                                if (File.Exists(DbPath)) File.Delete(DbPath);
                                if (File.Exists(DbPath + "-wal")) File.Delete(DbPath + "-wal");
                                if (File.Exists(DbPath + "-shm")) File.Delete(DbPath + "-shm");
                                if (File.Exists(RecoveryPath)) File.Delete(RecoveryPath);

                                SupabaseService.SignOut();

                                string key = EncryptionService.DeriveKeyFromPassword(pass);
                                var db = new VaultDbContext(DbPath, key);
                                db.Database.EnsureCreated();
                                EncryptionService.CreateRecoveryFile(pass, recKey, RecoveryPath);
                                CurrentDbContext = db;

                                w.SendWebMessage(JsonSerializer.Serialize(new {
                                    type = "CREATE_VAULT_RESULT",
                                    payload = new { success = true }
                                }));
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"Create vault failed: {ex.Message}");
                                w.SendWebMessage(JsonSerializer.Serialize(new {
                                    type = "CREATE_VAULT_RESULT",
                                    payload = new { success = false, error = ex.Message }
                                }));
                            }
                        });
                    }
                    else if (type == "RECOVER_VAULT")
                    {
                        string recKey = data.GetProperty("payload").GetString() ?? "";
                        try
                        {
                            if (!File.Exists(RecoveryPath))
                            {
                                w.SendWebMessage(JsonSerializer.Serialize(new {
                                    type = "RECOVER_RESULT",
                                    payload = new { success = false, error = "Recovery file not found on disk." }
                                }));
                                return;
                            }
                            string recoveredPassword = EncryptionService.RecoverMasterPassword(recKey, RecoveryPath);
                            w.SendWebMessage(JsonSerializer.Serialize(new {
                                type = "RECOVER_RESULT",
                                payload = new { success = true, password = recoveredPassword }
                            }));
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Recovery failed: {ex.Message}");
                            w.SendWebMessage(JsonSerializer.Serialize(new {
                                type = "RECOVER_RESULT",
                                payload = new { success = false, error = "Invalid Recovery Key." }
                            }));
                        }
                    }
                    else if (type == "WIPE_VAULT")
                    {
                        try
                        {
                            SqliteConnection.ClearAllPools();
                            if (File.Exists(DbPath)) File.Delete(DbPath);
                            if (File.Exists(DbPath + "-wal")) File.Delete(DbPath + "-wal");
                            if (File.Exists(DbPath + "-shm")) File.Delete(DbPath + "-shm");
                            if (File.Exists(RecoveryPath)) File.Delete(RecoveryPath);
                            foreach (var f in Directory.GetFiles(VaultDir, "avatar*.*"))
                            {
                                try { File.Delete(f); } catch { }
                            }
                            if (File.Exists(Path.Combine(VaultDir, "profile_pic.png")))
                            {
                                try { File.Delete(Path.Combine(VaultDir, "profile_pic.png")); } catch { }
                            }
                            try { SupabaseService.SignOut(); } catch { }
                            CurrentDbContext = null;

                            w.SendWebMessage(JsonSerializer.Serialize(new {
                                type = "WIPE_RESULT",
                                payload = new { success = true }
                            }));
                        }
                        catch (Exception ex)
                        {
                            w.SendWebMessage(JsonSerializer.Serialize(new {
                                type = "WIPE_RESULT",
                                payload = new { success = false, error = ex.Message }
                            }));
                        }
                    }
                    else if (type == "GOOGLE_SIGN_IN")
                    {
                        _ = Task.Run(async () =>
                        {
                            try
                            {
                                if (SupabaseService.Client == null)
                                {
                                    await SupabaseService.InitializeAsync();
                                }

                                await SupabaseService.AuthenticateWithGoogleAsync(url =>
                                {
                                    w.SendWebMessage(JsonSerializer.Serialize(new {
                                        type = "GOOGLE_AUTH_URL",
                                        payload = new { url = url }
                                    }));
                                });
                                var profile = SupabaseService.GetUserProfile();

                                w.SendWebMessage(JsonSerializer.Serialize(new {
                                    type = "GOOGLE_SIGN_IN_RESULT",
                                    payload = new {
                                        success = true,
                                        name = profile.Name,
                                        email = profile.Email,
                                        picture = profile.PictureUrl
                                    }
                                }));

                                _ = Task.Run(async () =>
                                {
                                    try
                                    {
                                        if (!string.IsNullOrEmpty(profile.Email))
                                        {
                                            await EmailService.SendWelcomeEmailAsync(profile.Email, profile.Name);
                                        }
                                        if (File.Exists(DbPath))
                                        {
                                            await SupabaseService.UploadBackupAsync(DbPath, RecoveryPath);
                                        }
                                    }
                                    catch (Exception emailEx)
                                    {
                                        Console.WriteLine($"Welcome email error: {emailEx.Message}");
                                    }
                                });
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"Google Auth failed: {ex.Message}");
                                w.SendWebMessage(JsonSerializer.Serialize(new {
                                    type = "GOOGLE_SIGN_IN_RESULT",
                                    payload = new {
                                        success = false,
                                        error = ex.Message
                                    }
                                }));
                            }
                        });
                    }
                    else if (type == "CANCEL_GOOGLE_AUTH")
                    {
                        try
                        {
                            SupabaseService.CancelPendingAuth();
                        }
                        catch { }
                    }
                    else if (type == "SWITCH_GOOGLE_ACCOUNT")
                    {
                        _ = Task.Run(async () =>
                        {
                            try
                            {
                                if (SupabaseService.Client == null)
                                {
                                    await SupabaseService.InitializeAsync();
                                }

                                SupabaseService.SignOut();

                                await SupabaseService.AuthenticateWithGoogleAsync(url =>
                                {
                                    w.SendWebMessage(JsonSerializer.Serialize(new {
                                        type = "GOOGLE_AUTH_URL",
                                        payload = new { url = url }
                                    }));
                                });
                                var profile = SupabaseService.GetUserProfile();

                                w.SendWebMessage(JsonSerializer.Serialize(new {
                                    type = "SWITCH_GOOGLE_ACCOUNT_RESULT",
                                    payload = new {
                                        success = true,
                                        name = profile.Name,
                                        email = profile.Email,
                                        picture = profile.PictureUrl
                                    }
                                }));

                                _ = Task.Run(async () =>
                                {
                                    try
                                    {
                                        if (!string.IsNullOrEmpty(profile.Email))
                                        {
                                            await EmailService.SendWelcomeEmailAsync(profile.Email, profile.Name);
                                        }
                                        if (File.Exists(DbPath))
                                        {
                                            await SupabaseService.UploadBackupAsync(DbPath, RecoveryPath);
                                        }
                                    }
                                    catch (Exception emailEx)
                                    {
                                        Console.WriteLine($"Welcome email / upload error: {emailEx.Message}");
                                    }
                                });
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"Switch Google Account failed: {ex.Message}");
                                w.SendWebMessage(JsonSerializer.Serialize(new {
                                    type = "SWITCH_GOOGLE_ACCOUNT_RESULT",
                                    payload = new {
                                        success = false,
                                        error = ex.Message
                                    }
                                }));
                            }
                        });
                    }
                    else if (type == "GET_DATA")
                    {
                        try
                        {
                            if (CurrentDbContext == null)
                            {
                                w.SendWebMessage(JsonSerializer.Serialize(new {
                                    type = "DATA_RESULT",
                                    payload = new { success = false, error = "Vault is locked." }
                                }));
                                return;
                            }

                            var entries = CurrentDbContext.Entries
                                .OrderByDescending(e => e.UpdatedAt)
                                .Select(e => new {
                                    id = e.Id,
                                    folderId = e.FolderId,
                                    title = e.Title,
                                    username = e.Username,
                                    password = e.Password,
                                    url = e.Url,
                                    notes = e.Notes,
                                    icon = e.Icon,
                                    createdAt = e.CreatedAt.ToString("o"),
                                    updatedAt = e.UpdatedAt.ToString("o"),
                                    passwordHistory = CurrentDbContext.PasswordHistories
                                        .Where(p => p.EntryId == e.Id)
                                        .OrderByDescending(p => p.ChangedAt)
                                        .Select(p => new {
                                            id = p.Id,
                                            oldPassword = p.OldPassword,
                                            changedAt = p.ChangedAt.ToString("o")
                                        })
                                        .ToList()
                                })
                                .ToList();

                            var folders = CurrentDbContext.Folders
                                .OrderBy(f => f.Name)
                                .Select(f => new {
                                    id = f.Id,
                                    name = f.Name,
                                    icon = f.Icon,
                                    parentFolderId = f.ParentFolderId,
                                    createdAt = f.CreatedAt.ToString("o")
                                })
                                .ToList();

                            var profile = SupabaseService.GetUserProfile();
                            Console.WriteLine($"[Vaulture] Profile loaded for {profile.Email}: picture format={profile.PictureUrl?.Substring(0, Math.Min(30, profile.PictureUrl?.Length ?? 0))}");

                            w.SendWebMessage(JsonSerializer.Serialize(new {
                                type = "DATA_RESULT",
                                payload = new {
                                    success = true,
                                    entries = entries,
                                    folders = folders,
                                    user = new {
                                        name = profile.Name,
                                        email = profile.Email,
                                        picture = profile.PictureUrl,
                                        isLinked = SupabaseService.IsLinked
                                    }
                                }
                            }));

                            // Asynchronously query Supabase for real cloud backup status
                            _ = Task.Run(async () =>
                            {
                                try
                                {
                                    var backupStatus = await SupabaseService.GetBackupStatusAsync(DbPath);
                                    w.SendWebMessage(JsonSerializer.Serialize(new {
                                        type = "BACKUP_STATUS_RESULT",
                                        payload = new {
                                            success = string.IsNullOrEmpty(backupStatus.ErrorMessage),
                                            isLinked = backupStatus.IsLinked,
                                            exists = backupStatus.Exists,
                                            isUpToDate = backupStatus.IsUpToDate,
                                            lastSynced = backupStatus.LastModifiedFormatted,
                                            lastSyncedIso = backupStatus.LastModifiedUtc?.ToString("o"),
                                            error = backupStatus.ErrorMessage
                                        }
                                    }));
                                }
                                catch (Exception ex)
                                {
                                    Console.WriteLine($"Error querying backup status on load: {ex.Message}");
                                }
                            });
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Error getting data: {ex.Message}");
                            w.SendWebMessage(JsonSerializer.Serialize(new {
                                type = "DATA_RESULT",
                                payload = new { success = false, error = ex.Message }
                            }));
                        }
                    }
                    else if (type == "SAVE_ENTRY")
                    {
                        try
                        {
                            if (CurrentDbContext == null) return;
                            var payload = data.GetProperty("payload");

                            int id = payload.TryGetProperty("id", out var idProp) && idProp.ValueKind == JsonValueKind.Number ? idProp.GetInt32() : 0;
                            int? folderId = payload.TryGetProperty("folderId", out var fProp) && fProp.ValueKind == JsonValueKind.Number ? fProp.GetInt32() : (int?)null;
                            string title = payload.TryGetProperty("title", out var tProp) ? tProp.GetString() ?? "" : "";
                            string username = payload.TryGetProperty("username", out var uProp) ? uProp.GetString() ?? "" : "";
                            string password = payload.TryGetProperty("password", out var pProp) ? pProp.GetString() ?? "" : "";
                            string url = payload.TryGetProperty("url", out var urlProp) ? urlProp.GetString() ?? "" : "";
                            string notes = payload.TryGetProperty("notes", out var nProp) ? nProp.GetString() ?? "" : "";
                            string? icon = null;
                            bool hasIconProp = payload.TryGetProperty("icon", out var iconProp);
                            if (hasIconProp)
                            {
                                icon = (iconProp.ValueKind == JsonValueKind.String && !string.IsNullOrWhiteSpace(iconProp.GetString())) ? iconProp.GetString() : null;
                            }

                            if (string.IsNullOrWhiteSpace(title))
                            {
                                throw new ArgumentException("Title is required.");
                            }
                            if (string.IsNullOrWhiteSpace(username))
                            {
                                throw new ArgumentException("Username / Email is required.");
                            }
                            if (string.IsNullOrWhiteSpace(password))
                            {
                                throw new ArgumentException("Password is required.");
                            }

                            Entry? entry = null;
                            if (id > 0)
                            {
                                entry = CurrentDbContext.Entries.FirstOrDefault(e => e.Id == id);
                            }

                            bool isNew = (entry == null);
                            bool passwordChanged = false;
                            if (entry == null)
                            {
                                entry = new Entry
                                {
                                    FolderId = folderId,
                                    Title = title,
                                    Username = username,
                                    Password = password,
                                    Url = url,
                                    Notes = notes,
                                    Icon = icon,
                                    CreatedAt = DateTime.UtcNow,
                                    UpdatedAt = DateTime.UtcNow
                                };
                                CurrentDbContext.Entries.Add(entry);
                            }
                            else
                            {
                                if (!string.IsNullOrEmpty(entry.Password) && entry.Password != password)
                                {
                                    passwordChanged = true;
                                    CurrentDbContext.PasswordHistories.Add(new PasswordHistory
                                    {
                                        EntryId = entry.Id,
                                        OldPassword = entry.Password,
                                        ChangedAt = DateTime.UtcNow
                                    });
                                }

                                entry.FolderId = folderId;
                                entry.Title = title;
                                entry.Username = username;
                                entry.Password = password;
                                entry.Url = url;
                                entry.Notes = notes;
                                if (hasIconProp)
                                {
                                    entry.Icon = icon;
                                }
                                entry.UpdatedAt = DateTime.UtcNow;
                            }

                            CurrentDbContext.SaveChanges();

                            string savedTitle = entry.Title;
                            string savedUsername = entry.Username;

                            // Cloud backup & password-change email alert in background
                            _ = Task.Run(async () =>
                            {
                                try
                                {
                                    if (isNew)
                                    {
                                        await NotificationService.SendNotificationAsync(
                                            "Vault Entry Added",
                                            $"A new item \"{savedTitle}\" ({(string.IsNullOrWhiteSpace(savedUsername) ? "no username" : savedUsername)}) was added to your local Vaulture workspace.",
                                            "#10b981",
                                            ""
                                        );
                                    }
                                    else
                                    {
                                        string detail = passwordChanged ? "was modified and its password was updated" : "was modified";
                                        await NotificationService.SendNotificationAsync(
                                            "Vault Entry Updated",
                                            $"The item \"{savedTitle}\" ({(string.IsNullOrWhiteSpace(savedUsername) ? "no username" : savedUsername)}) {detail} in your local Vaulture workspace.",
                                            "#0969da",
                                            ""
                                        );
                                    }

                                    if (SupabaseService.IsLinked)
                                    {
                                        bool backedUp = await SupabaseService.UploadBackupAsync(DbPath, RecoveryPath);
                                        w.SendWebMessage(JsonSerializer.Serialize(new {
                                            type = "SYNC_RESULT",
                                            payload = new { success = backedUp, lastSynced = DateTime.UtcNow.ToString("g") }
                                        }));
                                    }
                                }
                                catch (Exception syncEx)
                                {
                                    Console.WriteLine($"Auto-backup sync failed: {syncEx.Message}");
                                }
                            });

                            var histories = CurrentDbContext.PasswordHistories
                                .Where(ph => ph.EntryId == entry.Id)
                                .OrderByDescending(ph => ph.ChangedAt)
                                .Select(ph => new {
                                    id = ph.Id,
                                    oldPassword = ph.OldPassword,
                                    changedAt = ph.ChangedAt.ToString("o")
                                })
                                .ToList();

                            w.SendWebMessage(JsonSerializer.Serialize(new {
                                type = "SAVE_ENTRY_RESULT",
                                payload = new {
                                    success = true,
                                    entry = new {
                                        id = entry.Id,
                                        folderId = entry.FolderId,
                                        title = entry.Title,
                                        username = entry.Username,
                                        password = entry.Password,
                                        url = entry.Url,
                                        notes = entry.Notes,
                                        icon = entry.Icon,
                                        createdAt = entry.CreatedAt.ToString("o"),
                                        updatedAt = entry.UpdatedAt.ToString("o"),
                                        passwordHistory = histories
                                    }
                                }
                            }));
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Save entry failed: {ex.Message}");
                            w.SendWebMessage(JsonSerializer.Serialize(new {
                                type = "SAVE_ENTRY_RESULT",
                                payload = new { success = false, error = ex.Message }
                            }));
                        }
                    }
                    else if (type == "CHANGE_PASSWORD")
                    {
                        try
                        {
                            if (CurrentDbContext == null) return;
                            var payload = data.GetProperty("payload");
                            int id = payload.GetProperty("id").GetInt32();
                            string newPassword = payload.GetProperty("newPassword").GetString() ?? "";

                            var entry = CurrentDbContext.Entries.FirstOrDefault(e => e.Id == id);
                            if (entry != null)
                            {
                                bool passwordChanged = false;
                                if (!string.IsNullOrEmpty(entry.Password) && entry.Password != newPassword)
                                {
                                    passwordChanged = true;
                                    CurrentDbContext.PasswordHistories.Add(new PasswordHistory
                                    {
                                        EntryId = entry.Id,
                                        OldPassword = entry.Password,
                                        ChangedAt = DateTime.UtcNow
                                    });
                                }

                                entry.Password = newPassword;
                                entry.UpdatedAt = DateTime.UtcNow;
                                CurrentDbContext.SaveChanges();

                                string changedTitle = entry.Title;
                                string changedUsername = entry.Username;

                                _ = Task.Run(async () =>
                                {
                                    try
                                    {
                                        if (passwordChanged)
                                        {
                                            await NotificationService.SendNotificationAsync(
                                                "Vault Entry Updated",
                                                $"The item \"{changedTitle}\" ({(string.IsNullOrWhiteSpace(changedUsername) ? "no username" : changedUsername)}) was modified and its password was updated in your local Vaulture workspace.",
                                                "#0969da",
                                                ""
                                            );
                                        }

                                        if (SupabaseService.IsLinked)
                                        {
                                            bool backedUp = await SupabaseService.UploadBackupAsync(DbPath, RecoveryPath);
                                            w.SendWebMessage(JsonSerializer.Serialize(new {
                                                type = "SYNC_RESULT",
                                                payload = new { success = backedUp, lastSynced = DateTime.UtcNow.ToString("g") }
                                            }));
                                        }
                                    }
                                    catch { }
                                });

                                var histories = CurrentDbContext.PasswordHistories
                                    .Where(ph => ph.EntryId == entry.Id)
                                    .OrderByDescending(ph => ph.ChangedAt)
                                    .Select(ph => new {
                                        id = ph.Id,
                                        oldPassword = ph.OldPassword,
                                        changedAt = ph.ChangedAt.ToString("o")
                                    })
                                    .ToList();

                                w.SendWebMessage(JsonSerializer.Serialize(new {
                                    type = "SAVE_ENTRY_RESULT",
                                    payload = new {
                                        success = true,
                                        entry = new {
                                            id = entry.Id,
                                            folderId = entry.FolderId,
                                            title = entry.Title,
                                            username = entry.Username,
                                            password = entry.Password,
                                            url = entry.Url,
                                            notes = entry.Notes,
                                            icon = entry.Icon,
                                            createdAt = entry.CreatedAt.ToString("o"),
                                            updatedAt = entry.UpdatedAt.ToString("o"),
                                            passwordHistory = histories
                                        }
                                    }
                                }));
                            }
                        }
                        catch (Exception ex)
                        {
                            w.SendWebMessage(JsonSerializer.Serialize(new {
                                type = "SAVE_ENTRY_RESULT",
                                payload = new { success = false, error = ex.Message }
                            }));
                        }
                    }
                    else if (type == "DELETE_ENTRY")
                    {
                        try
                        {
                            if (CurrentDbContext == null) return;
                            int id = data.GetProperty("payload").GetProperty("id").GetInt32();
                            var entry = CurrentDbContext.Entries.FirstOrDefault(e => e.Id == id);
                            if (entry != null)
                            {
                                string deletedTitle = entry.Title;
                                CurrentDbContext.Entries.Remove(entry);
                                CurrentDbContext.SaveChanges();

                                _ = Task.Run(async () =>
                                {
                                    try
                                    {
                                        await NotificationService.SendNotificationAsync(
                                            "Vault Entry Removed",
                                            $"The item \"{deletedTitle}\" was removed from your local Vaulture workspace.",
                                            "#e74c3c",
                                            ""
                                        );

                                        if (SupabaseService.IsLinked)
                                        {
                                            bool backedUp = await SupabaseService.UploadBackupAsync(DbPath, RecoveryPath);
                                            w.SendWebMessage(JsonSerializer.Serialize(new {
                                                type = "SYNC_RESULT",
                                                payload = new { success = backedUp, lastSynced = DateTime.UtcNow.ToString("g") }
                                            }));
                                        }
                                    }
                                    catch { }
                                });
                            }

                            w.SendWebMessage(JsonSerializer.Serialize(new {
                                type = "DELETE_ENTRY_RESULT",
                                payload = new { success = true, id = id }
                            }));
                        }
                        catch (Exception ex)
                        {
                            w.SendWebMessage(JsonSerializer.Serialize(new {
                                type = "DELETE_ENTRY_RESULT",
                                payload = new { success = false, error = ex.Message }
                            }));
                        }
                    }
                    else if (type == "CREATE_FOLDER")
                    {
                        try
                        {
                            if (CurrentDbContext == null) return;
                            var payload = data.GetProperty("payload");
                            string name = payload.GetProperty("name").GetString() ?? "New Folder";
                            int? parentId = payload.TryGetProperty("parentFolderId", out var pProp) && pProp.ValueKind == JsonValueKind.Number ? pProp.GetInt32() : (int?)null;
                            string? icon = payload.TryGetProperty("icon", out var fIconProp) && fIconProp.ValueKind == JsonValueKind.String ? fIconProp.GetString() : null;

                            var folder = new Folder
                            {
                                Name = name,
                                Icon = string.IsNullOrWhiteSpace(icon) ? null : icon,
                                ParentFolderId = parentId,
                                CreatedAt = DateTime.UtcNow,
                                UpdatedAt = DateTime.UtcNow
                            };
                            CurrentDbContext.Folders.Add(folder);
                            CurrentDbContext.SaveChanges();

                            _ = Task.Run(async () =>
                            {
                                try
                                {
                                    if (SupabaseService.IsLinked)
                                        await SupabaseService.UploadBackupAsync(DbPath, RecoveryPath);
                                }
                                catch { }
                            });

                            w.SendWebMessage(JsonSerializer.Serialize(new {
                                type = "CREATE_FOLDER_RESULT",
                                payload = new {
                                    success = true,
                                    folder = new {
                                        id = folder.Id,
                                        name = folder.Name,
                                        icon = folder.Icon,
                                        parentFolderId = folder.ParentFolderId,
                                        createdAt = folder.CreatedAt.ToString("o")
                                    }
                                }
                            }));
                        }
                        catch (Exception ex)
                        {
                            w.SendWebMessage(JsonSerializer.Serialize(new {
                                type = "CREATE_FOLDER_RESULT",
                                payload = new { success = false, error = ex.Message }
                            }));
                        }
                    }
                    else if (type == "RENAME_FOLDER")
                    {
                        try
                        {
                            if (CurrentDbContext == null) return;
                            var payload = data.GetProperty("payload");
                            int id = payload.GetProperty("id").GetInt32();
                            string name = payload.GetProperty("name").GetString() ?? "";

                            var folder = CurrentDbContext.Folders.FirstOrDefault(f => f.Id == id);
                            if (folder != null && !string.IsNullOrWhiteSpace(name))
                            {
                                folder.Name = name.Trim();
                                folder.UpdatedAt = DateTime.UtcNow;
                                CurrentDbContext.SaveChanges();

                                _ = Task.Run(async () =>
                                {
                                    try
                                    {
                                        if (SupabaseService.IsLinked)
                                            await SupabaseService.UploadBackupAsync(DbPath, RecoveryPath);
                                    }
                                    catch { }
                                });
                            }

                            w.SendWebMessage(JsonSerializer.Serialize(new {
                                type = "RENAME_FOLDER_RESULT",
                                payload = new {
                                    success = true,
                                    folder = new {
                                        id = folder?.Id ?? id,
                                        name = folder?.Name ?? name,
                                        icon = folder?.Icon,
                                        parentFolderId = folder?.ParentFolderId
                                    }
                                }
                            }));
                        }
                        catch (Exception ex)
                        {
                            w.SendWebMessage(JsonSerializer.Serialize(new {
                                type = "RENAME_FOLDER_RESULT",
                                payload = new { success = false, error = ex.Message }
                            }));
                        }
                    }
                    else if (type == "UPDATE_FOLDER_ICON")
                    {
                        try
                        {
                            if (CurrentDbContext == null) return;
                            var payload = data.GetProperty("payload");
                            int id = payload.GetProperty("id").GetInt32();
                            string? icon = null;
                            if (payload.TryGetProperty("icon", out var fIconProp) && fIconProp.ValueKind == JsonValueKind.String)
                            {
                                string val = fIconProp.GetString() ?? "";
                                if (!string.IsNullOrWhiteSpace(val)) icon = val;
                            }

                            var folder = CurrentDbContext.Folders.FirstOrDefault(f => f.Id == id);
                            if (folder != null)
                            {
                                folder.Icon = icon;
                                folder.UpdatedAt = DateTime.UtcNow;
                                CurrentDbContext.SaveChanges();

                                _ = Task.Run(async () =>
                                {
                                    try
                                    {
                                        if (SupabaseService.IsLinked)
                                            await SupabaseService.UploadBackupAsync(DbPath, RecoveryPath);
                                    }
                                    catch { }
                                });
                            }

                            w.SendWebMessage(JsonSerializer.Serialize(new {
                                type = "UPDATE_FOLDER_ICON_RESULT",
                                payload = new {
                                    success = true,
                                    folder = new {
                                        id = folder?.Id ?? id,
                                        name = folder?.Name ?? "",
                                        icon = folder?.Icon,
                                        parentFolderId = folder?.ParentFolderId
                                    }
                                }
                            }));
                        }
                        catch (Exception ex)
                        {
                            w.SendWebMessage(JsonSerializer.Serialize(new {
                                type = "UPDATE_FOLDER_ICON_RESULT",
                                payload = new { success = false, error = ex.Message }
                            }));
                        }
                    }
                    else if (type == "UPDATE_ENTRY_ICON")
                    {
                        try
                        {
                            if (CurrentDbContext == null) return;
                            var payload = data.GetProperty("payload");
                            int id = payload.GetProperty("id").GetInt32();
                            string? icon = null;
                            if (payload.TryGetProperty("icon", out var eIconProp) && eIconProp.ValueKind == JsonValueKind.String)
                            {
                                string val = eIconProp.GetString() ?? "";
                                if (!string.IsNullOrWhiteSpace(val)) icon = val;
                            }

                            var entry = CurrentDbContext.Entries.FirstOrDefault(e => e.Id == id);
                            if (entry != null)
                            {
                                entry.Icon = icon;
                                entry.UpdatedAt = DateTime.UtcNow;
                                CurrentDbContext.SaveChanges();

                                _ = Task.Run(async () =>
                                {
                                    try
                                    {
                                        if (SupabaseService.IsLinked)
                                            await SupabaseService.UploadBackupAsync(DbPath, RecoveryPath);
                                    }
                                    catch { }
                                });
                            }

                            w.SendWebMessage(JsonSerializer.Serialize(new {
                                type = "UPDATE_ENTRY_ICON_RESULT",
                                payload = new {
                                    success = true,
                                    id = entry?.Id ?? id,
                                    icon = entry?.Icon
                                }
                            }));
                        }
                        catch (Exception ex)
                        {
                            w.SendWebMessage(JsonSerializer.Serialize(new {
                                type = "UPDATE_ENTRY_ICON_RESULT",
                                payload = new { success = false, error = ex.Message }
                            }));
                        }
                    }
                    else if (type == "MOVE_FOLDER")
                    {
                        try
                        {
                            if (CurrentDbContext == null) return;
                            var payload = data.GetProperty("payload");
                            int id = payload.GetProperty("id").GetInt32();
                            int? targetParentId = payload.TryGetProperty("targetParentFolderId", out var pProp) && pProp.ValueKind == JsonValueKind.Number ? pProp.GetInt32() : (int?)null;

                            if (id != targetParentId)
                            {
                                var folder = CurrentDbContext.Folders.FirstOrDefault(f => f.Id == id);
                                if (folder != null)
                                {
                                    bool isDescendant = false;
                                    int? curr = targetParentId;
                                    while (curr.HasValue)
                                    {
                                        if (curr.Value == id) { isDescendant = true; break; }
                                        var parent = CurrentDbContext.Folders.FirstOrDefault(f => f.Id == curr.Value);
                                        curr = parent?.ParentFolderId;
                                    }

                                    if (!isDescendant)
                                    {
                                        folder.ParentFolderId = targetParentId;
                                        folder.UpdatedAt = DateTime.UtcNow;
                                        CurrentDbContext.SaveChanges();

                                        _ = Task.Run(async () =>
                                        {
                                            try
                                            {
                                                if (SupabaseService.IsLinked)
                                                    await SupabaseService.UploadBackupAsync(DbPath, RecoveryPath);
                                            }
                                            catch { }
                                        });

                                        w.SendWebMessage(JsonSerializer.Serialize(new {
                                            type = "MOVE_FOLDER_RESULT",
                                            payload = new { success = true, id = id, targetParentFolderId = targetParentId }
                                        }));
                                        return;
                                    }
                                }
                            }

                            w.SendWebMessage(JsonSerializer.Serialize(new {
                                type = "MOVE_FOLDER_RESULT",
                                payload = new { success = false, error = "Invalid folder move." }
                            }));
                        }
                        catch (Exception ex)
                        {
                            w.SendWebMessage(JsonSerializer.Serialize(new {
                                type = "MOVE_FOLDER_RESULT",
                                payload = new { success = false, error = ex.Message }
                            }));
                        }
                    }
                    else if (type == "MOVE_ENTRY")
                    {
                        try
                        {
                            if (CurrentDbContext == null) return;
                            var payload = data.GetProperty("payload");
                            int id = payload.GetProperty("id").GetInt32();
                            int? targetFolderId = payload.TryGetProperty("targetFolderId", out var fProp) && fProp.ValueKind == JsonValueKind.Number ? fProp.GetInt32() : (int?)null;

                            var entry = CurrentDbContext.Entries.FirstOrDefault(e => e.Id == id);
                            if (entry != null)
                            {
                                entry.FolderId = targetFolderId;
                                entry.UpdatedAt = DateTime.UtcNow;
                                CurrentDbContext.SaveChanges();

                                _ = Task.Run(async () =>
                                {
                                    try
                                    {
                                        if (SupabaseService.IsLinked)
                                            await SupabaseService.UploadBackupAsync(DbPath, RecoveryPath);
                                    }
                                    catch { }
                                });
                            }

                            w.SendWebMessage(JsonSerializer.Serialize(new {
                                type = "MOVE_ENTRY_RESULT",
                                payload = new { success = true, id = id, targetFolderId = targetFolderId }
                            }));
                        }
                        catch (Exception ex)
                        {
                            w.SendWebMessage(JsonSerializer.Serialize(new {
                                type = "MOVE_ENTRY_RESULT",
                                payload = new { success = false, error = ex.Message }
                            }));
                        }
                    }
                    else if (type == "DELETE_FOLDER")
                    {
                        try
                        {
                            if (CurrentDbContext == null) return;
                            int id = data.GetProperty("payload").GetProperty("id").GetInt32();
                            var folder = CurrentDbContext.Folders.FirstOrDefault(f => f.Id == id);
                            if (folder != null)
                            {
                                var entries = CurrentDbContext.Entries.Where(e => e.FolderId == id).ToList();
                                foreach (var e in entries) e.FolderId = null;

                                var subfolders = CurrentDbContext.Folders.Where(f => f.ParentFolderId == id).ToList();
                                foreach (var sub in subfolders) sub.ParentFolderId = folder.ParentFolderId;

                                CurrentDbContext.Folders.Remove(folder);
                                CurrentDbContext.SaveChanges();

                                _ = Task.Run(async () =>
                                {
                                    try
                                    {
                                        if (SupabaseService.IsLinked)
                                            await SupabaseService.UploadBackupAsync(DbPath, RecoveryPath);
                                    }
                                    catch { }
                                });
                            }

                            w.SendWebMessage(JsonSerializer.Serialize(new {
                                type = "DELETE_FOLDER_RESULT",
                                payload = new { success = true, id = id }
                            }));
                        }
                        catch (Exception ex)
                        {
                            w.SendWebMessage(JsonSerializer.Serialize(new {
                                type = "DELETE_FOLDER_RESULT",
                                payload = new { success = false, error = ex.Message }
                            }));
                        }
                    }
                    else if (type == "LOCK_VAULT")
                    {
                        try
                        {
                            CurrentDbContext = null;
                            SqliteConnection.ClearAllPools();
                            w.SendWebMessage(JsonSerializer.Serialize(new {
                                type = "LOCK_RESULT",
                                payload = new {
                                    success = true,
                                    linkedAccount = File.Exists(DbPath) ? SupabaseService.GetLinkedAccountInfo() : null
                                }
                            }));
                        }
                        catch (Exception ex)
                        {
                            w.SendWebMessage(JsonSerializer.Serialize(new {
                                type = "LOCK_RESULT",
                                payload = new { success = false, error = ex.Message }
                            }));
                        }
                    }
                    else if (type == "START_RESTORE")
                    {
                        _ = Task.Run(async () =>
                        {
                            try
                            {
                                // Auto-backup current vault if linked before switching
                                if (SupabaseService.IsLinked && File.Exists(DbPath))
                                {
                                    try
                                    {
                                        await SupabaseService.UploadBackupAsync(DbPath, RecoveryPath);
                                    }
                                    catch { }
                                }
                                SupabaseService.SignOut();
                                w.SendWebMessage(JsonSerializer.Serialize(new {
                                    type = "START_RESTORE_RESULT",
                                    payload = new { success = true }
                                }));
                            }
                            catch (Exception ex)
                            {
                                w.SendWebMessage(JsonSerializer.Serialize(new {
                                    type = "START_RESTORE_RESULT",
                                    payload = new { success = false, error = ex.Message }
                                }));
                            }
                        });
                    }
                    else if (type == "CHECK_BACKUP_STATUS")
                    {
                        _ = Task.Run(async () =>
                        {
                            try
                            {
                                var backupStatus = await SupabaseService.GetBackupStatusAsync(DbPath);
                                w.SendWebMessage(JsonSerializer.Serialize(new {
                                    type = "BACKUP_STATUS_RESULT",
                                    payload = new {
                                        success = string.IsNullOrEmpty(backupStatus.ErrorMessage),
                                        isLinked = backupStatus.IsLinked,
                                        exists = backupStatus.Exists,
                                        isUpToDate = backupStatus.IsUpToDate,
                                        lastSynced = backupStatus.LastModifiedFormatted,
                                        lastSyncedIso = backupStatus.LastModifiedUtc?.ToString("o"),
                                        error = backupStatus.ErrorMessage
                                    }
                                }));
                            }
                            catch (Exception ex)
                            {
                                w.SendWebMessage(JsonSerializer.Serialize(new {
                                    type = "BACKUP_STATUS_RESULT",
                                    payload = new {
                                        success = false,
                                        isLinked = SupabaseService.IsLinked,
                                        exists = false,
                                        isUpToDate = false,
                                        error = ex.Message
                                    }
                                }));
                            }
                        });
                    }
                    else if (type == "SYNC_VAULT")
                    {
                        _ = Task.Run(async () =>
                        {
                            try
                            {
                                if (!SupabaseService.IsLinked)
                                {
                                    w.SendWebMessage(JsonSerializer.Serialize(new {
                                        type = "SYNC_RESULT",
                                        payload = new { success = false, error = "Google account not linked." }
                                    }));
                                    return;
                                }

                                bool backedUp = await SupabaseService.UploadBackupAsync(DbPath, RecoveryPath);
                                if (!backedUp)
                                {
                                    w.SendWebMessage(JsonSerializer.Serialize(new {
                                        type = "SYNC_RESULT",
                                        payload = new { success = false, error = "Failed to upload encrypted vault backup." }
                                    }));
                                    return;
                                }

                                var backupStatus = await SupabaseService.GetBackupStatusAsync(DbPath);
                                var formattedTime = backupStatus.LastModifiedFormatted ?? DateTime.Now.ToString("MMM d, yyyy h:mm tt");
                                var isoTime = (backupStatus.LastModifiedUtc ?? DateTime.UtcNow).ToString("o");

                                w.SendWebMessage(JsonSerializer.Serialize(new {
                                    type = "SYNC_RESULT",
                                    payload = new {
                                        success = true,
                                        isLinked = true,
                                        exists = true,
                                        isUpToDate = true,
                                        lastSynced = formattedTime,
                                        lastSyncedIso = isoTime
                                    }
                                }));

                                w.SendWebMessage(JsonSerializer.Serialize(new {
                                    type = "BACKUP_STATUS_RESULT",
                                    payload = new {
                                        success = true,
                                        isLinked = true,
                                        exists = true,
                                        isUpToDate = true,
                                        lastSynced = formattedTime,
                                        lastSyncedIso = isoTime,
                                        error = (string?)null
                                    }
                                }));
                            }
                            catch (Exception ex)
                            {
                                w.SendWebMessage(JsonSerializer.Serialize(new {
                                    type = "SYNC_RESULT",
                                    payload = new { success = false, error = ex.Message }
                                }));
                            }
                        });
                    }
                    else if (type == "OPEN_URL")
                    {
                        try
                        {
                            string targetUrl = data.GetProperty("payload").GetProperty("url").GetString() ?? "";
                            if (!string.IsNullOrEmpty(targetUrl))
                            {
                                if (!targetUrl.StartsWith("http://") && !targetUrl.StartsWith("https://"))
                                {
                                    targetUrl = "https://" + targetUrl;
                                }
                                SupabaseService.OpenBrowser(targetUrl);
                            }
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Error opening URL: {ex.Message}");
                        }
                    }
                    else if (type == "RESTORE_VAULT_BACKUP")
                    {
                        _ = Task.Run(async () =>
                        {
                            try
                            {
                                if (!SupabaseService.IsLinked)
                                {
                                    w.SendWebMessage(JsonSerializer.Serialize(new {
                                        type = "RESTORE_VAULT_BACKUP_RESULT",
                                        payload = new { success = false, error = "Please sign in with Google first." }
                                    }));
                                    return;
                                }

                                var backupData = await SupabaseService.DownloadBackupAsync();
                                if (backupData == null || backupData.DatabaseBytes == null || backupData.DatabaseBytes.Length == 0)
                                {
                                    var prof = SupabaseService.GetUserProfile();
                                    w.SendWebMessage(JsonSerializer.Serialize(new {
                                        type = "RESTORE_VAULT_BACKUP_RESULT",
                                        payload = new {
                                            success = false,
                                            error = $"No cloud backup found for {prof.Email}."
                                        }
                                    }));
                                    return;
                                }

                                SqliteConnection.ClearAllPools();
                                Directory.CreateDirectory(VaultDir);
                                if (File.Exists(DbPath + "-wal")) try { File.Delete(DbPath + "-wal"); } catch { }
                                if (File.Exists(DbPath + "-shm")) try { File.Delete(DbPath + "-shm"); } catch { }

                                await File.WriteAllBytesAsync(DbPath, backupData.DatabaseBytes);
                                if (backupData.RecoveryBytes != null && backupData.RecoveryBytes.Length > 0)
                                {
                                    await File.WriteAllBytesAsync(RecoveryPath, backupData.RecoveryBytes);
                                }

                                var profile = SupabaseService.GetUserProfile();
                                w.SendWebMessage(JsonSerializer.Serialize(new {
                                    type = "RESTORE_VAULT_BACKUP_RESULT",
                                    payload = new {
                                        success = true,
                                        user = new {
                                            name = profile.Name,
                                            email = profile.Email,
                                            picture = profile.PictureUrl
                                        },
                                        backupDate = backupData.LastModified ?? "Recent"
                                    }
                                }));
                            }
                            catch (Exception ex)
                            {
                                w.SendWebMessage(JsonSerializer.Serialize(new {
                                    type = "RESTORE_VAULT_BACKUP_RESULT",
                                    payload = new { success = false, error = ex.Message }
                                }));
                            }
                        });
                    }
                    else if (type == "VERIFY_RESTORE_PASSWORD")
                    {
                        string pass = data.GetProperty("payload").GetProperty("password").GetString() ?? "";
                        _ = Task.Run(() =>
                        {
                            try
                            {
                                string key = EncryptionService.DeriveKeyFromPassword(pass);
                                var db = new VaultDbContext(DbPath, key);
                                _ = db.Folders.Count();
                                CurrentDbContext = db;

                                try
                                {
                                    db.Database.ExecuteSqlRaw(@"
                                        CREATE TABLE IF NOT EXISTS ""PasswordHistories"" (
                                            ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_PasswordHistories"" PRIMARY KEY AUTOINCREMENT,
                                            ""EntryId"" INTEGER NOT NULL,
                                            ""OldPassword"" TEXT NOT NULL,
                                            ""ChangedAt"" TEXT NOT NULL,
                                            CONSTRAINT ""FK_PasswordHistories_Entries_EntryId"" FOREIGN KEY (""EntryId"") REFERENCES ""Entries"" (""Id"") ON DELETE CASCADE
                                        );
                                    ");
                                }
                                catch { }
                                try { db.Database.ExecuteSqlRaw(@"ALTER TABLE ""Entries"" ADD COLUMN ""Icon"" TEXT;"); } catch { }
                                try { db.Database.ExecuteSqlRaw(@"ALTER TABLE ""Folders"" ADD COLUMN ""Icon"" TEXT;"); } catch { }

                                var profile = SupabaseService.GetUserProfile();
                                w.SendWebMessage(JsonSerializer.Serialize(new {
                                    type = "VERIFY_RESTORE_PASSWORD_RESULT",
                                    payload = new {
                                        success = true,
                                        linkedAccount = new {
                                            name = profile.Name,
                                            email = profile.Email,
                                            picture = profile.PictureUrl
                                        }
                                    }
                                }));

                                _ = Task.Run(async () =>
                                {
                                    await NotificationService.SendNotificationAsync(
                                        "Vault Restored",
                                        "Your encrypted vault was successfully restored from cloud backup on this device.",
                                        "#10b981",
                                        ""
                                    );
                                });
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"Verify restore password failed: {ex.Message}");
                                w.SendWebMessage(JsonSerializer.Serialize(new {
                                    type = "VERIFY_RESTORE_PASSWORD_RESULT",
                                    payload = new { success = false, error = "Incorrect master password for this backup." }
                                }));

                                _ = Task.Run(async () =>
                                {
                                    await NotificationService.SendNotificationAsync(
                                        "Unsuccessful Restore Attempt",
                                        "An attempt was made to restore your cloud backup on this device, but an incorrect master password was entered.",
                                        "#d29922",
                                        ""
                                    );
                                });
                            }
                        });
                    }
                    else if (type == "CHECK_UPDATE")
                    {
                        _ = Task.Run(async () =>
                        {
                            try
                            {
                                string currentVer = "v1.1.7";
                                if (data.TryGetProperty("payload", out var pProp) &&
                                    pProp.TryGetProperty("currentVersion", out var cvProp) &&
                                    cvProp.ValueKind == JsonValueKind.String)
                                {
                                    string? cv = cvProp.GetString();
                                    if (!string.IsNullOrWhiteSpace(cv)) currentVer = cv;
                                }

                                var result = await UpdateService.CheckForUpdatesAsync(currentVer);
                                w.SendWebMessage(JsonSerializer.Serialize(new
                                {
                                    type = "CHECK_UPDATE_RESULT",
                                    payload = new
                                    {
                                        success = result.Success,
                                        hasUpdate = result.HasUpdate,
                                        currentVersion = result.CurrentVersion,
                                        latestVersion = result.LatestVersion,
                                        releaseName = result.ReleaseName,
                                        releaseNotes = result.ReleaseNotes,
                                        publishedAt = result.PublishedAt,
                                        downloadUrl = result.DownloadUrl,
                                        assetSize = result.AssetSize,
                                        error = result.Error
                                    }
                                }));
                            }
                            catch (Exception ex)
                            {
                                w.SendWebMessage(JsonSerializer.Serialize(new
                                {
                                    type = "CHECK_UPDATE_RESULT",
                                    payload = new { success = false, error = ex.Message }
                                }));
                            }
                        });
                    }
                    else if (type == "DOWNLOAD_UPDATE")
                    {
                        _ = Task.Run(async () =>
                        {
                            try
                            {
                                var payload = data.GetProperty("payload");
                                string downloadUrl = payload.GetProperty("downloadUrl").GetString() ?? "";

                                if (string.IsNullOrEmpty(downloadUrl))
                                {
                                    throw new ArgumentException("Download URL cannot be empty.");
                                }

                                int lastReportedPercent = -1;
                                bool success = await UpdateService.DownloadAndStageUpdateAsync(downloadUrl, (percent, bytesRead, totalBytes) =>
                                {
                                    if (percent != lastReportedPercent)
                                    {
                                        lastReportedPercent = percent;
                                        w.SendWebMessage(JsonSerializer.Serialize(new
                                        {
                                            type = "UPDATE_DOWNLOAD_PROGRESS",
                                            payload = new
                                            {
                                                percent = percent,
                                                bytesRead = bytesRead,
                                                totalBytes = totalBytes
                                            }
                                        }));
                                    }
                                });

                                w.SendWebMessage(JsonSerializer.Serialize(new
                                {
                                    type = "UPDATE_DOWNLOAD_COMPLETE",
                                    payload = new { success = success }
                                }));
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"Update download failed: {ex.Message}");
                                w.SendWebMessage(JsonSerializer.Serialize(new
                                {
                                    type = "UPDATE_DOWNLOAD_ERROR",
                                    payload = new { success = false, error = ex.Message }
                                }));
                            }
                        });
                    }
                    else if (type == "APPLY_UPDATE_AND_RESTART")
                    {
                        try
                        {
                            UpdateService.ApplyUpdateAndRestart();
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Apply update failed: {ex.Message}");
                            w.SendWebMessage(JsonSerializer.Serialize(new
                            {
                                type = "UPDATE_DOWNLOAD_ERROR",
                                payload = new { success = false, error = ex.Message }
                            }));
                        }
                    }
                }
                catch (Exception ex)

                {
                    Console.WriteLine("Error parsing message: " + ex.Message);
                }
            });

            _ = Task.Run(async () =>
            {
                try
                {
                    await SupabaseService.InitializeAsync();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Supabase pre-init: {ex.Message}");
                }
            });

            window.WaitForClose();
        }

        internal static class GlibNative
        {
            [System.Runtime.InteropServices.DllImport("libglib-2.0.so.0", EntryPoint = "g_set_prgname")]
            public static extern void g_set_prgname(string prgname);

            [System.Runtime.InteropServices.DllImport("libglib-2.0.so.0", EntryPoint = "g_set_application_name")]
            public static extern void g_set_application_name(string appname);
        }
    }
}
