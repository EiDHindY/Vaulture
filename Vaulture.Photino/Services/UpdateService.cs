using System;
using System.IO;
using System.IO.Compression;
using System.Formats.Tar;
using System.Net.Http;
using System.Text.Json;
using System.Diagnostics;
using System.Threading.Tasks;
using System.Linq;

namespace Vaulture.Photino.Services
{
    public class UpdateCheckResult
    {
        public bool Success { get; set; }
        public bool HasUpdate { get; set; }
        public string CurrentVersion { get; set; } = "";
        public string LatestVersion { get; set; } = "";
        public string ReleaseName { get; set; } = "";
        public string ReleaseNotes { get; set; } = "";
        public string PublishedAt { get; set; } = "";
        public string DownloadUrl { get; set; } = "";
        public long AssetSize { get; set; }
        public string? Error { get; set; }
    }

    public static class UpdateService
    {
        private static readonly HttpClient _httpClient = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(30)
        };

        private static string? _stagedUpdatePath;

        public static string? StagedUpdatePath => _stagedUpdatePath;

        static UpdateService()
        {
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "Vaulture-Desktop-App");
            _httpClient.DefaultRequestHeaders.Add("Accept", "application/vnd.github.v3+json");
        }

        public static bool IsNewerVersion(string latest, string current)
        {
            string cleanLatest = latest.Trim().TrimStart('v', 'V');
            string cleanCurrent = current.Trim().TrimStart('v', 'V');

            if (Version.TryParse(cleanLatest, out var vLatest) && Version.TryParse(cleanCurrent, out var vCurrent))
            {
                return vLatest > vCurrent;
            }

            var latestParts = cleanLatest.Split('.').Select(p => int.TryParse(p, out int n) ? n : 0).ToArray();
            var currentParts = cleanCurrent.Split('.').Select(p => int.TryParse(p, out int n) ? n : 0).ToArray();

            for (int i = 0; i < Math.Max(latestParts.Length, currentParts.Length); i++)
            {
                int l = i < latestParts.Length ? latestParts[i] : 0;
                int c = i < currentParts.Length ? currentParts[i] : 0;
                if (l > c) return true;
                if (l < c) return false;
            }

            return false;
        }

        public static async Task<UpdateCheckResult> CheckForUpdatesAsync(string currentVersion)
        {
            try
            {
                string apiUrl = "https://api.github.com/repos/EiDHindY/Vaulture/releases/latest";
                using var response = await _httpClient.GetAsync(apiUrl);

                if (!response.IsSuccessStatusCode)
                {
                    return new UpdateCheckResult
                    {
                        Success = false,
                        Error = $"GitHub API returned {response.StatusCode}."
                    };
                }

                string jsonStr = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(jsonStr);
                var root = doc.RootElement;

                string latestTag = root.GetProperty("tag_name").GetString() ?? "";
                string releaseName = root.TryGetProperty("name", out var nProp) ? nProp.GetString() ?? latestTag : latestTag;
                string releaseNotes = root.TryGetProperty("body", out var bProp) ? bProp.GetString() ?? "" : "";
                string publishedAt = root.TryGetProperty("published_at", out var pProp) ? pProp.GetString() ?? "" : "";

                bool isNewer = IsNewerVersion(latestTag, currentVersion);

                string expectedAssetSuffix = OperatingSystem.IsWindows() ? "-win-x64.zip" : "-linux-x64.tar.gz";
                string downloadUrl = "";
                long assetSize = 0;

                if (root.TryGetProperty("assets", out var assets) && assets.ValueKind == JsonValueKind.Array)
                {
                    foreach (var asset in assets.EnumerateArray())
                    {
                        string name = asset.TryGetProperty("name", out var aName) ? aName.GetString() ?? "" : "";
                        if (name.EndsWith(expectedAssetSuffix, StringComparison.OrdinalIgnoreCase))
                        {
                            downloadUrl = asset.TryGetProperty("browser_download_url", out var dl) ? dl.GetString() ?? "" : "";
                            assetSize = asset.TryGetProperty("size", out var s) ? s.GetInt64() : 0;
                            break;
                        }
                    }
                }

                return new UpdateCheckResult
                {
                    Success = true,
                    HasUpdate = isNewer && !string.IsNullOrEmpty(downloadUrl),
                    CurrentVersion = currentVersion,
                    LatestVersion = latestTag,
                    ReleaseName = releaseName,
                    ReleaseNotes = releaseNotes,
                    PublishedAt = publishedAt,
                    DownloadUrl = downloadUrl,
                    AssetSize = assetSize
                };
            }
            catch (Exception ex)
            {
                return new UpdateCheckResult
                {
                    Success = false,
                    Error = ex.Message
                };
            }
        }

        public static async Task<bool> DownloadAndStageUpdateAsync(string downloadUrl, Action<int, long, long> onProgress)
        {
            string tempDir = Path.Combine(Path.GetTempPath(), "VaultureUpdate");
            try
            {
                if (Directory.Exists(tempDir))
                {
                    try { Directory.Delete(tempDir, true); } catch { }
                }
                Directory.CreateDirectory(tempDir);

                string archiveName = OperatingSystem.IsWindows() ? "update.zip" : "update.tar.gz";
                string archivePath = Path.Combine(tempDir, archiveName);

                using (var response = await _httpClient.GetAsync(downloadUrl, HttpCompletionOption.ResponseHeadersRead))
                {
                    response.EnsureSuccessStatusCode();

                    long totalBytes = response.Content.Headers.ContentLength ?? -1L;
                    using var contentStream = await response.Content.ReadAsStreamAsync();
                    using var fileStream = new FileStream(archivePath, FileMode.Create, FileAccess.Write, FileShare.None, 8192, true);

                    byte[] buffer = new byte[16384];
                    long totalBytesRead = 0;
                    int bytesRead;
                    int lastPercent = -1;

                    while ((bytesRead = await contentStream.ReadAsync(buffer, 0, buffer.Length)) > 0)
                    {
                        await fileStream.WriteAsync(buffer, 0, bytesRead);
                        totalBytesRead += bytesRead;

                        if (totalBytes > 0)
                        {
                            int percent = (int)((totalBytesRead * 100) / totalBytes);
                            if (percent != lastPercent)
                            {
                                lastPercent = percent;
                                onProgress?.Invoke(percent, totalBytesRead, totalBytes);
                            }
                        }
                    }
                }

                // Extract archive into staging folder
                string extractedDir = Path.Combine(tempDir, "extracted");
                Directory.CreateDirectory(extractedDir);

                if (OperatingSystem.IsWindows())
                {
                    ZipFile.ExtractToDirectory(archivePath, extractedDir, overwriteFiles: true);
                }
                else
                {
                    using var fs = File.OpenRead(archivePath);
                    using var gz = new GZipStream(fs, CompressionMode.Decompress);
                    TarFile.ExtractToDirectory(gz, extractedDir, overwriteFiles: true);
                }

                // Locate directory containing the binary
                string targetExecutableName = OperatingSystem.IsWindows() ? "Vaulture.exe" : "Vaulture";
                string effectiveSource = extractedDir;

                if (!File.Exists(Path.Combine(effectiveSource, targetExecutableName)))
                {
                    foreach (var sub in Directory.GetDirectories(extractedDir))
                    {
                        if (File.Exists(Path.Combine(sub, targetExecutableName)))
                        {
                            effectiveSource = sub;
                            break;
                        }
                    }
                }

                _stagedUpdatePath = effectiveSource;
                return true;
            }
            catch
            {
                _stagedUpdatePath = null;
                throw;
            }
        }

        public static void ApplyUpdateAndRestart()
        {
            if (string.IsNullOrEmpty(_stagedUpdatePath) || !Directory.Exists(_stagedUpdatePath))
            {
                throw new InvalidOperationException("No staged update found to apply.");
            }

            string targetAppDir = AppContext.BaseDirectory;

            if (OperatingSystem.IsLinux())
            {
                string currentExe = Environment.ProcessPath ?? Path.Combine(targetAppDir, "Vaulture");
                string backupExe = currentExe + ".old";

                try
                {
                    if (File.Exists(backupExe))
                    {
                        File.Delete(backupExe);
                    }
                }
                catch { }

                try
                {
                    if (File.Exists(currentExe))
                    {
                        File.Move(currentExe, backupExe);
                    }
                }
                catch { }

                CopyDirectoryRecursive(_stagedUpdatePath, targetAppDir);

                if (File.Exists(currentExe))
                {
                    try
                    {
                        File.SetUnixFileMode(currentExe,
                            UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute |
                            UnixFileMode.GroupRead | UnixFileMode.GroupExecute |
                            UnixFileMode.OtherRead | UnixFileMode.OtherExecute);
                    }
                    catch { }
                }

                try
                {
                    if (File.Exists(backupExe))
                    {
                        File.Delete(backupExe);
                    }
                }
                catch { }

                Process.Start(new ProcessStartInfo
                {
                    FileName = currentExe,
                    WorkingDirectory = targetAppDir,
                    UseShellExecute = true
                });

                Environment.Exit(0);
            }
            else if (OperatingSystem.IsWindows())
            {
                string currentExe = Environment.ProcessPath ?? Path.Combine(targetAppDir, "Vaulture.exe");
                int currentPid = Environment.ProcessId;

                string scriptPath = Path.Combine(Path.GetTempPath(), "VaultureUpdate", "finish_update.cmd");
                string cmdContent = $@"@echo off
timeout /t 1 /nobreak > nul
:wait_process
tasklist /fi ""PID eq {currentPid}"" | find ""{currentPid}"" > nul
if not errorlevel 1 (
    timeout /t 1 /nobreak > nul
    goto wait_process
)

xcopy /y /e /s /i ""{_stagedUpdatePath}\*"" ""{targetAppDir}\""
start """" ""{currentExe}""
del ""%~f0""
";
                File.WriteAllText(scriptPath, cmdContent);

                Process.Start(new ProcessStartInfo
                {
                    FileName = "cmd.exe",
                    Arguments = $"/c \"{scriptPath}\"",
                    CreateNoWindow = true,
                    UseShellExecute = true
                });

                Environment.Exit(0);
            }
            else
            {
                throw new PlatformNotSupportedException("Unsupported operating system for in-app update.");
            }
        }

        private static void CopyDirectoryRecursive(string sourceDir, string destinationDir)
        {
            Directory.CreateDirectory(destinationDir);

            foreach (string file in Directory.GetFiles(sourceDir))
            {
                string fileName = Path.GetFileName(file);
                string destFile = Path.Combine(destinationDir, fileName);

                if (OperatingSystem.IsLinux() && File.Exists(destFile))
                {
                    try
                    {
                        File.Delete(destFile);
                    }
                    catch
                    {
                        try { File.Move(destFile, destFile + ".old", true); } catch { }
                    }
                }

                File.Copy(file, destFile, true);

                if (OperatingSystem.IsLinux() && (fileName == "Vaulture" || fileName.EndsWith(".so") || fileName.EndsWith(".desktop")))
                {
                    try
                    {
                        File.SetUnixFileMode(destFile,
                            UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute |
                            UnixFileMode.GroupRead | UnixFileMode.GroupExecute |
                            UnixFileMode.OtherRead | UnixFileMode.OtherExecute);
                    }
                    catch { }
                }
            }

            foreach (string subDir in Directory.GetDirectories(sourceDir))
            {
                string subDirName = Path.GetFileName(subDir);
                CopyDirectoryRecursive(subDir, Path.Combine(destinationDir, subDirName));
            }
        }
    }
}
