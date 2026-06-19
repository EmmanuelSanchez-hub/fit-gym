using Microsoft.AspNetCore.Mvc;
using FingerprintService.Models;
using FingerprintService.Services;

namespace FingerprintService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FingerprintController : ControllerBase
{
    private readonly FingerprintDeviceService _fingerprintService;
    private readonly ILogger<FingerprintController> _logger;

    public FingerprintController(FingerprintDeviceService fingerprintService, ILogger<FingerprintController> logger)
    {
        _fingerprintService = fingerprintService;
        _logger = logger;
    }

    /// <summary>
    /// GET /api/fingerprint/status
    /// Returns the current device connection status
    /// </summary>
    [HttpGet("status")]
    public ActionResult<DeviceStatus> GetStatus()
    {
        return Ok(_fingerprintService.GetStatus());
    }

    /// <summary>
    /// POST /api/fingerprint/connect
    /// Connect to the DigitalPersona 4500 fingerprint reader
    /// </summary>
    [HttpPost("connect")]
    public async Task<ActionResult> Connect()
    {
        var success = await _fingerprintService.ConnectAsync();
        if (success)
            return Ok(new { message = "Conectado al lector de huellas DigitalPersona 4500" });
        
        return StatusCode(500, new { error = "No se pudo conectar al lector de huellas" });
    }

    /// <summary>
    /// POST /api/fingerprint/disconnect
    /// Disconnect from the fingerprint reader
    /// </summary>
    [HttpPost("disconnect")]
    public async Task<ActionResult> Disconnect()
    {
        var success = await _fingerprintService.DisconnectAsync();
        if (success)
            return Ok(new { message = "Lector de huellas desconectado" });
        
        return StatusCode(500, new { error = "Error al desconectar el lector" });
    }

    /// <summary>
    /// POST /api/fingerprint/capture
    /// Capture a single fingerprint and return its template
    /// </summary>
    [HttpPost("capture")]
    public async Task<ActionResult<FingerprintCaptureResponse>> Capture()
    {
        var result = await _fingerprintService.CaptureFingerprintAsync();
        
        if (!result.Success)
            return StatusCode(500, result);
        
        return Ok(result);
    }

    /// <summary>
    /// POST /api/fingerprint/verify
    /// Verify a fingerprint against a stored template
    /// </summary>
    [HttpPost("verify")]
    public async Task<ActionResult<FingerprintVerifyResponse>> Verify([FromBody] FingerprintVerifyRequest request)
    {
        if (string.IsNullOrEmpty(request.Template))
            return BadRequest(new { error = "Se requiere el template de huella almacenado" });

        var result = await _fingerprintService.VerifyFingerprintAsync(request.Template);
        
        if (!result.Success)
            return StatusCode(500, result);
        
        return Ok(result);
    }

    /// <summary>
    /// POST /api/fingerprint/enroll
    /// Enroll a new user with multiple fingerprint scans
    /// </summary>
    [HttpPost("enroll")]
    public async Task<ActionResult<FingerprintEnrollResponse>> Enroll([FromBody] FingerprintEnrollRequest request)
    {
        if (string.IsNullOrEmpty(request.UserId) || string.IsNullOrEmpty(request.UserName))
            return BadRequest(new { error = "Se requieren UserId y UserName" });

        var result = await _fingerprintService.EnrollFingerprintAsync(
            request.UserId, 
            request.UserName, 
            request.RequiredScans
        );
        
        if (!result.Success)
            return StatusCode(500, result);
        
        return Ok(result);
    }

    /// <summary>
    /// GET /api/fingerprint/users
    /// List all enrolled users
    /// </summary>
    [HttpGet("users")]
    public ActionResult<IEnumerable<EnrolledUser>> GetUsers()
    {
        return Ok(_fingerprintService.GetAllEnrolledUsers());
    }

    /// <summary>
    /// GET /api/fingerprint/users/{userId}
    /// Get an enrolled user by ID
    /// </summary>
    [HttpGet("users/{userId}")]
    public ActionResult<EnrolledUser> GetUser(string userId)
    {
        var user = _fingerprintService.GetEnrolledUser(userId);
        if (user == null)
            return NotFound(new { error = "Usuario no encontrado" });
        
        return Ok(user);
    }

    /// <summary>
    /// DELETE /api/fingerprint/users/{userId}
    /// Remove an enrolled user's fingerprint
    /// </summary>
    [HttpDelete("users/{userId}")]
    public ActionResult DeleteUser(string userId)
    {
        var removed = _fingerprintService.RemoveEnrolledUser(userId);
        if (!removed)
            return NotFound(new { error = "Usuario no encontrado" });
        
        return Ok(new { message = $"Huella del usuario {userId} eliminada" });
    }
}