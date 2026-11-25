namespace TravelKanjanuburi.Helper
{
    using System.Text.Json;
    using System.Text.Json.Serialization;

    public class TimeOnlyJsonConverter : JsonConverter<TimeOnly>
    {
        public override TimeOnly Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            var s = reader.GetString();
            if (string.IsNullOrWhiteSpace(s))
                throw new JsonException("TimeOnly is empty.");

            // รองรับทั้ง "09:00" และ "09:00:00"
            if (TimeOnly.TryParse(s, out var t))
                return t;

            throw new JsonException($"Invalid TimeOnly: {s}");
        }

        public override void Write(Utf8JsonWriter writer, TimeOnly value, JsonSerializerOptions options)
            => writer.WriteStringValue(value.ToString("HH:mm:ss"));
    }

}
