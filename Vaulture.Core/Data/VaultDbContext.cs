using Microsoft.EntityFrameworkCore;
using Vaulture.Core.Models;

namespace Vaulture.Core.Data;

public class VaultDbContext : DbContext
{
    private readonly string _databasePath;
    private readonly string _encryptionKey;

    public DbSet<Folder> Folders { get; set; } = null!;
    public DbSet<Entry> Entries { get; set; } = null!;
    public DbSet<CustomField> CustomFields { get; set; } = null!;
    public DbSet<PasswordHistory> PasswordHistories { get; set; } = null!;

    public VaultDbContext(string databasePath, string encryptionKey)
    {
        _databasePath = databasePath;
        _encryptionKey = encryptionKey;
        
        // Ensure SQLCipher is initialized
        SQLitePCL.Batteries_V2.Init();
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        // Using SQLCipher, the Password in the connection string sets the PRAGMA key automatically.
        var connectionString = $"Data Source={_databasePath};Password={_encryptionKey};";
        optionsBuilder.UseSqlite(connectionString);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Self-referencing folder relationship
        modelBuilder.Entity<Folder>()
            .HasOne(f => f.ParentFolder)
            .WithMany(f => f.SubFolders)
            .HasForeignKey(f => f.ParentFolderId)
            .OnDelete(DeleteBehavior.Cascade);
            
        // Entry to folder
        modelBuilder.Entity<Entry>()
            .HasOne(e => e.Folder)
            .WithMany(f => f.Entries)
            .HasForeignKey(e => e.FolderId)
            .OnDelete(DeleteBehavior.Cascade);
            
        // Cascade deletes for entry details
        modelBuilder.Entity<Entry>()
            .HasMany(e => e.CustomFields)
            .WithOne(c => c.Entry)
            .HasForeignKey(c => c.EntryId)
            .OnDelete(DeleteBehavior.Cascade);
            
        modelBuilder.Entity<Entry>()
            .HasMany(e => e.PasswordHistories)
            .WithOne(p => p.Entry)
            .HasForeignKey(p => p.EntryId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
