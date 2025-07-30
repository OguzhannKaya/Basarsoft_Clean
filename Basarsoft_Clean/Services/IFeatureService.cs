using API.DAL;
using API.Models;

namespace API.Services
{
    public interface IFeatureService
    {
        Task<ApiResponse<Feature>> AddFeatureAsync(CreateFeatureDTO featureDto);
        Task<ApiResponse<IEnumerable<Feature>>> AddRangeAsync(IEnumerable<CreateFeatureDTO> featureDtos);
        Task<ApiResponse<List<Feature>>> GetAllFeaturesAsync(int? pageNumber);
        Task<ApiResponse<Feature>> GetFeatureByIdAsync(int id);
        Task<ApiResponse<Feature>> UpdateFeatureAsync(int id, CreateFeatureDTO featureDto);
        Task<ApiResponse<Feature>> DeleteFeatureAsync(int id);
    }
}
