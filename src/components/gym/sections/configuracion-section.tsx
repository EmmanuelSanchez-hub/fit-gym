"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  Download, Upload, BarChart3, Fingerprint, Settings,
} from "lucide-react";
import {
  checkFingerprintStatus,
  type DeviceStatus as FingerprintDeviceStatus,
} from "@/lib/fingerprint-client";
import { ExportTab } from "./configuracion/export-tab";
import { ImportTab } from "./configuracion/import-tab";
import { DevicesTab } from "./configuracion/devices-tab";
import { ReportsTab } from "./configuracion/reports-tab";
import { ImportResultDialog } from "./configuracion/import-result-dialog";
import { ReportDialog } from "./configuracion/report-dialog";

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
    totalClientes: number; clientesNuevosPeriodo: number; crecimientoClientes: string;
    membresiasActivas: number; membresiasPorVencer: number; membresiasExpiradas: number; tasaRenovacion: string;
  };
  ingresos: {
    totalPeriodo: number;
    porPlan: Array<{ plan: string; cantidad: number; total: number }>;
    porMetodoPago: Array<{ metodo: string; cantidad: number; total: number }>;
  };
  actividad: {
    accesosPeriodo: number; reservasPeriodo: number;
    promedioAccesosDiario: string; tendenciaAccesos: Array<{ fecha: string; total: number }>;
  };
  recomendaciones: Array<{ tipo: string; titulo: string; descripcion: string; accion: string }>;
}

