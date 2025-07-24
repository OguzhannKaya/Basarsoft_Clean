using Microsoft.EntityFrameworkCore;

namespace Basarsoft_Clean.DAL
{
    public class FeatureDb : DbContext
    {
        public FeatureDb(DbContextOptions<FeatureDb> options) : base(options) { }
        public DbSet<Feature> Features { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Feature>().ToTable("Features", schema : "public" );
            modelBuilder.Entity<Feature>(feature =>
            {
                feature.HasKey(e => e.Id);

                feature.Property(e => e.Name)
                      .HasColumnType("varchar")
                      .HasColumnName("Name");

                feature.Property(e => e.WKT)
                      .HasColumnType("geometry")
                      .HasColumnName("WKT"); 
            });
        }
    }
}
