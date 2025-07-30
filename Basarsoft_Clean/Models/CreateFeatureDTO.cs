using API.Attributes.Validation;
using System.ComponentModel.DataAnnotations;

namespace API.Models
{
    public class CreateFeatureDTO
    {
        [Required]
        [MaxLength(50, ErrorMessage = "Name cannot be longer than 50 characters.")]
        public string Name { get; set; }
        [Required]
        [ValidWKT(ErrorMessage = "Geçersiz WKT formatı.")]
        public string WKT { get; set; }
    }
}
