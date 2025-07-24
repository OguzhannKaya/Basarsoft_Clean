using Basarsoft_Clean.DAL;
using Basarsoft_Clean.Models;

namespace Basarsoft_Clean.Services
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
