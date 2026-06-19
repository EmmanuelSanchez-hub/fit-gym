using FingerprintService.Services;

var builder = WebApplication.CreateBuilder(args);

// Configure CORS for Next.js frontend
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Register services
builder.Services.AddSingleton<FingerprintDeviceService>();
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

// Configure Swagger for API documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() 
    { 
        Title = "HuellApp - Fingerprint Service API", 
        Version = "v1",
        Description = "Microservicio para el lector biométrico DigitalPersona 4500"
    });
});

// Configure Kestrel to listen on port 3005
builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenAnyIP(3005);
});

var app = builder.Build();

// Configure pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.MapControllers();

// Auto-connect to device on startup
var fingerprintService = app.Services.GetRequiredService<FingerprintDeviceService>();
await fingerprintService.ConnectAsync();

Console.WriteLine(@"
╔═══════════════════════════════════════════════════════╗
║         HuellApp - Fingerprint Service                ║
║         DigitalPersona 4500 Integration               ║
║                                                       ║
║  API: http://localhost:3005/api/fingerprint           ║
║  Swagger: http://localhost:3005/swagger               ║
║  Status: http://localhost:3005/api/fingerprint/status ║
╚═══════════════════════════════════════════════════════╝
");

app.Run();