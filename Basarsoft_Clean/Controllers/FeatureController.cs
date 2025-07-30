using API.Models;
using API.Services;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FeatureController : ControllerBase
    {
        private readonly IFeatureService _featureService;
        public FeatureController(IFeatureService featureService)
        {
            _featureService = featureService;
        }
        [HttpGet]
        public async Task<IActionResult> GetAllFeatures(int? pageNumber)
        {
            var response = await _featureService.GetAllFeaturesAsync(pageNumber);
            return StatusCode(response.StatusCode, response);
        }
        [HttpGet("{id}")]
        public async Task<IActionResult> GetFeatureById(int id)
        {
            var response = await _featureService.GetFeatureByIdAsync(id);
            return StatusCode(response.StatusCode, response);
        }
        [HttpPost]
        public async Task<IActionResult> AddFeature(CreateFeatureDTO featureDto)
        {
            var response = await _featureService.AddFeatureAsync(featureDto);
            return StatusCode(response.StatusCode, response);
        }
        [HttpPost("AddRange")]
        public async Task<IActionResult> AddRange(IEnumerable<CreateFeatureDTO> featureDtos)
        {
            var response = await _featureService.AddRangeAsync(featureDtos);
            return StatusCode(response.StatusCode, response);
        }
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateFeature(int id, CreateFeatureDTO featureDto)
        {
            var response = await _featureService.UpdateFeatureAsync(id, featureDto);
            return StatusCode(response.StatusCode, response);
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFeature(int id)
        {
            var response = await _featureService.DeleteFeatureAsync(id);
            return StatusCode(response.StatusCode, response);
        }
    }
}
