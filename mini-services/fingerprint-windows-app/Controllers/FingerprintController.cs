using System.Text.Json;
using FitGymFingerprint.Models;
using FitGymFingerprint.Services;

namespace FitGymFingerprint.Controllers;

public class FingerprintController
{
    private readonly FingerprintService _fingerprintService;

    public FingerprintController(FingerprintService fingerprintService)
    {
        _fingerprintService = fingerprintService;
    }

    public async Task<string> HandleRequest(string method, string path, string? body)
    {
        try
        {
            switch (path)
            {
                case "/api/fingerprint/status":
                    var status = _fingerprintService.GetStatus();
                    return JsonSerializer.Serialize(DeviceStatusDto.From(status));

                case "/api/fingerprint/connect" when method == "POST":
                    var connected = await _fingerprintService.ConnectAsync();
                    return JsonSerializer.Serialize(new { success = connected, message = connected ? "Conectado" : "Error al conectar" });

                case "/api/fingerprint/disconnect" when method == "POST":
                    var disconnected = await _fingerprintService.DisconnectAsync();
                    return JsonSerializer.Serialize(new { success = disconnected, message = disconnected ? "Desconectado" : "Error al desconectar" });

                case "/api/fingerprint/capture" when method == "POST":
                    var capture = await _fingerprintService.CaptureFingerprintAsync();
                    return JsonSerializer.Serialize(capture);

                case "/api/fingerprint/users":
                    var users = _fingerprintService.GetAllEnrolledUsers();
                    return JsonSerializer.Serialize(users);

                default:
                    return JsonSerializer.Serialize(new { error = "Ruta no encontrada", path, method });
            }
        }
        catch (Exception ex)
        {
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }
}