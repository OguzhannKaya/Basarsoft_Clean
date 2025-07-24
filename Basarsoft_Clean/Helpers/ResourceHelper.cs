using System.Runtime.Versioning;

namespace Basarsoft_Clean.Helpers
{
    public class ResourceHelper
    {
        public static string GetMessage (string key)
        {
            return Resources.Messages.ResourceManager.GetString(key) ?? key;
        }
    }
}
