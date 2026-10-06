using System;

namespace Vaulture.Core.Models;

public class PasswordHistory
{
    public int Id { get; set; }

    public int EntryId { get; set; }
    public Entry? Entry { get; set; }

    public string OldPassword { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
}
