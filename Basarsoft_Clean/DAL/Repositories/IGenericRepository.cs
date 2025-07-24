using Microsoft.EntityFrameworkCore.Storage;

namespace Basarsoft_Clean.DAL.Repositories
{
    public interface IGenericRepository<TEntity> where TEntity : class
    {
        Task AddAsync(TEntity entity);
        Task AddRangeAsync(IEnumerable<TEntity> entities);
        Task UpdateAsync(TEntity entity);
        Task DeleteAsync(TEntity entity);
        Task<TEntity?> GetByIdAsync(int id);
        Task<List<TEntity>> GetAllAsync(int? pageNumber = null);
    }
}
