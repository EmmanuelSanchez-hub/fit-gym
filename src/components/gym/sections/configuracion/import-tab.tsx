"use client";

import { useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, FileUp, AlertCircle, FileSpreadsheet, FileText, X, Users, CreditCard } from "lucide-react";

const importOptions = [
  { value: 'clientes', label: 'Clientes', icon: Users },
  { value: 'membresias', label: 'Membresías', icon: CreditCard },
  { value: 'planes', label: 'Planes de Membresía', icon: FileSpreadsheet },
];

interface ImportTabProps {
  importType: string;
  importFormat: string;
  isImporting: boolean;
  canImport: boolean;
  selectedFile: File | null;
  onImportTypeChange: (v: string) => void;
  onImportFormatChange: (v: string) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearFile: () => void;
  onImport: () => void;
}

export function ImportTab({
  importType, importFormat, isImporting, canImport, selectedFile,
  onImportTypeChange, onImportFormatChange, onFileSelect, onClearFile, onImport,
}: ImportTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
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
          <div className="space-y-2">
            <Label>Tipo de Datos a Importar</Label>
            <Select value={importType} onValueChange={onImportTypeChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {importOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex items-center gap-2">
                      <opt.icon className="w-4 h-4" />{opt.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Formato del Archivo</Label>
            <Select value={importFormat} onValueChange={onImportFormatChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="json">
                  <div className="flex items-center gap-2"><FileText className="w-4 h-4" />JSON</div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2"><FileSpreadsheet className="w-4 h-4" />CSV (Excel)</div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Seleccionar Archivo</Label>
          <input type="file" ref={fileInputRef} accept=".json,.csv" onChange={onFileSelect} className="hidden" id="file-import" />
          {!selectedFile ? (
            <label htmlFor="file-import" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FileUp className="w-10 h-10 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold">Haz clic para seleccionar</span> o arrastra un archivo
                </p>
                <p className="text-xs text-muted-foreground">JSON o CSV (máx. 10MB)</p>
              </div>
            </label>
          ) : (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                {importFormat === 'csv' ? <FileSpreadsheet className="w-8 h-8 text-emerald-500" /> : <FileText className="w-8 h-8 text-blue-500" />}
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">{(selectedFile.size / 1024).toFixed(2)} KB • {importFormat.toUpperCase()}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClearFile} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="p-3 rounded-lg bg-muted/50 text-sm">
          <p className="font-medium mb-1">Columnas requeridas para {importType}:</p>
          <p className="text-muted-foreground">
            {importType === 'clientes' && 'Nombre, Apellido, Email, Telefono (opcional: DNI, Direccion, Huella_Biometrica)'}
            {importType === 'membresias' && 'Email (del cliente), Plan (nombre del plan), Precio_Pagado, Metodo_Pago, Fecha_Inicio'}
            {importType === 'planes' && 'Nombre, Precio, Duracion_Dias (opcional: Descripcion)'}
          </p>
        </div>

        <Button onClick={onImport} disabled={isImporting || !canImport || !selectedFile} className="w-full bg-emerald-500 hover:bg-emerald-600">
          {isImporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
          {isImporting ? "Importando..." : "Importar Datos"}
        </Button>

        {!canImport && (
          <p className="text-sm text-amber-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />No tienes permisos para importar datos
          </p>
        )}
      </CardContent>
    </Card>
  );
}