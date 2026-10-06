namespace Vaulture.Core.Models;

public class CustomField
{
    public int Id { get; set; }
    
    public int EntryId { get; set; }
    public Entry? Entry { get; set; }

    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}
