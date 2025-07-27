using Microsoft.AspNetCore.Mvc;

namespace MapViewer.Controllers
{
    public class MapController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
