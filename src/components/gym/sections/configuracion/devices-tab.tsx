"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Fingerprint, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import type { DeviceStatus } from "@/lib/fingerprint-client";

interface DevicesTabProps {
  deviceStatus: DeviceStatus | null;
  isDeviceLoading: boolean;
  deviceError: string | null;
  onRefresh: () => void;
}

export function DevicesTab({ deviceStatus, isDeviceLoading, deviceError, onRefresh }: DevicesTabProps) {
  return (
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
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isDeviceLoading}>
            <RefreshCw className={`w-4 h-4 ${isDeviceLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Device Error */}
        {deviceError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700">{deviceError}</p>
          </div>
        )}

        {/* Device Details Grid */}
        {deviceStatus && (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted space-y-1">
              <p className="text-xs text-muted-foreground">Estado del Sensor</p>
              <p className="font-medium">
                {deviceStatus.sensorReady ? (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />Listo para capturar
                  </span>
                ) : (
                  <span className="text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />No disponible
                  </span>
                )}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted space-y-1">
              <p className="text-xs text-muted-foreground">Modo de Operación</p>
              <p className="font-medium">
                {deviceStatus.mode === 'hardware' ? (
                  <span className="text-emerald-600">🔌 Hardware Real</span>
                ) : (
                  <span className="text-amber-600">⚡ Simulación</span>
                )}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted space-y-1">
              <p className="text-xs text-muted-foreground">Firmware</p>
              <p className="font-medium">{deviceStatus.firmwareVersion || 'N/A'}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted space-y-1">
              <p className="text-xs text-muted-foreground">Último Error</p>
              <p className="font-medium text-sm">{deviceStatus.lastError || 'Ninguno'}</p>
            </div>
          </div>
        )}

        {/* Service Info */}
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-sm font-medium text-blue-900 mb-2">ℹ️ Este servicio se gestiona desde la aplicación Windows:</p>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Abre <strong>FitGymFingerprint.exe</strong> en la PC con el lector</li>
            <li>Haz clic en <strong>"INICIAR SERVICIO"</strong> en la app Windows</li>
            <li>El servicio se ejecutará en <strong>http://localhost:3005</strong></li>
            <li>Usa el botón 🔄 para refrescar el estado manualmente</li>
            <li>Para capturar huellas, ve a la sección <strong>Clientes → Nuevo Cliente</strong></li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}