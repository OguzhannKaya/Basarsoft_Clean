namespace Basarsoft_Clean.Models
{
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public T? Data { get; set; }
        public int StatusCode { get; set; }
        public ApiResponse(bool success, string message, T? data, int statusCode)
        {
            Success = success;
            Message = message;
            Data = data;
            StatusCode = statusCode;
        }
        public static ApiResponse<T> SuccessResponse(T data, string message = "Operation successful.", int statusCode = 200)
        {
            return new ApiResponse<T>(true, message, data,statusCode);
        }
        public static ApiResponse<T> ErrorResponse(string message = "An Error occured", int statusCode  = 400)
        {
            return new ApiResponse<T>(false, message,default,statusCode);
        }
    }
}
