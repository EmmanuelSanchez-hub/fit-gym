"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  BarChart3,
  Users,
  CreditCard,
  DoorOpen,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader2,
  Settings,
  Database,
  FileDown,
  FileUp,
  X,
  Fingerprint,
  RefreshCw,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ConfiguracionSectionProps {
  userRol: string;
  onRefresh?: () => void;
}

interface ImportResult {
  type: string;
  total: number;
  exitosos: number;
  errores: string[];
  creados: unknown[];
}

interface ReporteGerencial {
  titulo: string;
  fechaGeneracion: string;
  periodo: { inicio: string; fin: string };
  metricasGenerales: {
    totalClientes: number;
    clientesNuevosPeriodo: number;
    crecimientoClientes: string;
    membresiasActivas: number;
    membresiasPorVencer: number;
    membresiasExpiradas: number;
    tasaRenovacion: string;
  };
  ingresos: {
    totalPeriodo: number;
    porPlan: Array<{ plan: string; cantidad: number; total: number }>;
    porMetodoPago: Array<{ metodo: string; cantidad: number; total: number }>;
  };
  actividad: {
    accesosPeriodo: number;
    reservasPeriodo: number;
    promedioAccesosDiario: string;
    tendenciaAccesos: Array<{ fecha: string; total: number }>;
  };
  recomendaciones: Array<{
    tipo: string;
    titulo: string;
    descripcion: string;
    accion: string;
  }>;
}

interface DeviceStatus {
  connected: boolean;
  deviceName: string;
  port: string | null;
  firmwareVersion: string | null;
  sensorReady: boolean;
  lastError: string | null;
  mode: string;
}

