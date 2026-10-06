using System;
using System.Collections.Generic;

namespace Vaulture.Core.Models;

public class Folder
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    // Self-referencing relationship for infinite nesting
    public int? ParentFolderId { get; set; }
    public Folder? ParentFolder { get; set; }
    
    public List<Folder> SubFolders { get; set; } = new();
    public List<Entry> Entries { get; set; } = new();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
