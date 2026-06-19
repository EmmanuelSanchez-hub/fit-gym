namespace FitGymFingerprint.Models;

public class FingerprintCaptureResponse
{
    public bool Success { get; set; }
    public string? Template { get; set; }
    public string? ImageBase64 { get; set; }
    public int Quality { get; set; }
    public string? Error { get; set; }
}

public class FingerprintVerifyResponse
{
    public bool Success { get; set; }
    public bool IsMatch { get; set; }
    public double Score { get; set; }
    public string? Error { get; set; }
}

public class FingerprintEnrollResponse
{
    public bool Success { get; set; }
    public string? UserId { get; set; }
    public string? Template { get; set; }
    public int ScansCompleted { get; set; }
    public string? Error { get; set; }
}

public class DeviceStatus
{
    public bool Connected { get; set; }
    public string DeviceName { get; set; } = "DigitalPersona 4500";
    public string? Port { get; set; }
    public string? FirmwareVersion { get; set; }
    public bool SensorReady { get; set; }
    public string? LastError { get; set; }
    public string Mode { get; set; } = "simulation";
}

public class EnrolledUser
{
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string Template { get; set; } = string.Empty;
    public DateTime EnrolledAt { get; set; }
}

public class DeviceStatusDto
{
    public bool Connected { get; set; }
    public string DeviceName { get; set; } = "DigitalPersona 4500";
    public string? Port { get; set; }
    public string? FirmwareVersion { get; set; }
    public bool SensorReady { get; set; }
    public string? LastError { get; set; }
    public string Mode { get; set; } = "simulation";

    public static DeviceStatusDto From(DeviceStatus s) => new()
    {
        Connected = s.Connected,
        DeviceName = s.DeviceName,
        Port = s.Port,
        FirmwareVersion = s.FirmwareVersion,
        SensorReady = s.SensorReady,
        LastError = s.LastError,
        Mode = s.Mode
    };
}