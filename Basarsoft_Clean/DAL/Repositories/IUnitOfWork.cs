using Microsoft.EntityFrameworkCore.Storage;

namespace API.DAL.Repositories
{
    public interface IUnitOfWork : IDisposable
    {
        IGenericRepository<Feature> Features { get; }
        Task<int> SaveChangesAsync();
        Task BeginTransactionAsync();
        Task CommitTransactionAsync();
        Task RollbackTransactionAsync();
    }
}
