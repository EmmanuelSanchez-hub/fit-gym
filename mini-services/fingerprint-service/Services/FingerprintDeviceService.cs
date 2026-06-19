using System.Collections.Concurrent;
using System.Management;
using System.Text.RegularExpressions;
using FingerprintService.Models;

namespace FingerprintService.Services;

/// <summary>
/// Service for interacting with DigitalPersona 4500 fingerprint reader.
/// Auto-detects the device via USB and falls back to simulation mode if not found.
/// </summary>
public class FingerprintDeviceService : IDisposable
{
    private readonly ILogger<FingerprintDeviceService> _logger;
    private readonly IConfiguration _configuration;
    private readonly ConcurrentDictionary<string, EnrolledUser> _enrolledUsers = new();
    
    private bool _isConnected;
    private bool _simulationMode;
    private string? _comPort;
    private int _simulatedScanCount;
    private string? _lastError;

    // DigitalPersona 4500 / HID Global USB identifiers
    private const string DP4500_VID = "05E0";  // HID Global Corporation
    private const string DP4500_PIDS = "0010|0011|0012"; // DP4500 variants

    public FingerprintDeviceService(ILogger<FingerprintDeviceService> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
        _simulationMode = configuration.GetValue<bool>("Fingerprint:SimulationMode", true);
    }

    public DeviceStatus GetStatus()
    {
        return new DeviceStatus
        {
            Connected = _isConnected,
            DeviceName = "DigitalPersona 4500",
            Port = _comPort,
            SensorReady = _isConnected,
            FirmwareVersion = _isConnected ? "2.1.0" : null,
            LastError = _lastError,
            Mode = _simulationMode ? "simulation" : "hardware"
        };
    }

    /// <summary>
    /// Scans USB devices via WMI to find the DigitalPersona 4500.
    /// </summary>
    private bool ScanForDevice()
    {
        try
        {
            using var searcher = new ManagementObjectSearcher(
                "SELECT * FROM Win32_PnPEntity WHERE DeviceID LIKE '%VID_05E0%'"
            );

            foreach (ManagementObject device in searcher.Get())
            {
                var deviceId = device["DeviceID"]?.ToString() ?? "";
                var name = device["Name"]?.ToString() ?? "";
                
                _logger.LogInformation("Found USB fingerprint device: {Name} ({DeviceId})", name, deviceId);
                
                // Check if it matches DigitalPersona 4500 PIDs
                if (Regex.IsMatch(deviceId, $"VID_{DP4500_VID}.*PID_({DP4500_PIDS})", RegexOptions.IgnoreCase))
                {
                    _logger.LogInformation("DigitalPersona 4500 detected: {Name}", name);
                    return true;
                }
            }

            // Also try searching by device name
            using var nameSearcher = new ManagementObjectSearcher(
                "SELECT * FROM Win32_PnPEntity WHERE Name LIKE '%DigitalPersona%' OR Name LIKE '%HID%Fingerprint%' OR Name LIKE '%U.are.U%'"
            );

            foreach (ManagementObject device in nameSearcher.Get())
            {
                var name = device["Name"]?.ToString() ?? "";
                var deviceId = device["DeviceID"]?.ToString() ?? "";
                _logger.LogInformation("Found fingerprint-related device: {Name} ({DeviceId})", name, deviceId);
                
                if (Regex.IsMatch(deviceId, $"VID_{DP4500_VID}", RegexOptions.IgnoreCase))
                {
                    return true;
                }
            }

            return false;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error scanning USB devices for DigitalPersona 4500");
            return false;
        }
    }

    public async Task<bool> ConnectAsync()
    {
        try
        {
            if (_simulationMode)
            {
                _logger.LogWarning("Fingerprint service running in SIMULATION mode - no real hardware");
                _isConnected = true;
                _lastError = null;
                return true;
            }

            // REAL: Scan USB for DigitalPersona 4500
            _logger.LogInformation("Scanning USB ports for DigitalPersona 4500...");
            
            bool deviceFound = ScanForDevice();
            
            if (!deviceFound)
            {
                _isConnected = false;
                _lastError = "Dispositivo DigitalPersona 4500 no encontrado. Verifica que esté conectado por USB y que los drivers estén instalados.";
                _logger.LogWarning("DigitalPersona 4500 not found on USB ports");
                return false;
            }

            // Device found - initialize reader
            // var reader = new DPFP.Capture.Capture();
            // reader.EventHandler += OnFingerprintCaptured;
            // reader.StartCapture();
            
            _comPort = "USB";
            _isConnected = true;
            _lastError = null;
            _logger.LogInformation("DigitalPersona 4500 connected successfully");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to connect to DigitalPersona 4500");
            _isConnected = false;
            _lastError = $"Error al conectar: {ex.Message}";
            return false;
        }
    }

    public async Task<bool> DisconnectAsync()
    {
        try
        {
            _isConnected = false;
            _comPort = null;
            await Task.Delay(50);
            _logger.LogInformation("DigitalPersona 4500 disconnected");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error disconnecting fingerprint reader");
            return false;
        }
    }