export function ConfiguracionSection({ userRol, onRefresh }: ConfiguracionSectionProps) {
  // Estados compartidos
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
  const [deviceStatus, setDeviceStatus] = useState<FingerprintDeviceStatus | null>(null);
  const [isDeviceLoading, setIsDeviceLoading] = useState(false);
  const [deviceError, setDeviceError] = useState<string | null>(null);

  const canExport = userRol === "SUPER_USUARIO" || userRol === "ADMINISTRADOR";
  const canImport = userRol === "SUPER_USUARIO" || userRol === "ADMINISTRADOR";

  // ──── Fingerprint ────
  const fetchDeviceStatus = async () => {
    setIsDeviceLoading(true);
    setDeviceError(null);
    try {
      const data = await checkFingerprintStatus();
      setDeviceStatus(data);
    } catch (error: any) {
      setDeviceError(error.message || "No se pudo conectar al servicio de huellas.");
      setDeviceStatus(null);
    } finally {
      setIsDeviceLoading(false);
    }
  };

  // ──── Archivos ────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'json' && ext !== 'csv') {
      toast({ title: "Error", description: "Solo se permiten archivos .json o .csv", variant: "destructive" });
      return;
    }
    setImportFormat(ext === 'csv' ? 'csv' : 'json');
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImportData(ev.target?.result as string);
    reader.onerror = () => toast({ title: "Error", description: "No se pudo leer el archivo", variant: "destructive" });
    reader.readAsText(file);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setImportData("");
  };

  // ──── Export ────
  const handleExport = async () => {
    if (!canExport) { toast({ title: "Error", description: "No tienes permisos", variant: "destructive" }); return; }
    setIsExporting(true);
    try {
      const params = new URLSearchParams({ type: exportType, format: exportFormat });
      if (fechaInicio) params.append("fechaInicio", fechaInicio);
      if (fechaFin) params.append("fechaFin", fechaFin);
      const res = await fetch(`/api/export?${params}`);
      if (!res.ok) throw new Error("Error al exportar");
      if (exportFormat === "csv") {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `${exportType}.csv`;
        document.body.appendChild(a); a.click(); URL.revokeObjectURL(url); a.remove();
      } else {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `${exportType}.json`;
        document.body.appendChild(a); a.click(); URL.revokeObjectURL(url); a.remove();
      }
      toast({ title: "Éxito", description: "Archivo exportado correctamente" });
    } catch { toast({ title: "Error", description: "Error al exportar", variant: "destructive" }); }
    finally { setIsExporting(false); }
  };

  // ──── Import ────
  const handleImport = async () => {
    if (!canImport) { toast({ title: "Error", description: "No tienes permisos", variant: "destructive" }); return; }
    if (!importData.trim()) { toast({ title: "Error", description: "Selecciona un archivo", variant: "destructive" }); return; }
    setIsImporting(true);
    try {
      let body: unknown = importData;
      if (importFormat === "json") body = JSON.parse(importData);
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: importType, data: body, format: importFormat, options: { ignorarDuplicados: true, actualizarExistentes: true } }),
      });
      const result = await res.json();
      setImportResult(result);
      setShowImportResult(true);
      if (result.exitosos > 0) {
        toast({ title: "Éxito", description: `${result.exitosos} registros importados` });
        handleClearFile();
        onRefresh?.();
      }
    } catch { toast({ title: "Error", description: "Error al procesar. Verifica el formato", variant: "destructive" }); }
    finally { setIsImporting(false); }
  };

  // ──── Reporte ────
  const handleGenerateReporte = async () => {
    setIsLoadingReporte(true);
    try {
      const params = new URLSearchParams({ type: "reporte-gerencial" });
      if (fechaInicio) params.append("fechaInicio", fechaInicio);
      if (fechaFin) params.append("fechaFin", fechaFin);
      const res = await fetch(`/api/export?${params}`);
      const data = await res.json();
      setReporte(data);
      setShowReporte(true);
    } catch { toast({ title: "Error", description: "Error al generar reporte", variant: "destructive" }); }
    finally { setIsLoadingReporte(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2 sm:gap-3">
        <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
        <h2 className="text-lg sm:text-xl font-semibold">Configuración</h2>
      </div>

      <Tabs defaultValue="exportar" className="space-y-3 sm:space-y-4" onValueChange={(value) => {
        if (value === "dispositivos" && !deviceStatus && !isDeviceLoading) fetchDeviceStatus();
      }}>
        <TabsList className="w-full flex bg-muted/50 p-1 rounded-lg gap-1">
          <TabsTrigger value="exportar" className="flex-1 text-[10px] sm:text-sm px-1 sm:px-3 py-1.5 sm:py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md">
            <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />Exportar
          </TabsTrigger>
          <TabsTrigger value="importar" className="flex-1 text-[10px] sm:text-sm px-1 sm:px-3 py-1.5 sm:py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md">
            <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />Importar
          </TabsTrigger>
          <TabsTrigger value="reportes" className="flex-1 text-[10px] sm:text-sm px-1 sm:px-3 py-1.5 sm:py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md">
            <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />Reportes
          </TabsTrigger>
          <TabsTrigger value="dispositivos" className="flex-1 text-[10px] sm:text-sm px-1 sm:px-3 py-1.5 sm:py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md">
            <Fingerprint className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />Disp.
          </TabsTrigger>
        </TabsList>

        <TabsContent value="exportar" className="space-y-4">
          <ExportTab
            exportType={exportType} exportFormat={exportFormat}
            fechaInicio={fechaInicio} fechaFin={fechaFin}
            isExporting={isExporting} canExport={canExport}
            onExportTypeChange={setExportType} onExportFormatChange={setExportFormat}
            onFechaInicioChange={setFechaInicio} onFechaFinChange={setFechaFin}
            onExport={handleExport}
          />
        </TabsContent>

        <TabsContent value="importar" className="space-y-4">
          <ImportTab
            importType={importType} importFormat={importFormat}
            isImporting={isImporting} canImport={canImport} selectedFile={selectedFile}
            onImportTypeChange={setImportType} onImportFormatChange={setImportFormat}
            onFileSelect={handleFileSelect} onClearFile={handleClearFile} onImport={handleImport}
          />
        </TabsContent>

        <TabsContent value="reportes" className="space-y-4">
          <ReportsTab
            fechaInicio={fechaInicio} fechaFin={fechaFin}
            isLoading={isLoadingReporte}
            onFechaInicioChange={setFechaInicio} onFechaFinChange={setFechaFin}
            onGenerate={handleGenerateReporte}
          />
        </TabsContent>

        <TabsContent value="dispositivos" className="space-y-4">
          <DevicesTab
            deviceStatus={deviceStatus}
            isDeviceLoading={isDeviceLoading}
            deviceError={deviceError}
            onRefresh={fetchDeviceStatus}
          />
        </TabsContent>
      </Tabs>

      <ImportResultDialog open={showImportResult} onOpenChange={setShowImportResult} result={importResult} />
      <ReportDialog open={showReporte} onOpenChange={setShowReporte} reporte={reporte} />
    </motion.div>
  );
}