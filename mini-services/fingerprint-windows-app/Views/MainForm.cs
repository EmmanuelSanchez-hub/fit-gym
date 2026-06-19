#nullable disable

using System.Drawing;
using System.Windows.Forms;
using FitGymFingerprint.Services;

namespace FitGymFingerprint.Views;

public class MainForm : Form
{
    private NotifyIcon _trayIcon;
    private ContextMenuStrip _trayMenu;
    private Button _btnStartService;
    private Button _btnStopService;
    private Button _btnOpenWeb;
    private Button _btnTestCapture;
    private Button _btnExit;
    private Label _lblStatus;
    private Label _lblStatusValue;
    private Label _lblDevice;
    private Label _lblDeviceValue;
    private Label _lblPort;
    private Label _lblPortValue;
    private TextBox _txtLog;
    private TextBox _txtPort;
    private TextBox _txtWebUrl;
    private Label _lblLog;
    private GroupBox _gbConfig;
    private GroupBox _gbStatus;
    private GroupBox _gbActions;
    private CheckBox _chkAutorun;
    private CheckBox _chkMinimizeToTray;
    private Panel _headerPanel;
    private Label _lblTitle;
    private Label _lblSubtitle;

    private HttpListenerService _httpService;
    private FingerprintService _fingerprintService;
    private bool _isRunning = false;

    private const string CONFIG_FILE = "FitGymFingerprint.json";
    private int _servicePort = 3005;
    private string _webAppUrl = "https://tugimnasio.com";

    public MainForm()
    {
        InitializeComponent();
        LoadConfig();
        SetupTrayIcon();
        CheckAutorun();
    }

