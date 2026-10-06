using System;
using System.Collections.Generic;

namespace Vaulture.Core.Models;

public class Entry
{
    public int Id { get; set; }
    
    // Optional folder assignment
    public int? FolderId { get; set; }
    public Folder? Folder { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;

    public List<CustomField> CustomFields { get; set; } = new();
    public List<PasswordHistory> PasswordHistories { get; set; } = new();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
