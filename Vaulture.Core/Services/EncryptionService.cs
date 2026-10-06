using System;
using System.Security.Cryptography;
using System.Text;

namespace Vaulture.Core.Services;

public class EncryptionService
{
    private const int Iterations = 600000;
    private const int KeySize = 32; // 256 bit

    // In a real app, this salt would be generated once and stored in plaintext (e.g., in a separate config file or plain header of db).
    // For this local app, we can use a hardcoded app-specific salt, OR better, store it in an unencrypted preferences file.
    // To keep it simple and portable without extra files, we can use a static salt (less secure against rainbow tables, but OK for local db with strong password).
    // Alternatively, we can derive the key without a salt for the recovery key, and use the recovery key as the DB password.
    // Actually, SQLCipher already handles KDF internally with its own salt for the DB. 
    // We just need to convert the Master Password into a consistent 256-bit string to feed to SQLCipher.
    
    private static readonly byte[] StaticSalt = Encoding.UTF8.GetBytes("VaultureAppSalt2024!_LocalOnly");

    /// <summary>
    /// Derives a consistent encryption key from the given master password.
    /// </summary>
    public static string DeriveKeyFromPassword(string password)
    {
        byte[] passwordBytes = Encoding.UTF8.GetBytes(password);
        byte[] keyBytes = Rfc2898DeriveBytes.Pbkdf2(passwordBytes, StaticSalt, Iterations, HashAlgorithmName.SHA256, KeySize);
        return Convert.ToBase64String(keyBytes);
    }

    /// <summary>
    /// Generates a random, secure Recovery Key (formatted for readability).
    /// </summary>
    public static string GenerateRecoveryKey()
    {
        byte[] randomBytes = new byte[24];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(randomBytes);
        }
        
        string base64 = Convert.ToBase64String(randomBytes)
            .Replace("+", "")
            .Replace("/", "")
            .Replace("=", "")
            .ToUpperInvariant();
            
        // Return a chunked string for readability: XXXX-XXXX-XXXX-XXXX
        var sb = new StringBuilder();
        for (int i = 0; i < 16; i++)
        {
            if (i > 0 && i % 4 == 0)
                sb.Append("-");
            sb.Append(base64[i]);
        }
        return sb.ToString();
    }

    public static void CreateRecoveryFile(string masterPassword, string recoveryKey, string filePath)
    {
        // Use the recovery key (without dashes) as the AES key
        byte[] key = Encoding.UTF8.GetBytes(recoveryKey.Replace("-", "").PadRight(32, '0').Substring(0, 32));
        byte[] iv = new byte[16];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(iv);

        using var aes = Aes.Create();
        aes.Key = key;
        aes.IV = iv;

        using var encryptor = aes.CreateEncryptor();
        byte[] passBytes = Encoding.UTF8.GetBytes(masterPassword);
        byte[] encryptedPass = encryptor.TransformFinalBlock(passBytes, 0, passBytes.Length);

        byte[] finalPayload = new byte[iv.Length + encryptedPass.Length];
        Buffer.BlockCopy(iv, 0, finalPayload, 0, iv.Length);
        Buffer.BlockCopy(encryptedPass, 0, finalPayload, iv.Length, encryptedPass.Length);

        System.IO.File.WriteAllBytes(filePath, finalPayload);
    }

    public static string RecoverMasterPassword(string recoveryKey, string filePath)
    {
        byte[] payload = System.IO.File.ReadAllBytes(filePath);
        byte[] iv = new byte[16];
        Buffer.BlockCopy(payload, 0, iv, 0, 16);
        byte[] encryptedPass = new byte[payload.Length - 16];
        Buffer.BlockCopy(payload, 16, encryptedPass, 0, encryptedPass.Length);

        byte[] key = Encoding.UTF8.GetBytes(recoveryKey.Replace("-", "").PadRight(32, '0').Substring(0, 32));

        using var aes = Aes.Create();
        aes.Key = key;
        aes.IV = iv;

        using var decryptor = aes.CreateDecryptor();
        byte[] passBytes = decryptor.TransformFinalBlock(encryptedPass, 0, encryptedPass.Length);
        return Encoding.UTF8.GetString(passBytes);
    }
}
