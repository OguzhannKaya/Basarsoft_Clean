using System.Runtime.Versioning;

namespace API.Helpers
{
    public class ResourceHelper
    {
        public static string GetMessage (string key)
        {
            return Resources.Messages.ResourceManager.GetString(key) ?? key;
        }
    }
}