    private void InitializeComponent()
    {
        this.Text = "FitGym Pro - Lector de Huellas";
        this.Size = new Size(580, 680);
        this.MinimumSize = new Size(480, 500);
        this.StartPosition = FormStartPosition.CenterScreen;
        this.FormBorderStyle = FormBorderStyle.FixedSingle;
        this.MaximizeBox = false;
        this.BackColor = Color.FromArgb(245, 245, 250);
        this.Icon = SystemIcons.Shield;

        _headerPanel = new Panel
        {
            BackColor = Color.FromArgb(30, 30, 45),
            Dock = DockStyle.Top,
            Height = 80
        };

        _lblTitle = new Label
        {
            Text = "🖐️ FitGym Pro - Lector de Huellas",
            ForeColor = Color.White,
            Font = new Font("Segoe UI", 14, FontStyle.Bold),
            Location = new Point(20, 15),
            AutoSize = true
        };

        _lblSubtitle = new Label
        {
            Text = "DigitalPersona 4500 - Servicio independiente",
            ForeColor = Color.FromArgb(180, 180, 200),
            Font = new Font("Segoe UI", 10),
            Location = new Point(20, 45),
            AutoSize = true
        };

        _headerPanel.Controls.Add(_lblTitle);
        _headerPanel.Controls.Add(_lblSubtitle);

        _gbConfig = new GroupBox
        {
            Text = "⚙️ Configuración",
            Location = new Point(15, 95),
            Size = new Size(540, 120),
            Font = new Font("Segoe UI", 10, FontStyle.Bold),
            BackColor = Color.White
        };

        var lblPort = new Label
        {
            Text = "Puerto:",
            Location = new Point(15, 28),
            Size = new Size(60, 25),
            Font = new Font("Segoe UI", 9, FontStyle.Regular)
        };

        _txtPort = new TextBox
        {
            Text = _servicePort.ToString(),
            Location = new Point(80, 25),
            Size = new Size(80, 25),
            Font = new Font("Segoe UI", 9)
        };

        var lblWebUrl = new Label
        {
            Text = "URL de tu App:",
            Location = new Point(170, 28),
            Size = new Size(100, 25),
            Font = new Font("Segoe UI", 9, FontStyle.Regular)
        };

        _txtWebUrl = new TextBox
        {
            Text = _webAppUrl,
            Location = new Point(275, 25),
            Size = new Size(250, 25),
            Font = new Font("Segoe UI", 9)
        };

        _chkAutorun = new CheckBox
        {
            Text = "Iniciar automáticamente con Windows",
            Location = new Point(15, 60),
            Size = new Size(250, 25),
            Font = new Font("Segoe UI", 9, FontStyle.Regular),
            Checked = false
        };

        _chkMinimizeToTray = new CheckBox
        {
            Text = "Minimizar a la bandeja al cerrar",
            Location = new Point(15, 85),
            Size = new Size(250, 25),
            Font = new Font("Segoe UI", 9, FontStyle.Regular),
            Checked = true
        };

        _gbConfig.Controls.Add(lblPort);
        _gbConfig.Controls.Add(_txtPort);
        _gbConfig.Controls.Add(lblWebUrl);
        _gbConfig.Controls.Add(_txtWebUrl);
        _gbConfig.Controls.Add(_chkAutorun);
        _gbConfig.Controls.Add(_chkMinimizeToTray);

        _gbStatus = new GroupBox
        {
            Text = "🔌 Estado del Servicio",
            Location = new Point(15, 225),
            Size = new Size(540, 110),
            Font = new Font("Segoe UI", 10, FontStyle.Bold),
            BackColor = Color.White
        };

        _lblStatus = new Label
        {
            Text = "Estado:",
            Location = new Point(15, 25),
            Size = new Size(60, 25),
            Font = new Font("Segoe UI", 9, FontStyle.Regular)
        };

        _lblStatusValue = new Label
        {
            Text = "❌ DETENIDO",
            Location = new Point(80, 25),
            Size = new Size(150, 25),
            Font = new Font("Segoe UI", 9, FontStyle.Bold),
            ForeColor = Color.Red
        };

        _lblDevice = new Label
        {
            Text = "Dispositivo:",
            Location = new Point(15, 50),
            Size = new Size(80, 25),
            Font = new Font("Segoe UI", 9, FontStyle.Regular)
        };

        _lblDeviceValue = new Label
        {
            Text = "No conectado",
            Location = new Point(100, 50),
            Size = new Size(200, 25),
            Font = new Font("Segoe UI", 9, FontStyle.Regular),
            ForeColor = Color.Gray
        };

        _lblPort = new Label
        {
            Text = "API Activa:",
            Location = new Point(15, 75),
            Size = new Size(80, 25),
            Font = new Font("Segoe UI", 9, FontStyle.Regular)
        };

        _lblPortValue = new Label
        {
            Text = "http://localhost:3005",
            Location = new Point(100, 75),
            Size = new Size(200, 25),
            Font = new Font("Segoe UI", 9, FontStyle.Regular),
            ForeColor = Color.Gray
        };

        _gbStatus.Controls.Add(_lblStatus);
        _gbStatus.Controls.Add(_lblStatusValue);
        _gbStatus.Controls.Add(_lblDevice);
        _gbStatus.Controls.Add(_lblDeviceValue);
        _gbStatus.Controls.Add(_lblPort);
        _gbStatus.Controls.Add(_lblPortValue);

        _gbActions = new GroupBox
        {
            Text = "🎮 Acciones",
            Location = new Point(15, 345),
            Size = new Size(540, 60),
            Font = new Font("Segoe UI", 10, FontStyle.Bold),
            BackColor = Color.White
        };

        _btnStartService = new Button
        {
            Text = "▶ INICIAR SERVICIO",
            Location = new Point(15, 20),
            Size = new Size(150, 30),
            Font = new Font("Segoe UI", 9, FontStyle.Bold),
            BackColor = Color.FromArgb(40, 167, 69),
            ForeColor = Color.White,
            FlatStyle = FlatStyle.Flat,
            Cursor = Cursors.Hand
        };
        _btnStartService.FlatAppearance.BorderSize = 0;
        _btnStartService.Click += BtnStartService_Click;

        _btnStopService = new Button
        {
            Text = "⏹ DETENER",
            Location = new Point(175, 20),
            Size = new Size(100, 30),
            Font = new Font("Segoe UI", 9, FontStyle.Bold),
            BackColor = Color.FromArgb(220, 53, 69),
            ForeColor = Color.White,
            FlatStyle = FlatStyle.Flat,
            Enabled = false,
            Cursor = Cursors.Hand
        };
        _btnStopService.FlatAppearance.BorderSize = 0;
        _btnStopService.Click += BtnStopService_Click;

        _btnOpenWeb = new Button
        {
            Text = "🌐 Abrir Web",
            Location = new Point(285, 20),
            Size = new Size(100, 30),
            Font = new Font("Segoe UI", 9, FontStyle.Bold),
            BackColor = Color.FromArgb(0, 123, 255),
            ForeColor = Color.White,
            FlatStyle = FlatStyle.Flat,
            Cursor = Cursors.Hand
        };
        _btnOpenWeb.FlatAppearance.BorderSize = 0;
        _btnOpenWeb.Click += BtnOpenWeb_Click;

        _btnTestCapture = new Button
        {
            Text = "🔬 Probar Huella",
            Location = new Point(395, 20),
            Size = new Size(130, 30),
            Font = new Font("Segoe UI", 9, FontStyle.Bold),
            BackColor = Color.FromArgb(108, 117, 125),
            ForeColor = Color.White,
            FlatStyle = FlatStyle.Flat,
            Enabled = false,
            Cursor = Cursors.Hand
        };
        _btnTestCapture.FlatAppearance.BorderSize = 0;
        _btnTestCapture.Click += BtnTestCapture_Click;

        _gbActions.Controls.Add(_btnStartService);
        _gbActions.Controls.Add(_btnStopService);
        _gbActions.Controls.Add(_btnOpenWeb);
        _gbActions.Controls.Add(_btnTestCapture);

        _lblLog = new Label
        {
            Text = "📋 Registro de eventos:",
            Location = new Point(15, 420),
            AutoSize = true,
            Font = new Font("Segoe UI", 10, FontStyle.Bold)
        };

        _txtLog = new TextBox
        {
            Location = new Point(15, 445),
            Size = new Size(540, 150),
            Font = new Font("Consolas", 9),
            BackColor = Color.FromArgb(30, 30, 45),
            ForeColor = Color.FromArgb(0, 255, 100),
            ReadOnly = true,
            Multiline = true,
            ScrollBars = ScrollBars.Vertical,
            BorderStyle = BorderStyle.FixedSingle
        };

        _btnExit = new Button
        {
            Text = "❌ Salir",
            Location = new Point(465, 605),
            Size = new Size(90, 30),
            Font = new Font("Segoe UI", 9, FontStyle.Regular),
            Cursor = Cursors.Hand
        };
        _btnExit.Click += BtnExit_Click;

        this.Controls.Add(_headerPanel);
        this.Controls.Add(_gbConfig);
        this.Controls.Add(_gbStatus);
        this.Controls.Add(_gbActions);
        this.Controls.Add(_lblLog);
        this.Controls.Add(_txtLog);
        this.Controls.Add(_btnExit);

        this.FormClosing += MainForm_FormClosing;
        this.Resize += MainForm_Resize;

        AppendLog("🔧 Aplicación iniciada");
        AppendLog($"📌 Configuración: Puerto {_servicePort}, URL: {_webAppUrl}");
        AppendLog("💡 Presiona 'INICIAR SERVICIO' para empezar");
    }

