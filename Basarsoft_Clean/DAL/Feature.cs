using API.Attributes;
using Microsoft.AspNetCore.Mvc;
using NetTopologySuite.Geometries;
using NetTopologySuite.IO;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace API.DAL
{
    public class Feature
    {
        [Required]
        [SortKeyAttribute]
        public int Id { get; set; }
        [Required]
        [MaxLength(50, ErrorMessage = "Name cannot be longer than 50 characters.")]
        public string Name { get; set; }
        [Required]
        [JsonIgnore]
        public Geometry? WKT { get; set; }
        [JsonPropertyName("WKT")]
        public string? WKTString => WKT == null ? null : new WKTWriter().Write(WKT);
    }
}
