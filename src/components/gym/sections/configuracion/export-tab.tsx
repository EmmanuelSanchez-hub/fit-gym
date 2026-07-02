"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Download, FileDown, AlertCircle, Users, CreditCard, DoorOpen, TrendingUp, Calendar, Database, FileText, FileSpreadsheet } from "lucide-react";

const exportOptions = [
  { value: 'clientes', label: 'Clientes', icon: Users },
  { value: 'membresias', label: 'Membresías', icon: CreditCard },
  { value: 'accesos', label: 'Accesos', icon: DoorOpen },
  { value: 'ingresos', label: 'Ingresos', icon: TrendingUp },
  { value: 'reservas', label: 'Reservas', icon: Calendar },
  { value: 'completo', label: 'Exportación Completa', icon: Database },
];

interface ExportTabProps {
  exportType: string;
  exportFormat: string;
  fechaInicio: string;
  fechaFin: string;
  isExporting: boolean;
  canExport: boolean;
  onExportTypeChange: (v: string) => void;
  onExportFormatChange: (v: string) => void;
  onFechaInicioChange: (v: string) => void;
  onFechaFinChange: (v: string) => void;
  onExport: () => void;
}

export function ExportTab({
  exportType, exportFormat, fechaInicio, fechaFin,
  isExporting, canExport,
  onExportTypeChange, onExportFormatChange,
  onFechaInicioChange, onFechaFinChange, onExport,
}: ExportTabProps) {
  return (
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
          <div className="space-y-2">
            <Label>Tipo de Datos</Label>
            <Select value={exportType} onValueChange={onExportTypeChange}>
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
          <div className="space-y-2">
            <Label>Formato</Label>
            <Select value={exportFormat} onValueChange={onExportFormatChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />JSON
                  </div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" />CSV (Excel)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Fecha Inicio (opcional)</Label>
            <Input type="date" value={fechaInicio} onChange={(e) => onFechaInicioChange(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Fecha Fin (opcional)</Label>
            <Input type="date" value={fechaFin} onChange={(e) => onFechaFinChange(e.target.value)} />
          </div>
        </div>

        <Button onClick={onExport} disabled={isExporting || !canExport} className="w-full bg-emerald-500 hover:bg-emerald-600">
          {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
          Exportar Datos
        </Button>

        {!canExport && (
          <p className="text-sm text-amber-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />No tienes permisos para exportar datos
          </p>
        )}
      </CardContent>
    </Card>
  );
}