    private void SetupTrayIcon()
    {
        _trayMenu = new ContextMenuStrip();
        _trayMenu.Items.Add("🖐️ Mostrar FitGym Fingerprint", null, (s, e) => { this.Show(); this.WindowState = FormWindowState.Normal; });
        _trayMenu.Items.Add("🌐 Abrir Web", null, (s, e) => OpenWebApp());
        _trayMenu.Items.Add("▶ Iniciar Servicio", null, async (s, e) => await StartService());
        _trayMenu.Items.Add("⏹ Detener Servicio", null, async (s, e) => await StopService());
        _trayMenu.Items.Add(new ToolStripSeparator());
        _trayMenu.Items.Add("❌ Salir", null, (s, e) => { _trayIcon.Visible = false; Application.Exit(); });

        _trayIcon = new NotifyIcon
        {
            Text = "FitGym Pro - Lector de Huellas",
            Icon = SystemIcons.Shield,
            ContextMenuStrip = _trayMenu,
            Visible = true
        };
        _trayIcon.DoubleClick += (s, e) => { this.Show(); this.WindowState = FormWindowState.Normal; };
    }

    private async void MainForm_FormClosing(object sender, FormClosingEventArgs e)
    {
        if (_chkMinimizeToTray.Checked && e.CloseReason == CloseReason.UserClosing)
        {
            e.Cancel = true;
            this.Hide();
            _trayIcon.ShowBalloonTip(1000, "FitGym Fingerprint", "La aplicación sigue corriendo en la bandeja del sistema", ToolTipIcon.Info);
            return;
        }

        await StopService();
        SaveConfig();
        _trayIcon.Visible = false;
    }

    private void MainForm_Resize(object sender, EventArgs e)
    {
        if (this.WindowState == FormWindowState.Minimized && _chkMinimizeToTray.Checked)
        {
            this.Hide();
            _trayIcon.ShowBalloonTip(1000, "FitGym Fingerprint", "Minimizado a la bandeja del sistema", ToolTipIcon.Info);
        }
    }

    private async void BtnStartService_Click(object sender, EventArgs e)
    {
        await StartService();
    }

