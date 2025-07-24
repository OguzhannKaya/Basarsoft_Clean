using Basarsoft_Clean.DAL;
using Basarsoft_Clean.DAL.Repositories;
using Basarsoft_Clean.Helpers;
using Basarsoft_Clean.Models;
using NetTopologySuite.Geometries;
using NetTopologySuite.IO;
namespace Basarsoft_Clean.Services
{
    public class FeatureService : IFeatureService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly WKTReader _wktReader;
        public FeatureService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
            _wktReader = new WKTReader();
        }
        public async Task<ApiResponse<Feature>> AddFeatureAsync(CreateFeatureDTO featureDto)
        {
            try
            {
                var feature = new Feature
                {
                    Name = featureDto.Name,
                    WKT = _wktReader.Read(featureDto.WKT)
                };
                await _unitOfWork.Features.AddAsync(feature);
                await _unitOfWork.SaveChangesAsync();
                return ApiResponse<Feature>.SuccessResponse(feature, ResourceHelper.GetMessage("FeatureAdded"), 201);
            }
            catch (Exception ex)
            {
                var message = ResourceHelper.GetMessage("ExceptionError") + $"{ex.Message}";
                return ApiResponse<Feature>.ErrorResponse(message, 500);
            }

        }

        public async Task<ApiResponse<IEnumerable<Feature>>> AddRangeAsync(IEnumerable<CreateFeatureDTO> featureDtos)
        {
            int maxFeatureCount = 100;
            if (featureDtos == null || !featureDtos.Any())
            {
                return ApiResponse<IEnumerable<Feature>>.ErrorResponse(ResourceHelper.GetMessage("EmptyBatchError"), 400);
            }
            if (featureDtos.Count() > maxFeatureCount)
            {
                var message = ResourceHelper.GetMessage("BatchLimitError") + $"{maxFeatureCount}";
                return ApiResponse<IEnumerable<Feature>>.ErrorResponse(message, 400);
            }
            var invalid = featureDtos.Any(dto => string.IsNullOrWhiteSpace(dto.Name));
            if (invalid)
            {
                return ApiResponse<IEnumerable<Feature>>.ErrorResponse(ResourceHelper.GetMessage("InvalidName"), 400);
            }
            var features = new List<Feature>();
            foreach (var dto in featureDtos)
            {
                try
                {
                    var feature = new Feature
                    {
                        Name = dto.Name,
                        WKT = _wktReader.Read(dto.WKT)
                    };
                    features.Add(feature);
                }
                catch (Exception)
                {
                    return ApiResponse<IEnumerable<Feature>>.ErrorResponse(ResourceHelper.GetMessage("InvalidWKT"), 400);
                }
            }
            await _unitOfWork.BeginTransactionAsync();
            try
            {
                await _unitOfWork.Features.AddRangeAsync(features);
                await _unitOfWork.SaveChangesAsync();
                await _unitOfWork.CommitTransactionAsync();
                return ApiResponse<IEnumerable<Feature>>.SuccessResponse(features, ResourceHelper.GetMessage("FeaturesAdded"), 201);
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                var message = ResourceHelper.GetMessage("ExceptionError") + $"{ex.Message}";
                return ApiResponse<IEnumerable<Feature>>.ErrorResponse(message, 500);
            }
        }

        public async Task<ApiResponse<Feature>> DeleteFeatureAsync(int id)
        {
            try
            {
                var feature = await _unitOfWork.Features.GetByIdAsync(id);
                if (feature == null)
                {
                    return ApiResponse<Feature>.ErrorResponse(ResourceHelper.GetMessage("FeatureNotFound"), 404);
                }
                await _unitOfWork.Features.DeleteAsync(feature);
                await _unitOfWork.SaveChangesAsync();
                return ApiResponse<Feature>.SuccessResponse(feature,ResourceHelper.GetMessage("FeatureDeleted"), 200);
            }
            catch (Exception ex)
            {
                var message = ResourceHelper.GetMessage("ExceptionError") + $"{ex.Message}";
                return ApiResponse<Feature>.ErrorResponse(message, 500);
            }
        }

        public async Task<ApiResponse<List<Feature>>> GetAllFeaturesAsync(int? pageNumber)
        {
            if (pageNumber.HasValue && pageNumber < 1)
            {
                return ApiResponse<List<Feature>>.ErrorResponse(ResourceHelper.GetMessage("PageNumberError"), 400);
            }
            try
            {
                var features = await _unitOfWork.Features.GetAllAsync(pageNumber);
                if (features == null || !features.Any())
                {
                    return ApiResponse<List<Feature>>.ErrorResponse(ResourceHelper.GetMessage("FeaturesNotFound"), 404);
                }
                return ApiResponse<List<Feature>>.SuccessResponse(features, ResourceHelper.GetMessage("GetFeatures"), 200);
            }
            catch (Exception ex)
            {
                var message = ResourceHelper.GetMessage("ExceptionError") + $"{ex.Message}";
                return ApiResponse<List<Feature>>.ErrorResponse(message, 500);
            }
        }

        public async Task<ApiResponse<Feature>> GetFeatureByIdAsync(int id)
        {
            var point = await _unitOfWork.Features.GetByIdAsync(id);
            if (point == null)
            {
                return ApiResponse<Feature>.ErrorResponse(ResourceHelper.GetMessage("FeatureNotFound"), 404);
            }
            return ApiResponse<Feature>.SuccessResponse(point, ResourceHelper.GetMessage("GetFeature"), 200);
        }

        public async Task<ApiResponse<Feature>> UpdateFeatureAsync(int id, CreateFeatureDTO featureDto)
        {
            try
            {
                var feature = await _unitOfWork.Features.GetByIdAsync(id);
                if (feature == null)
                {
                    return ApiResponse<Feature>.ErrorResponse(ResourceHelper.GetMessage("FeatureNotFound"), 404);
                }
                feature.Name = featureDto.Name;
                feature.WKT = _wktReader.Read(featureDto.WKT);
                await _unitOfWork.Features.UpdateAsync(feature);
                await _unitOfWork.SaveChangesAsync();
                return ApiResponse<Feature>.SuccessResponse(feature, ResourceHelper.GetMessage("FeatureUpdated"), 200);
            }
            catch (Exception ex)
            {
                var message = ResourceHelper.GetMessage("ExceptionError") + $"{ex.Message}";
                return ApiResponse<Feature>.ErrorResponse(message, 500);
            }
        }
    }
}