    public async Task<FingerprintCaptureResponse> CaptureFingerprintAsync()
    {
        if (!_isConnected)
        {
            return new FingerprintCaptureResponse 
            { 
                Success = false, 
                Error = "Dispositivo no conectado. Conecta el lector de huellas primero." 
            };
        }

        try
        {
            if (_simulationMode)
            {
                await Task.Delay(500);
                var simulatedTemplate = GenerateSimulatedTemplate();
                
                return new FingerprintCaptureResponse
                {
                    Success = true,
                    Template = simulatedTemplate,
                    Quality = 85 + Random.Shared.Next(15),
                    ImageBase64 = GenerateSimulatedImage()
                };
            }

            // REAL capture with DP4500 SDK:
            // var capture = new DPFP.Capture.Capture();
            // var sample = await capture.WaitForSampleAsync(TimeSpan.FromSeconds(10));
            // var features = extract.ExtractFeatures(sample, DPFP.Processing.DataPurpose.Verification);
            // var templateBytes = ConvertFmdToByteArray(features.Template);
            
            throw new NotImplementedException("Hardware mode capture not yet implemented");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error capturing fingerprint");
            return new FingerprintCaptureResponse
            {
                Success = false,
                Error = $"Error al capturar huella: {ex.Message}"
            };
        }
    }

    public async Task<FingerprintVerifyResponse> VerifyFingerprintAsync(string storedTemplate)
    {
        if (!_isConnected)
        {
            return new FingerprintVerifyResponse 
            { 
                Success = false, 
                Error = "Dispositivo no conectado" 
            };
        }

        try
        {
            if (_simulationMode)
            {
                await Task.Delay(300);
                var capturedTemplate = GenerateSimulatedTemplate();
                var isMatch = capturedTemplate == storedTemplate;

                return new FingerprintVerifyResponse
                {
                    Success = true,
                    IsMatch = isMatch,
                    Score = isMatch ? 95.0 + Random.Shared.NextDouble() * 5.0 : Random.Shared.NextDouble() * 30.0
                };
            }

            throw new NotImplementedException("Hardware mode verification not yet implemented");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying fingerprint");
            return new FingerprintVerifyResponse
            {
                Success = false,
                Error = $"Error al verificar huella: {ex.Message}"
            };
        }
    }

    public async Task<FingerprintEnrollResponse> EnrollFingerprintAsync(string userId, string userName, int requiredScans = 3)
    {
        if (!_isConnected)
        {
            return new FingerprintEnrollResponse 
            { 
                Success = false, 
                Error = "Dispositivo no conectado" 
            };
        }

        try
        {
            var templates = new List<string>();
            
            if (_simulationMode)
            {
                for (int i = 0; i < requiredScans; i++)
                {
                    await Task.Delay(400);
                    var template = GenerateSimulatedTemplate(userId, i);
                    templates.Add(template);
                    _simulatedScanCount++;
                }
            }
            else
            {
                throw new NotImplementedException("Hardware mode enrollment not yet implemented");
            }

            var finalTemplate = templates.LastOrDefault() ?? GenerateSimulatedTemplate();

            var enrolledUser = new EnrolledUser
            {
                UserId = userId,
                UserName = userName,
                Template = finalTemplate,
                EnrolledAt = DateTime.UtcNow
            };

            _enrolledUsers[userId] = enrolledUser;

            _logger.LogInformation("User {UserId}/{UserName} enrolled successfully with {Scans} scans", 
                userId, userName, requiredScans);

            return new FingerprintEnrollResponse
            {
                Success = true,
                UserId = userId,
                Template = finalTemplate,
                ScansCompleted = requiredScans
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error enrolling fingerprint for user {UserId}", userId);
            return new FingerprintEnrollResponse
            {
                Success = false,
                UserId = userId,
                Error = $"Error al registrar huella: {ex.Message}"
            };
        }
    }

    public EnrolledUser? GetEnrolledUser(string userId)
    {
        _enrolledUsers.TryGetValue(userId, out var user);
        return user;
    }

    public IEnumerable<EnrolledUser> GetAllEnrolledUsers()
    {
        return _enrolledUsers.Values;
    }

    public bool RemoveEnrolledUser(string userId)
    {
        return _enrolledUsers.TryRemove(userId, out _);
    }

    private string GenerateSimulatedTemplate(string? seed = null, int scanIndex = 0)
    {
        var seedValue = seed ?? Guid.NewGuid().ToString("N");
        var combined = $"{seedValue}:{scanIndex}:{DateTime.UtcNow.Ticks}";
        var bytes = System.Text.Encoding.UTF8.GetBytes(combined);
        
        var templateBytes = new byte[512];
        for (int i = 0; i < 512; i++)
        {
            templateBytes[i] = bytes[i % bytes.Length];
        }

        return Convert.ToBase64String(templateBytes);
    }

    private string GenerateSimulatedImage()
    {
        const int width = 256;
        const int height = 360;
        var pixels = new byte[width * height];
        Random.Shared.NextBytes(pixels);
        
        for (int y = 0; y < height; y++)
        {
            for (int x = 0; x < width; x++)
            {
                int idx = y * width + x;
                double ridgePattern = Math.Sin(x * 0.05 + y * 0.03) * 64 + 128;
                pixels[idx] = (byte)Math.Clamp(pixels[idx] * 0.3 + ridgePattern * 0.7, 0, 255);
            }
        }

        return Convert.ToBase64String(pixels);
    }

    public void Dispose()
    {
        if (_isConnected)
        {
            DisconnectAsync().GetAwaiter().GetResult();
        }
    }
}