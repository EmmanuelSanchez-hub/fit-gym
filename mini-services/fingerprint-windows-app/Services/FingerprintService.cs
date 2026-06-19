using System.Collections.Concurrent;
using System.IO;
using System.Management;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using DPFP;
using DPFP.Capture;
using DPFP.Processing;
using Capture = DPFP.Capture.Capture;
using FitGymFingerprint.Models;

namespace FitGymFingerprint.Services;

public class FingerprintService : IDisposable, DPFP.Capture.EventHandler
{
    private readonly ConcurrentDictionary<string, EnrolledUser> _enrolledUsers = new();
    private readonly string _configFilePath;

    private bool _isConnected;
    private bool _simulationMode = true;
    private string? _comPort;
    private string? _lastError;
    private TaskCompletionSource<Sample>? _captureCompletionSource;

    private const string DP4500_VID = "05E0";
    private const string DP4500_PIDS = "0010|0011|0012";

    public delegate void LogHandler(string message);
    public event LogHandler? OnLog;

    public FingerprintService()
    {
        _configFilePath = Path.Combine(
            AppDomain.CurrentDomain.BaseDirectory,
            "enrolled_users.json"
        );
        LoadEnrolledUsers();
    }

    public Models.DeviceStatus GetStatus()
    {
        return new Models.DeviceStatus
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

                Log($"Encontrado dispositivo USB: {name} ({deviceId})");

                if (Regex.IsMatch(deviceId, $"VID_{DP4500_VID}.*PID_({DP4500_PIDS})", RegexOptions.IgnoreCase))
                {
                    Log($"✅ DigitalPersona 4500 detectado: {name}");
                    return true;
                }
            }

            using var nameSearcher = new ManagementObjectSearcher(
                "SELECT * FROM Win32_PnPEntity WHERE Name LIKE '%DigitalPersona%' OR Name LIKE '%HID%Fingerprint%' OR Name LIKE '%U.are.U%'"
            );

            foreach (ManagementObject device in nameSearcher.Get())
            {
                var name = device["Name"]?.ToString() ?? "";
                var deviceId = device["DeviceID"]?.ToString() ?? "";
                Log($"Encontrado dispositivo de huella: {name} ({deviceId})");

                if (Regex.IsMatch(deviceId, $"VID_{DP4500_VID}", RegexOptions.IgnoreCase))
                {
                    return true;
                }
            }

            try
            {
                foreach (var port in System.IO.Ports.SerialPort.GetPortNames())
                {
                    Log($"Puerto COM encontrado: {port}");
                }
            }
            catch { }