    public async Task StartService()
    {
        if (_isRunning) return;

        if (!int.TryParse(_txtPort.Text, out _servicePort) || _servicePort < 1 || _servicePort > 65535)
        {
            AppendLog("❌ Puerto inválido. Usa un número entre 1 y 65535");
            return;
        }
        _webAppUrl = _txtWebUrl.Text.Trim();
        if (string.IsNullOrEmpty(_webAppUrl))
        {
            _webAppUrl = "https://tugimnasio.com";
        }

        try
        {
            AppendLog("🔄 Iniciando servicio...");

            _httpService = new HttpListenerService(_servicePort);
            _httpService.OnRequest += HandleHttpRequest;
            _httpService.Start();

            _fingerprintService = new FingerprintService();
            _fingerprintService.OnLog += AppendLog;
            await _fingerprintService.ConnectAsync();

            _isRunning = true;
            UpdateUI(true);

            AppendLog($"✅ Servicio iniciado en http://localhost:{_servicePort}");
            AppendLog($"🌐 Conectado a: {_webAppUrl}");

            _trayIcon.ShowBalloonTip(2000, "FitGym Fingerprint", "✅ Servicio iniciado correctamente", ToolTipIcon.Info);
        }
        catch (Exception ex)
        {
            AppendLog($"❌ Error al iniciar: {ex.Message}");
        }
    }

    private async void BtnStopService_Click(object sender, EventArgs e)
    {
        await StopService();
    }

    public async Task StopService()
    {
        if (!_isRunning) return;

        try
        {
            AppendLog("🔄 Deteniendo servicio...");

            _httpService?.Stop();
            if (_fingerprintService != null)
            {
                await _fingerprintService.DisconnectAsync();
            }

            _isRunning = false;
            UpdateUI(false);

            AppendLog("✅ Servicio detenido");
        }
        catch (Exception ex)
        {
            AppendLog($"❌ Error al detener: {ex.Message}");
        }
    }

    private async void BtnTestCapture_Click(object sender, EventArgs e)
    {
        if (!_isRunning || _fingerprintService == null)
        {
            AppendLog("❌ El servicio no está iniciado");
            return;
        }

        try
        {
            AppendLog("🔬 Probando captura de huella...");
            _btnTestCapture.Enabled = false;

            var result = await _fingerprintService.CaptureFingerprintAsync();

            if (result.Success)
            {
                AppendLog($"✅ Huella capturada! Calidad: {result.Quality}%");
            }
            else
            {
                AppendLog($"❌ Error en captura: {result.Error}");
            }
        }
        catch (Exception ex)
        {
            AppendLog($"❌ Error: {ex.Message}");
        }
        finally
        {
            _btnTestCapture.Enabled = _isRunning;
        }
    }

    private void BtnOpenWeb_Click(object sender, EventArgs e)
    {
        OpenWebApp();
    }

