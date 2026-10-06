using System;
using Vaulture.Core.Data;
using Vaulture.Core.Services;
using System.IO;

class Program {
    static void Main() {
        try {
            string key = EncryptionService.DeriveKeyFromPassword("testpass");
            string dbPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "Vaulture", "test_vault.db");
            var db = new VaultDbContext(dbPath, key);
            db.Database.EnsureCreated();
            Console.WriteLine("SUCCESS!");
        } catch (Exception ex) {
            Console.WriteLine("ERROR: " + ex.ToString());
        }
    }
}