export function ConfiguracionSection({ userRol, onRefresh }: ConfiguracionSectionProps) {
  const [exportType, setExportType] = useState("clientes");
  const [exportFormat, setExportFormat] = useState("json");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importType, setImportType] = useState("clientes");
  const [importFormat, setImportFormat] = useState("json");
  const [importData, setImportData] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showImportResult, setShowImportResult] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [reporte, setReporte] = useState<ReporteGerencial | null>(null);
  const [isLoadingReporte, setIsLoadingReporte] = useState(false);
  const [showReporte, setShowReporte] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | null>(null);
  const [isDeviceLoading, setIsDeviceLoading] = useState(false);
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("exportar");

  const canExport = userRol === "SUPER_USUARIO" || userRol === "ADMINISTRADOR";
  const canImport = userRol === "SUPER_USUARIO" || userRol === "ADMINISTRADOR";

  const fetchDeviceStatus = async (silent = false) => {
    if (!silent) setIsDeviceLoading(true);
    try {
      const res = await fetch('/api/fingerprint/status');
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Servicio no disponible');
      }
      const data = await res.json();
      setDeviceStatus(data);
      setDeviceError(null);
    } catch (error: any) {
      if (!silent) {
        setDeviceError(error.message || "No se pudo conectar al servicio de huellas. Verifica que esté ejecutándose.");
      }
      setDeviceStatus(null);
    } finally {
      if (!silent) setIsDeviceLoading(false);
    }
  };

  // Polling automático mientras la pestaña dispositivos esté activa
  useEffect(() => {
    if (activeTab !== "dispositivos") return;
    
    let cancelled = false;
    
    const poll = async () => {
      try {
        const res = await fetch('/api/fingerprint/status');
        
        if (!cancelled) {
          if (res.ok) {
            const data = await res.json();
            setDeviceStatus(data);
            setDeviceError(null);
          } else {
            const error = await res.json();
            setDeviceError(error.error || 'Servicio no disponible');
            setDeviceStatus(null);
          }
        }
      } catch (error: any) {
        if (!cancelled) {
          setDeviceError(error.message || 'Error de conexión con el servicio de huellas');
          setDeviceStatus(null);
        }
      }
    };
    
    poll();
    const interval = setInterval(poll, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeTab]);

  // Manejar selección de archivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verificar extensión del archivo
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'json' && extension !== 'csv') {
      toast({ 
        title: "Error", 
        description: "Solo se permiten archivos .json o .csv", 
        variant: "destructive" 
      });
      return;
    }

    // Auto-detectar formato basado en la extensión
    setImportFormat(extension === 'csv' ? 'csv' : 'json');
    setSelectedFile(file);

    // Leer contenido del archivo
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportData(content);
    };
    reader.onerror = () => {
      toast({ 
        title: "Error", 
        description: "No se pudo leer el archivo", 
        variant: "destructive" 
      });
    };
    reader.readAsText(file);
  };

  // Limpiar archivo seleccionado
  const handleClearFile = () => {
    setSelectedFile(null);
    setImportData("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleExport = async () => {
    if (!canExport) {
      toast({ title: "Error", description: "No tienes permisos para exportar", variant: "destructive" });
      return;
    }

    setIsExporting(true);
    try {
      const params = new URLSearchParams({
        type: exportType,
        format: exportFormat,
      });
      
      if (fechaInicio) params.append('fechaInicio', fechaInicio);
      if (fechaFin) params.append('fechaFin', fechaFin);

      const response = await fetch(`/api/export?${params}`);
      
      if (!response.ok) throw new Error('Error al exportar');

      if (exportFormat === 'csv') {
        // Descargar archivo CSV
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${exportType}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      } else {
        // Descargar archivo JSON
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${exportType}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }

      toast({ title: "Éxito", description: "Archivo exportado correctamente" });
    } catch {
      toast({ title: "Error", description: "Error al exportar datos", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    if (!canImport) {
      toast({ title: "Error", description: "No tienes permisos para importar", variant: "destructive" });
      return;
    }

    if (!importData.trim()) {
      toast({ title: "Error", description: "Selecciona un archivo para importar", variant: "destructive" });
      return;
    }

    setIsImporting(true);
    try {
      let dataToSend: string | unknown[];
      
      if (importFormat === 'json') {
        dataToSend = JSON.parse(importData);
      } else {
        // CSV - send as string
        dataToSend = importData;
      }
      
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: importType,
          data: dataToSend,
          format: importFormat,
          options: { ignorarDuplicados: true, actualizarExistentes: true },
        }),
      });

      const result = await response.json();
      setImportResult(result);
      setShowImportResult(true);

      if (result.exitosos > 0) {
        toast({ title: "Éxito", description: `${result.exitosos} registros importados correctamente` });
        // Limpiar archivo después de importar exitosamente
        handleClearFile();
        // Refrescar datos del sistema
        if (onRefresh) {
          onRefresh();
        }
      }
    } catch {
      toast({ title: "Error", description: "Error al procesar datos. Verifica el formato del archivo", variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };

  const handleGenerateReporte = async () => {
    setIsLoadingReporte(true);
    try {
      const params = new URLSearchParams({ type: 'reporte-gerencial' });
      if (fechaInicio) params.append('fechaInicio', fechaInicio);
      if (fechaFin) params.append('fechaFin', fechaFin);

      const response = await fetch(`/api/export?${params}`);
      const data = await response.json();
      setReporte(data);
      setShowReporte(true);
    } catch {
      toast({ title: "Error", description: "Error al generar reporte", variant: "destructive" });
    } finally {
      setIsLoadingReporte(false);
    }
  };

  const exportOptions = [
    { value: 'clientes', label: 'Clientes', icon: Users },
    { value: 'membresias', label: 'Membresías', icon: CreditCard },
    { value: 'accesos', label: 'Accesos', icon: DoorOpen },
    { value: 'ingresos', label: 'Ingresos', icon: TrendingUp },
    { value: 'reservas', label: 'Reservas', icon: Calendar },
    { value: 'completo', label: 'Exportación Completa', icon: Database },
  ];

  const importOptions = [
    { value: 'clientes', label: 'Clientes', icon: Users },
    { value: 'membresias', label: 'Membresías', icon: CreditCard },
    { value: 'planes', label: 'Planes de Membresía', icon: FileSpreadsheet },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-emerald-500" />
        <h2 className="text-xl font-semibold">Configuración y Reportes</h2>
      </div>

      <Tabs defaultValue="exportar" className="space-y-4" onValueChange={(value) => {
        if (value === "dispositivos" && !deviceStatus && !isDeviceLoading) {
          fetchDeviceStatus();
        }
      }}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="exportar" className="flex items-center justify-center gap-2 text-xs sm:text-sm">
            <Download className="w-4 h-4 flex-shrink-0" />
            <span>Exportar</span>
          </TabsTrigger>
          <TabsTrigger value="importar" className="flex items-center justify-center gap-2 text-xs sm:text-sm">
            <Upload className="w-4 h-4 flex-shrink-0" />
            <span>Importar</span>
          </TabsTrigger>
          <TabsTrigger value="reportes" className="flex items-center justify-center gap-2 text-xs sm:text-sm">
            <BarChart3 className="w-4 h-4 flex-shrink-0" />
            <span>Reportes</span>
          </TabsTrigger>
          <TabsTrigger value="dispositivos" className="flex items-center justify-center gap-2 text-xs sm:text-sm">
            <Fingerprint className="w-4 h-4 flex-shrink-0" />
            <span>Dispositivos</span>
          </TabsTrigger>
        </TabsList>

        {/* Export Tab */}
        <TabsContent value="exportar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileDown className="w-5 h-5 text-emerald-500" />
                Exportar Datos
              </CardTitle>
              <CardDescription>
                Descarga los datos del sistema en formato JSON o CSV para análisis externos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Datos</Label>
                  <Select value={exportType} onValueChange={setExportType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {exportOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <opt.icon className="w-4 h-4" />
                            {opt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Formato</Label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          JSON
                        </div>
                      </SelectItem>
                      <SelectItem value="csv">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4" />
                          CSV (Excel)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Fecha Inicio (opcional)</Label>
                  <Input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Fecha Fin (opcional)</Label>
                  <Input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                  />
                </div>
              </div>

              <Button
                onClick={handleExport}
                disabled={isExporting || !canExport}
                className="w-full bg-emerald-500 hover:bg-emerald-600"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Exportar Datos
              </Button>

              {!canExport && (
                <p className="text-sm text-amber-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  No tienes permisos para exportar datos
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import Tab */}
        <TabsContent value="importar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-500" />
                Importar Datos
              </CardTitle>
              <CardDescription>
                Importa datos desde archivos JSON o CSV para cargar información masivamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Datos a Importar</Label>
                  <Select value={importType} onValueChange={setImportType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {importOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <opt.icon className="w-4 h-4" />
                            {opt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Formato del Archivo</Label>
                  <Select value={importFormat} onValueChange={setImportFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          JSON
                        </div>
                      </SelectItem>
                      <SelectItem value="csv">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4" />
                          CSV (Excel)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* File Input */}
              <div>
                <Label>Seleccionar Archivo</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-import"
                  />
                  
                  {!selectedFile ? (
                    <label
                      htmlFor="file-import"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FileUp className="w-10 h-10 mb-3 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground">
                          <span className="font-semibold">Haz clic para seleccionar</span> o arrastra un archivo
                        </p>
                        <p className="text-xs text-muted-foreground">
                          JSON o CSV (máx. 10MB)
                        </p>
                      </div>
                    </label>
                  ) : (
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        {importFormat === 'csv' ? (
                          <FileSpreadsheet className="w-8 h-8 text-emerald-500" />
                        ) : (
                          <FileText className="w-8 h-8 text-blue-500" />
                        )}
                        <div>
                          <p className="font-medium">{selectedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(selectedFile.size / 1024).toFixed(2)} KB • {importFormat.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearFile}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Column hints based on import type */}
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <p className="font-medium mb-1">Columnas requeridas para {importType}:</p>
                <p className="text-muted-foreground">
                  {importType === 'clientes' && 'Nombre, Apellido, Email, Telefono (opcional: DNI, Direccion, Huella_Biometrica)'}
                  {importType === 'membresias' && 'Email (del cliente), Plan (nombre del plan), Precio_Pagado, Metodo_Pago, Fecha_Inicio'}
                  {importType === 'planes' && 'Nombre, Precio, Duracion_Dias (opcional: Descripcion)'}
                </p>
              </div>

              <Button
                onClick={handleImport}
                disabled={isImporting || !canImport || !selectedFile}
                className="w-full bg-emerald-500 hover:bg-emerald-600"
              >
                {isImporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {isImporting ? "Importando..." : "Importar Datos"}
              </Button>

              {!canImport && (
                <p className="text-sm text-amber-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  No tienes permisos para importar datos
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Devices Tab */}
        <TabsContent value="dispositivos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-emerald-500" />
                Lector de Huellas Digitales
              </CardTitle>
              <CardDescription>
                Servicio Windows: FitGymFingerprint.exe (puerto 3005)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Service Status */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${deviceStatus?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                  <div>
                    <p className="font-medium">
                      {deviceStatus?.connected ? 'Servicio Activo' : 'Servicio Detenido'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {deviceStatus?.deviceName || 'DigitalPersona 4500'}
                      {deviceStatus?.port && ` • Puerto: ${deviceStatus.port}`}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchDeviceStatus()}
                  disabled={isDeviceLoading}
                >
                  <RefreshCw className={`w-4 h-4 ${isDeviceLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              {/* Device Details Grid */}
              {deviceStatus && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground">Estado del Sensor</p>
                    <p className="font-medium">
                      {deviceStatus.sensorReady ? (
                        <span className="text-emerald-600 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          Listo para capturar
                        </span>
                      ) : (
                        <span className="text-amber-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          No disponible
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground">Modo de Operación</p>
                    <p className="font-medium">
                      {deviceStatus.mode === 'hardware' ? (
                        <span className="text-emerald-600">🔌 Hardware Real</span>
                      ) : (
                        <span className="text-amber-600">⚡ Simulación</span>
                      )}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground">Firmware</p>
                    <p className="font-medium">{deviceStatus.firmwareVersion || 'N/A'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground">Último Error</p>
                    <p className="font-medium text-sm">
                      {deviceStatus.lastError || 'Ninguno'}
                    </p>
                  </div>
                </div>
              )}

              {/* Service Info */}
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  ℹ️ Este servicio se gestiona desde la aplicación Windows:
                </p>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Abre <strong>FitGymFingerprint.exe</strong> en la PC con el lector</li>
                  <li>Haz clic en <strong>"INICIAR SERVICIO"</strong> en la app Windows</li>
                  <li>El servicio se ejecutará en <strong>http://localhost:3005</strong></li>
                  <li>El estado se actualiza automáticamente cada 3 segundos</li>
                  <li>Para capturar huellas, ve a la sección <strong>Clientes → Nuevo Cliente</strong></li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reportes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-500" />
                Reporte Gerencial
              </CardTitle>
              <CardDescription>
                Genera un reporte ejecutivo con métricas clave para la toma de decisiones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Período Inicio</Label>
                  <Input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Período Fin</Label>
                  <Input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                  />
                </div>
              </div>

              <Button
                onClick={handleGenerateReporte}
                disabled={isLoadingReporte}
                className="w-full bg-emerald-500 hover:bg-emerald-600"
              >
                {isLoadingReporte ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <BarChart3 className="w-4 h-4 mr-2" />
                )}
                Generar Reporte Gerencial
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Import Result Dialog */}
      <Dialog open={showImportResult} onOpenChange={setShowImportResult}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Resultado de Importación</DialogTitle>
            <DialogDescription>
              Resumen de la importación de datos
            </DialogDescription>
          </DialogHeader>
          {importResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-2xl font-bold">{importResult.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/10">
                  <p className="text-2xl font-bold text-emerald-600">{importResult.exitosos}</p>
                  <p className="text-xs text-muted-foreground">Exitosos</p>
                </div>
                <div className="p-3 rounded-lg bg-red-500/10">
                  <p className="text-2xl font-bold text-red-600">{importResult.errores.length}</p>
                  <p className="text-xs text-muted-foreground">Errores</p>
                </div>
              </div>

              {importResult.errores.length > 0 && (
                <div>
                  <Label>Errores</Label>
                  <ScrollArea className="h-32 mt-1">
                    <div className="space-y-1 p-2 rounded bg-muted text-xs">
                      {importResult.errores.map((err, i) => (
                        <p key={i} className="text-red-600">{err}</p>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={showReporte} onOpenChange={setShowReporte}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{reporte?.titulo}</DialogTitle>
            <DialogDescription>
              Período: {reporte?.periodo.inicio} - {reporte?.periodo.fin}
            </DialogDescription>
          </DialogHeader>
          {reporte && (
            <ScrollArea className="h-[70vh] pr-4">
              <div className="space-y-6">
                {/* Métricas Generales */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-500" />
                    Métricas Generales
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-xs text-muted-foreground">Total Clientes</p>
                      <p className="text-xl font-bold">{reporte.metricasGenerales.totalClientes}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-emerald-500/10">
                      <p className="text-xs text-muted-foreground">Nuevos del Período</p>
                      <p className="text-xl font-bold text-emerald-600">{reporte.metricasGenerales.clientesNuevosPeriodo}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-xs text-muted-foreground">Crecimiento</p>
                      <p className="text-xl font-bold">{reporte.metricasGenerales.crecimientoClientes}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-xs text-muted-foreground">Membresías Activas</p>
                      <p className="text-xl font-bold">{reporte.metricasGenerales.membresiasActivas}</p>
                    </div>
                  </div>
                </div>

                {/* Ingresos */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    Ingresos del Período
                  </h4>
                  <div className="p-4 rounded-lg bg-emerald-500/10 mb-3">
                    <p className="text-sm text-muted-foreground">Total Ingresos</p>
                    <p className="text-3xl font-bold text-emerald-600">
                      S/ {reporte.ingresos.totalPeriodo.toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Por Plan</p>
                      <div className="space-y-2">
                        {reporte.ingresos.porPlan.map((p, i) => (
                          <div key={i} className="flex justify-between text-sm p-2 rounded bg-muted">
                            <span>{p.plan}</span>
                            <span className="font-medium">S/ {p.total.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Por Método de Pago</p>
                      <div className="space-y-2">
                        {reporte.ingresos.porMetodoPago.map((m, i) => (
                          <div key={i} className="flex justify-between text-sm p-2 rounded bg-muted">
                            <span>{m.metodo}</span>
                            <span className="font-medium">S/ {m.total.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actividad */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <DoorOpen className="w-4 h-4 text-emerald-500" />
                    Actividad
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-xs text-muted-foreground">Accesos</p>
                      <p className="text-xl font-bold">{reporte.actividad.accesosPeriodo}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-xs text-muted-foreground">Reservas</p>
                      <p className="text-xl font-bold">{reporte.actividad.reservasPeriodo}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-xs text-muted-foreground">Promedio Diario</p>
                      <p className="text-xl font-bold">{reporte.actividad.promedioAccesosDiario}</p>
                    </div>
                  </div>
                </div>

                {/* Alertas */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    Alertas
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <p className="text-xs text-muted-foreground">Por Vencer (7 días)</p>
                      <p className="text-xl font-bold text-amber-600">{reporte.metricasGenerales.membresiasPorVencer}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <p className="text-xs text-muted-foreground">Expiradas</p>
                      <p className="text-xl font-bold text-red-600">{reporte.metricasGenerales.membresiasExpiradas}</p>
                    </div>
                  </div>
                </div>

                {/* Recomendaciones */}
                {reporte.recomendaciones.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      Recomendaciones
                    </h4>
                    <div className="space-y-2">
                      {reporte.recomendaciones.map((rec, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-lg border ${
                            rec.tipo === 'urgente'
                              ? 'bg-red-500/5 border-red-500/20'
                              : rec.tipo === 'importante'
                                ? 'bg-amber-500/5 border-amber-500/20'
                                : 'bg-blue-500/5 border-blue-500/20'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <Badge
                              variant="outline"
                              className={
                                rec.tipo === 'urgente'
                                  ? 'border-red-500 text-red-600'
                                  : rec.tipo === 'importante'
                                    ? 'border-amber-500 text-amber-600'
                                    : 'border-blue-500 text-blue-600'
                              }
                            >
                              {rec.tipo}
                            </Badge>
                            <div>
                              <p className="font-medium">{rec.titulo}</p>
                              <p className="text-sm text-muted-foreground">{rec.descripcion}</p>
                              <p className="text-sm font-medium mt-1">💡 {rec.accion}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
