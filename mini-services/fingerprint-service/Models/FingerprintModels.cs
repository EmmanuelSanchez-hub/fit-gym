using System.Text.Json.Serialization;

namespace FingerprintService.Models;

public class FingerprintCaptureResponse
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }
    [JsonPropertyName("template")]
    public string? Template { get; set; }
    [JsonPropertyName("imageBase64")]
    public string? ImageBase64 { get; set; }
    [JsonPropertyName("quality")]
    public int Quality { get; set; }
    [JsonPropertyName("error")]
    public string? Error { get; set; }
}

public class FingerprintVerifyRequest
{
    [JsonPropertyName("template")]
    public string Template { get; set; } = string.Empty;
    [JsonPropertyName("deviceTemplate")]
    public string? DeviceTemplate { get; set; }
}

public class FingerprintVerifyResponse
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }
    [JsonPropertyName("isMatch")]
    public bool IsMatch { get; set; }
    [JsonPropertyName("score")]
    public double Score { get; set; }
    [JsonPropertyName("error")]
    public string? Error { get; set; }
}

public class FingerprintEnrollRequest
{
    [JsonPropertyName("userId")]
    public string UserId { get; set; } = string.Empty;
    [JsonPropertyName("userName")]
    public string UserName { get; set; } = string.Empty;
    [JsonPropertyName("requiredScans")]
    public int RequiredScans { get; set; } = 3;
}

public class FingerprintEnrollResponse
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }
    [JsonPropertyName("userId")]
    public string? UserId { get; set; }
    [JsonPropertyName("template")]
    public string? Template { get; set; }
    [JsonPropertyName("scansCompleted")]
    public int ScansCompleted { get; set; }
    [JsonPropertyName("error")]
    public string? Error { get; set; }
}

public class DeviceStatus
{
    [JsonPropertyName("connected")]
    public bool Connected { get; set; }
    [JsonPropertyName("deviceName")]
    public string DeviceName { get; set; } = "DigitalPersona 4500";
    [JsonPropertyName("port")]
    public string? Port { get; set; }
    [JsonPropertyName("firmwareVersion")]
    public string? FirmwareVersion { get; set; }
    [JsonPropertyName("sensorReady")]
    public bool SensorReady { get; set; }
    [JsonPropertyName("lastError")]
    public string? LastError { get; set; }
    [JsonPropertyName("mode")]
    public string Mode { get; set; } = "simulation";
}

public class EnrolledUser
{
    [JsonPropertyName("userId")]
    public string UserId { get; set; } = string.Empty;
    [JsonPropertyName("userName")]
    public string UserName { get; set; } = string.Empty;
    [JsonPropertyName("template")]
    public string Template { get; set; } = string.Empty;
    [JsonPropertyName("enrolledAt")]
    public DateTime EnrolledAt { get; set; }
}