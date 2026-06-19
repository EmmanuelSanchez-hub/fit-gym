using System.Net;
using System.Text;

namespace FitGymFingerprint.Services;

public class HttpListenerService
{
    private HttpListener _listener;
    private readonly int _port;
    private bool _isRunning;

    public delegate Task<string> RequestHandler(string method, string path, string? body);
    public event RequestHandler? OnRequest;

    public HttpListenerService(int port)
    {
        _port = port;
        _listener = new HttpListener();
        _listener.Prefixes.Add($"http://localhost:{_port}/");
        _listener.Prefixes.Add($"http://127.0.0.1:{_port}/");
        _listener.Prefixes.Add($"http://+:{_port}/");
    }

    public void Start()
    {
        try
        {
            _listener.Start();
            _isRunning = true;
            _ = ListenAsync();
            Console.WriteLine($"[HTTP] Servidor iniciado en http://localhost:{_port}");
        }
        catch (HttpListenerException ex) when (ex.ErrorCode == 5)
        {
            _listener = new HttpListener();
            _listener.Prefixes.Add($"http://localhost:{_port}/");
            _listener.Prefixes.Add($"http://127.0.0.1:{_port}/");
            _listener.Start();
            _isRunning = true;
            _ = ListenAsync();
            Console.WriteLine($"[HTTP] Servidor iniciado en http://localhost:{_port} (solo localhost)");
        }
    }

    public void Stop()
    {
        _isRunning = false;
        try
        {
            _listener?.Stop();
        }
        catch { }
    }

    private async Task ListenAsync()
    {
        while (_isRunning)
        {
            try
            {
                var context = await _listener.GetContextAsync();
                _ = HandleRequestAsync(context);
            }
            catch (ObjectDisposedException) { break; }
            catch (HttpListenerException) { break; }
            catch (Exception ex)
            {
                Console.WriteLine($"[HTTP Error] {ex.Message}");
            }
        }
    }

    private async Task HandleRequestAsync(HttpListenerContext context)
    {
        try
        {
            var request = context.Request;
            var response = context.Response;

            string? body = null;
            if (request.HasEntityBody)
            {
                using var reader = new StreamReader(request.InputStream, request.ContentEncoding);
                body = await reader.ReadToEndAsync();
            }

            var method = request.HttpMethod;
            var path = request.Url?.AbsolutePath?.ToLower() ?? "/";

            Console.WriteLine($"[HTTP] {method} {path}");

            context.Response.AppendHeader("Access-Control-Allow-Origin", "*");
            context.Response.AppendHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            context.Response.AppendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

            if (method == "OPTIONS")
            {
                response.StatusCode = 204;
                response.Close();
                return;
            }

            string result;
            if (OnRequest != null)
            {
                result = await OnRequest(method, path, body);
            }
            else
            {
                result = "{\"error\":\"Servicio no disponible\"}";
            }

            var buffer = Encoding.UTF8.GetBytes(result);
            response.ContentType = "application/json; charset=utf-8";
            response.ContentLength64 = buffer.Length;
            response.StatusCode = 200;
            await response.OutputStream.WriteAsync(buffer, 0, buffer.Length);
            response.Close();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[HTTP Error handling] {ex.Message}");
        }
    }
}