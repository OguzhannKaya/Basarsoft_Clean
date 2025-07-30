using Microsoft.EntityFrameworkCore.Storage;

namespace API.DAL.Repositories
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly FeatureDb _context;
        private IDbContextTransaction? _transaction;
        public IGenericRepository<Feature> Features { get; }
        public UnitOfWork(FeatureDb context, IGenericRepository<Feature> featureRepository)
        {
            _context = context;
            Features = featureRepository;
        }

        public async Task BeginTransactionAsync()
        {
            _transaction = await _context.Database.BeginTransactionAsync();
        }
        public async Task CommitTransactionAsync()
        {
            if (_transaction != null)
            {
                await _transaction.CommitAsync();
                await _transaction.DisposeAsync();
            }
        }
        public async Task RollbackTransactionAsync()
        {
            if (_transaction != null)
            {
                await _transaction.RollbackAsync();
                await _transaction.DisposeAsync();
            }
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }
    }
}
