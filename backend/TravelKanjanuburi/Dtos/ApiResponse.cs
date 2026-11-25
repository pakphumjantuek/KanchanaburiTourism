namespace KanjanaburiTravel.Dtos
{
    public class ApiResponse
    {
        public bool IsSuccess { get; set; } = true;
        public HttpStatusCode StatusCode { get; set; }
        public object? Result { get; set; }
        public List<string> ErrorMessages { get; set; } = new();

        public static ApiResponse Success(object? result = null, HttpStatusCode statusCode = HttpStatusCode.OK)
        {
            return new ApiResponse
            {
                IsSuccess = true,
                StatusCode = statusCode,
                Result = result
            };
        }

        public static ApiResponse Fail(string error, HttpStatusCode statusCode)
        {
            return new ApiResponse
            {
                IsSuccess = false,
                StatusCode = statusCode,
                ErrorMessages = { error }
            };
        }
    }

}
