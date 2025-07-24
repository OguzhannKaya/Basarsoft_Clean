using Basarsoft_Clean.Attributes;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using System.Linq.Expressions;

namespace Basarsoft_Clean.DAL.Repositories
{
    public class GenericRepository<TEntity> : IGenericRepository<TEntity> where TEntity : class
    {
        protected readonly FeatureDb _context;
        protected readonly DbSet<TEntity> _dbSet;
        public GenericRepository(FeatureDb featureDb)
        {
            _context = featureDb;
            _dbSet = featureDb.Set<TEntity>();
        }
        public async Task AddAsync(TEntity entity)
        {
            await _dbSet.AddAsync(entity);
        }

        public async Task AddRangeAsync(IEnumerable<TEntity> entities)
        {
            await _dbSet.AddRangeAsync(entities);
        }


        public async Task DeleteAsync(TEntity entity)
        {
            await Task.FromResult(_dbSet.Remove(entity));
        }

        public async Task<List<TEntity>> GetAllAsync(int? pageNumber = null)
        {
            int pageSize = 10;
            var query = _dbSet.AsQueryable();
            var sortProperty = typeof(TEntity)
            .GetProperties()
            .FirstOrDefault(p => p.IsDefined(typeof(SortKeyAttribute), inherit: true));

            if (sortProperty != null)
            {
                // Expression<Func<TEntity, object>> olarak OrderBy
                var parameter = Expression.Parameter(typeof(TEntity), "e");
                var propertyAccess = Expression.Property(parameter, sortProperty);
                var converted = Expression.Convert(propertyAccess, typeof(object));
                var lambda = Expression.Lambda<Func<TEntity, object>>(converted, parameter);

                query = query.OrderBy(lambda);
            }

            if (pageNumber.HasValue && pageNumber.Value >0)
            {
                query = query.Skip((pageNumber.Value - 1) * pageSize).Take(pageSize);
            }
            return await query.ToListAsync();
        }

        public async Task<TEntity?> GetByIdAsync(int id)
        {
             return await _dbSet.FindAsync(id);
        }

        public async Task UpdateAsync(TEntity entity)
        {
             await Task.FromResult(_dbSet.Update(entity));
        }
    }
}