    private void OpenWebApp()
    {
        try
        {
            var url = _txtWebUrl.Text.Trim();
            if (string.IsNullOrEmpty(url)) url = "https://tugimnasio.com";
            System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
            {
                FileName = url,
                UseShellExecute = true
            });
            AppendLog($"🌐 Abriendo: {url}");
        }
        catch (Exception ex)
        {
            AppendLog($"❌ Error al abrir navegador: {ex.Message}");
        }
    }

    private async void BtnExit_Click(object sender, EventArgs e)
    {
        if (_isRunning)
        {
            var result = MessageBox.Show(
                "El servicio está corriendo. ¿Estás seguro de salir?",
                "Confirmar salida",
                MessageBoxButtons.YesNo,
                MessageBoxIcon.Question);

            if (result == DialogResult.No) return;
        }

        _trayIcon.Visible = false;
        await StopService();
        SaveConfig();
        Application.Exit();
    }

    private async Task<string> HandleHttpRequest(string method, string path, string body)
    {
        try
        {
            AppendLog($"📥 {method} {path}");

            if (_fingerprintService == null)
            {
                return System.Text.Json.JsonSerializer.Serialize(new { error = "Servicio no iniciado" });
            }

            switch (path)
            {
                case "/api/fingerprint/status":
                    var status = _fingerprintService.GetStatus();
                    return System.Text.Json.JsonSerializer.Serialize(FitGymFingerprint.Models.DeviceStatusDto.From(status));

                case "/api/fingerprint/connect" when method == "POST":
                    var connected = await _fingerprintService.ConnectAsync();
                    return System.Text.Json.JsonSerializer.Serialize(new { success = connected, message = connected ? "Conectado" : "Error al conectar" });

                case "/api/fingerprint/disconnect" when method == "POST":
                    var disconnected = await _fingerprintService.DisconnectAsync();
                    return System.Text.Json.JsonSerializer.Serialize(new { success = disconnected, message = disconnected ? "Desconectado" : "Error al desconectar" });

                case "/api/fingerprint/capture" when method == "POST":
                    var capture = await _fingerprintService.CaptureFingerprintAsync();
                    return System.Text.Json.JsonSerializer.Serialize(capture);

                case "/api/fingerprint/users":
                    var users = _fingerprintService.GetAllEnrolledUsers();
                    return System.Text.Json.JsonSerializer.Serialize(users);

                default:
                    return System.Text.Json.JsonSerializer.Serialize(new { error = "Ruta no encontrada", path, method });
            }
        }
        catch (Exception ex)
        {
            AppendLog($"❌ Error en HTTP: {ex.Message}");
            return System.Text.Json.JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    private void UpdateUI(bool running)
    {
        _btnStartService.Enabled = !running;
        _btnStopService.Enabled = running;
        _btnTestCapture.Enabled = running;
        _txtPort.Enabled = !running;
        _txtWebUrl.Enabled = !running;
        _chkAutorun.Enabled = !running;

        if (running)
        {
            _lblStatusValue.Text = "✅ ACTIVO";
            _lblStatusValue.ForeColor = Color.Green;
            _lblPortValue.Text = $"http://localhost:{_servicePort}";
            _lblPortValue.ForeColor = Color.Green;
            _lblDeviceValue.Text = _fingerprintService?.GetStatus()?.Connected == true ? "✅ Conectado" : "⚠️ No conectado";
            _lblDeviceValue.ForeColor = _fingerprintService?.GetStatus()?.Connected == true ? Color.Green : Color.Orange;
        }
        else
        {
            _lblStatusValue.Text = "❌ DETENIDO";
            _lblStatusValue.ForeColor = Color.Red;
            _lblPortValue.Text = "http://localhost:3005";
            _lblPortValue.ForeColor = Color.Gray;
            _lblDeviceValue.Text = "No conectado";
            _lblDeviceValue.ForeColor = Color.Gray;
        }
    }

    private void AppendLog(string message)
    {
        if (_txtLog.InvokeRequired)
        {
            _txtLog.Invoke(new Action(() => AppendLog(message)));
            return;
        }

        var timestamp = DateTime.Now.ToString("HH:mm:ss");
        _txtLog.AppendText($"[{timestamp}] {message}{Environment.NewLine}");
        _txtLog.SelectionStart = _txtLog.Text.Length;
        _txtLog.ScrollToCaret();
    }

    private void SaveConfig()
    {
        try
        {
            var config = new
            {
                port = _servicePort,
                webUrl = _webAppUrl,
                autorun = _chkAutorun.Checked,
                minimizeToTray = _chkMinimizeToTray.Checked
            };
            var json = System.Text.Json.JsonSerializer.Serialize(config, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(CONFIG_FILE, json);
        }
        catch { }
    }

    private void LoadConfig()
    {
        try
        {
            if (File.Exists(CONFIG_FILE))
            {
                var json = File.ReadAllText(CONFIG_FILE);
                var config = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(json);
                if (config.TryGetProperty("port", out var port)) _servicePort = port.GetInt32();
                if (config.TryGetProperty("webUrl", out var webUrl)) _webAppUrl = webUrl.GetString() ?? _webAppUrl;
                if (config.TryGetProperty("autorun", out var autorun)) _chkAutorun.Checked = autorun.GetBoolean();
                if (config.TryGetProperty("minimizeToTray", out var minimize)) _chkMinimizeToTray.Checked = minimize.GetBoolean();
            }
        }
        catch { }
    }

    private void CheckAutorun()
    {
        try
        {
            using (var key = Microsoft.Win32.Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run", true))
            {
                var currentValue = key?.GetValue("FitGymFingerprint") as string;
                _chkAutorun.Checked = !string.IsNullOrEmpty(currentValue);
            }
        }
        catch { }
    }

    private void SetAutorun(bool enable)
    {
        try
        {
            using (var key = Microsoft.Win32.Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run", true))
            {
                if (enable)
                {
                    var exePath = Application.ExecutablePath;
                    key?.SetValue("FitGymFingerprint", $"\"{exePath}\"");
                    AppendLog("✅ Auto-inicio configurado");
                }
                else
                {
                    key?.DeleteValue("FitGymFingerprint", false);
                    AppendLog("ℹ️ Auto-inicio desactivado");
                }
            }
        }
        catch (Exception ex)
        {
            AppendLog($"❌ Error al configurar auto-inicio: {ex.Message}");
        }
    }

    private void SaveAutorunSetting()
    {
        SetAutorun(_chkAutorun.Checked);
        SaveConfig();
    }

    protected override void OnFormClosed(FormClosedEventArgs e)
    {
        base.OnFormClosed(e);
        _trayIcon?.Dispose();
    }
}