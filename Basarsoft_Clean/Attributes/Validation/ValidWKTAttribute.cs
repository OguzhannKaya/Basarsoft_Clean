using NetTopologySuite.IO;
using System.ComponentModel.DataAnnotations;

namespace API.Attributes.Validation
{
    public class ValidWKTAttribute : ValidationAttribute
    {
        protected override ValidationResult IsValid(object? value, ValidationContext validationContext)
        {
            var wkt = value as string;
            if (string.IsNullOrWhiteSpace(wkt))
            {
                return new ValidationResult("WKT boş olamaz.");
            }
            try
            {
                var reader = new WKTReader();
                reader.Read(wkt);                    //OGC (Open Geospatial Consortium) standardına göre kontrol eder.
                return ValidationResult.Success!;
            }
            catch
            {
                return new ValidationResult("WKT formatı geçersiz.");
            }
        }
    }
}