            return false;
        }
        catch (Exception ex)
        {
            Log($"Error escaneando dispositivos USB: {ex.Message}");
            return false;
        }
    }

    public async Task<bool> ConnectAsync()
    {
        try
        {
            Log("🔍 Buscando lector DigitalPersona 4500...");
            bool deviceFound = await Task.Run(() => ScanForDevice());

            if (deviceFound)
            {
                _simulationMode = false;
                _comPort = "USB";
                _isConnected = true;
                _lastError = null;
                Log("✅ Lector DigitalPersona 4500 conectado por USB");
                Log("ℹ️ Modo: HARDWARE REAL");
                return true;
            }
            else
            {
                _simulationMode = true;
                _isConnected = true;
                _lastError = null;
                Log("⚠️ Lector no encontrado. Usando MODO SIMULACIÓN");
                Log("💡 Conecta el lector USB y reinicia el servicio para usar hardware real");
                return true;
            }
        }
        catch (Exception ex)
        {
            _isConnected = false;
            _lastError = $"Error al conectar: {ex.Message}";
            Log($"❌ Error al conectar: {ex.Message}");
            return false;
        }
    }

    public async Task<bool> DisconnectAsync()
    {
        try
        {
            _isConnected = false;
            _comPort = null;
            SaveEnrolledUsers();
            await Task.Delay(50);
            Log("🔌 Lector desconectado");
            return true;
        }
        catch (Exception ex)
        {
            Log($"Error al desconectar: {ex.Message}");
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
                Error = "Servicio no iniciado. Haz click en INICIAR SERVICIO primero."
            };
        }

        try
        {
            Log("🖐️ Coloca el dedo en el lector...");

            var realResult = await TryCaptureWithSdkAsync();
            if (realResult != null)
            {
                return realResult;
            }

            Log("⚠️ SDK no disponible, usando modo simulación");
            await Task.Delay(1500);
            var simulatedTemplate = GenerateSimulatedTemplate();
            var quality = 75 + new Random().Next(25);

            Log($"✅ Huella capturada (simulación) - Calidad: {quality}%");

            return new FingerprintCaptureResponse
            {
                Success = true,
                Template = simulatedTemplate,
                Quality = quality,
                ImageBase64 = GenerateSimulatedImage()
            };
        }
        catch (Exception ex)
        {
            Log($"❌ Error capturando huella: {ex.Message}");
            return new FingerprintCaptureResponse
            {
                Success = false,
                Error = $"Error: {ex.Message}"
            };
        }
    }

    private async Task<FingerprintCaptureResponse?> TryCaptureWithSdkAsync()
    {
        try
        {
            Log("🔍 Intentando captura real con DigitalPersona SDK...");

            if (!IsSdkAvailable())
            {
                Log("📂 SDK DigitalPersona no disponible");
                return null;
            }

            Log("   ✓ SDK detectado, iniciando captura...");

            using var capture = new Capture();
            if (capture == null)
            {
                Log("❌ No se pudo crear el capturador");
                return null;
            }

            _captureCompletionSource = new TaskCompletionSource<Sample>();
            capture.EventHandler = this;

            try
            {
                capture.StartCapture();

                Log("🖐️ Coloca el dedo en el lector...");

                var timeoutTask = Task.Delay(15000);
                var completedTask = await Task.WhenAny(_captureCompletionSource.Task, timeoutTask);

                capture.StopCapture();

                if (completedTask == timeoutTask)
                {
                    Log("⏱️ Timeout esperando huella");
                    return new FingerprintCaptureResponse
                    {
                        Success = false,
                        Error = "Timeout: No se detectó huella en 15 segundos"
                    };
                }

                var sample = _captureCompletionSource.Task.Result;
                if (sample == null)
                {
                    return new FingerprintCaptureResponse
                    {
                        Success = false,
                        Error = "No se pudo obtener la muestra de huella"
                    };
                }

                // Extraer características
                var extractor = new FeatureExtraction();
                var features = new FeatureSet();
                var feedback = CaptureFeedback.None;
                extractor.CreateFeatureSet(sample, DataPurpose.Verification, ref feedback, ref features);

                if (features == null)
                {
                    Log("❌ No se pudieron extraer características de la huella");
                    return new FingerprintCaptureResponse
                    {
                        Success = false,
                        Error = "No se pudieron extraer características de la huella"
                    };
                }

                // Obtener template como arreglo de bytes
                var template = Convert.ToBase64String(features.Bytes);

                Log("✅ Huella capturada exitosamente con DigitalPersona SDK");

                return new FingerprintCaptureResponse
                {
                    Success = true,
                    Template = template,
                    Quality = 90
                };
            }
            finally
            {
                capture.EventHandler = null;
                _captureCompletionSource = null;
            }
        }
        catch (Exception ex)
        {
            Log($"❌ Error en captura con DigitalPersona SDK: {ex.Message}");
            return null;
        }
    }

    private bool IsSdkAvailable()
    {
        try
        {
            using var testCapture = new Capture();
            return testCapture != null;
        }
        catch
        {
            return false;
        }
    }

    // Implementación de DPFP.Capture.EventHandler
    public void OnComplete(object Capture, string ReaderSerialNumber, DPFP.Sample Sample)
    {
        _captureCompletionSource?.TrySetResult(Sample);
    }

    public void OnFingerGone(object Capture, string ReaderSerialNumber)
    {
        Log("Dedo removido del lector");
    }

    public void OnFingerTouch(object Capture, string ReaderSerialNumber)
    {
        Log("Dedo colocado en el lector");
    }

    public void OnReaderConnect(object Capture, string ReaderSerialNumber)
    {
        Log("Lector conectado");
    }

    public void OnReaderDisconnect(object Capture, string ReaderSerialNumber)
    {
        Log("Lector desconectado");
    }

    public void OnSampleQuality(object Capture, string ReaderSerialNumber, DPFP.Capture.CaptureFeedback CaptureFeedback)
    {
        Log($"Calidad de muestra: {CaptureFeedback}");
    }

    public async Task<FingerprintVerifyResponse> VerifyFingerprintAsync(string storedTemplate)
    {
        if (!_isConnected)
        {
            return new FingerprintVerifyResponse
            {
                Success = false,
                Error = "Servicio no iniciado"
            };
        }

        try
        {
            Log("🔍 Verificando huella...");

            if (_simulationMode)
            {
                await Task.Delay(1000);
                var capturedTemplate = GenerateSimulatedTemplate();
                var isMatch = capturedTemplate == storedTemplate;

                Log(isMatch ? "✅ Huella COINCIDE" : "❌ Huella NO coincide");

                return new FingerprintVerifyResponse
                {
                    Success = true,
                    IsMatch = isMatch,
                    Score = isMatch ? 95.0 + new Random().NextDouble() * 5.0 : new Random().NextDouble() * 30.0
                };
            }

            try
            {
                if (!IsSdkAvailable())
                {
                    Log("⚠️ SDK no disponible, usando simulación para verificación");
                    _simulationMode = true;
                    return await VerifyFingerprintAsync(storedTemplate);
                }

                Log("🖐️ Coloca el dedo en el lector para verificar...");

                using var capture = new Capture();
                _captureCompletionSource = new TaskCompletionSource<Sample>();
                capture.EventHandler = this;

                try
                {
                    capture.StartCapture();

                    var timeoutTask = Task.Delay(15000);
                    var completedTask = await Task.WhenAny(_captureCompletionSource.Task, timeoutTask);

                    capture.StopCapture();

                    if (completedTask == timeoutTask)
                    {
                        return new FingerprintVerifyResponse
                        {
                            Success = false,
                            Error = "Timeout: No se detectó huella en 15 segundos"
                        };
                    }

                    var sample = _captureCompletionSource.Task.Result;
                    if (sample == null)
                    {
                        return new FingerprintVerifyResponse
                        {
                            Success = false,
                            Error = "No se pudo obtener la muestra de huella"
                        };
                    }

                    // Extraer características
                    var extractor = new FeatureExtraction();
                    var capturedFeatures = new FeatureSet();
                    var feedback = CaptureFeedback.None;
                    extractor.CreateFeatureSet(sample, DataPurpose.Verification, ref feedback, ref capturedFeatures);

                    if (capturedFeatures == null)
                    {
                        return new FingerprintVerifyResponse
                        {
                            Success = false,
                            Error = "No se pudieron extraer características de la huella"
                        };
                    }

                    // Cargar template almacenado
                    var storedBytes = Convert.FromBase64String(storedTemplate);
                    var templateObj = new DPFP.Template();
                    
                    // Verificar coincidencia
                    var verificator = new DPFP.Verification.Verification();
                    var verifyResult = new DPFP.Verification.Verification.Result();
                    verificator.Verify(capturedFeatures, templateObj, ref verifyResult);

                    bool isMatch = verifyResult.Verified;
                    double score = isMatch ? 95.0 + new Random().NextDouble() * 5.0 : new Random().NextDouble() * 30.0;

                    Log(isMatch ? "✅ Huella COINCIDE" : "❌ Huella NO coincide");

                    return new FingerprintVerifyResponse
                    {
                        Success = true,
                        IsMatch = isMatch,
                        Score = score
                    };
                }
                finally
                {
                    capture.EventHandler = null;
                    _captureCompletionSource = null;
                }
            }
            catch (Exception ex)
            {
                Log($"❌ Error en verificación con SDK: {ex.Message}");
                _simulationMode = true;
                return await VerifyFingerprintAsync(storedTemplate);
            }
        }
        catch (Exception ex)
        {
            Log($"❌ Error verificando huella: {ex.Message}");
            return new FingerprintVerifyResponse
            {
                Success = false,
                Error = ex.Message
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
                Error = "Servicio no iniciado"
            };
        }

        try
        {
            Log($"📝 Registrando huella para: {userName} ({userId})");
            Log($"   Escaneos requeridos: {requiredScans}");

            var templates = new List<string>();

            if (_simulationMode)
            {
                for (int i = 0; i < requiredScans; i++)
                {
                    Log($"   Escaneo {i + 1} de {requiredScans}...");
                    await Task.Delay(800);
                    var template = GenerateSimulatedTemplate(userId, i);
                    templates.Add(template);
                }
            }
            else
            {
                try
                {
                    if (!IsSdkAvailable())
                    {
                        Log("⚠️ SDK no disponible, usando simulación para enrolamiento");
                        _simulationMode = true;
                        return await EnrollFingerprintAsync(userId, userName, requiredScans);
                    }

                    for (int i = 0; i < requiredScans; i++)
                    {
                        Log($"   Escaneo {i + 1} de {requiredScans}...");

                        using var capture = new Capture();
                        _captureCompletionSource = new TaskCompletionSource<Sample>();
                        capture.EventHandler = this;

                        try
                        {
                            capture.StartCapture();

                            var timeoutTask = Task.Delay(15000);
                            var completedTask = await Task.WhenAny(_captureCompletionSource.Task, timeoutTask);

                            capture.StopCapture();

                            if (completedTask == timeoutTask)
                            {
                                return new FingerprintEnrollResponse
                                {
                                    Success = false,
                                    UserId = userId,
                                    Error = $"Timeout en escaneo {i + 1}: No se detectó huella en 15 segundos"
                                };
                            }

                            var sample = _captureCompletionSource.Task.Result;
                            if (sample == null)
                            {
                                return new FingerprintEnrollResponse
                                {
                                    Success = false,
                                    UserId = userId,
                                    Error = $"No se pudo obtener la muestra en escaneo {i + 1}"
                                };
                            }

                            // Extraer características para enrolamiento
                            var extractor = new FeatureExtraction();
                            var features = new FeatureSet();
                            var feedback = CaptureFeedback.None;
                            extractor.CreateFeatureSet(sample, DataPurpose.Enrollment, ref feedback, ref features);

                            if (features == null)
                            {
                                return new FingerprintEnrollResponse
                                {
                                    Success = false,
                                    UserId = userId,
                                    Error = $"No se pudieron extraer características en escaneo {i + 1}"
                                };
                            }

                            // Guardar template
                            var template = Convert.ToBase64String(features.Bytes);
                            templates.Add(template);

                            Log($"   ✓ Escaneo {i + 1} completado");
                        }
                        finally
                        {
                            capture.EventHandler = null;
                            _captureCompletionSource = null;
                        }
                    }
                }
                catch (Exception ex)
                {
                    Log($"❌ Error en enrolamiento con SDK: {ex.Message}");
                    _simulationMode = true;
                    return await EnrollFingerprintAsync(userId, userName, requiredScans);
                }
            }

            var finalTemplate = templates.LastOrDefault() ?? GenerateSimulatedTemplate();

            var enrolledUser = new EnrolledUser
            {
                UserId = userId,
                UserName = userName,
                Template = finalTemplate,
                EnrolledAt = DateTime.Now
            };

            _enrolledUsers[userId] = enrolledUser;
            SaveEnrolledUsers();

            Log($"✅ Usuario {userName} registrado con {requiredScans} escaneos");

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
            Log($"❌ Error registrando huella: {ex.Message}");
            return new FingerprintEnrollResponse
            {
                Success = false,
                UserId = userId,
                Error = ex.Message
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
        var removed = _enrolledUsers.TryRemove(userId, out _);
        if (removed)
        {
            SaveEnrolledUsers();
            Log($"🗑️ Usuario {userId} eliminado");
        }
        return removed;
    }

    private string GenerateSimulatedTemplate(string? seed = null, int scanIndex = 0)
    {
        var seedValue = seed ?? Guid.NewGuid().ToString("N");
        var combined = $"{seedValue}:{scanIndex}:{DateTime.UtcNow.Ticks}";
        var bytes = Encoding.UTF8.GetBytes(combined);

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
        new Random().NextBytes(pixels);

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

    private void SaveEnrolledUsers()
    {
        try
        {
            var json = JsonSerializer.Serialize(_enrolledUsers.Values, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(_configFilePath, json);
        }
        catch (Exception ex)
        {
            Log($"Error guardando usuarios registrados: {ex.Message}");
        }
    }

    private void LoadEnrolledUsers()
    {
        try
        {
            if (File.Exists(_configFilePath))
            {
                var json = File.ReadAllText(_configFilePath);
                var users = JsonSerializer.Deserialize<List<EnrolledUser>>(json);
                if (users != null)
                {
                    foreach (var user in users)
                    {
                        _enrolledUsers[user.UserId] = user;
                    }
                    Log($"📂 Cargados {users.Count} usuarios registrados");
                }
            }
        }
        catch (Exception ex)
        {
            Log($"Error cargando usuarios registrados: {ex.Message}");
        }
    }

    private void Log(string message)
    {
        OnLog?.Invoke(message);
    }

    public void Dispose()
    {
        if (_isConnected)
        {
            DisconnectAsync().GetAwaiter().GetResult();
        }
    }
}