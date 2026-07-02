"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Fingerprint,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { ClienteForm, Cliente } from "../types";
import {
  checkFingerprintStatus,
  connectFingerprintDevice,
  captureFingerprint,
  type DeviceStatus,
} from "@/lib/fingerprint-client";

interface ClienteDialogProps {
  open: boolean;
  isEditing: boolean;
  form: ClienteForm;
  onOpenChange: (open: boolean) => void;
  onFormChange: (form: ClienteForm) => void;
  onSubmit: () => void;
  selectedCliente?: Cliente | null;
}


export function ClienteDialog({
  open,
  isEditing,
  form,
  onOpenChange,
  onFormChange,
  onSubmit,
}: ClienteDialogProps) {
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | null>(null);
  const [isDeviceLoading, setIsDeviceLoading] = useState(false);
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [fingerprintCaptured, setFingerprintCaptured] = useState(false);

  const checkDeviceStatus = useCallback(async () => {
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
  }, []);

  // Verificar estado del dispositivo UNA SOLA VEZ al abrir el diálogo
  useEffect(() => {
    if (open) {
      checkDeviceStatus();
    }
  }, [open, checkDeviceStatus]);

  const handleConnectDevice = async () => {
    setIsDeviceLoading(true);
    try {
      await connectFingerprintDevice();
      toast({ title: "Éxito", description: "Lector de huellas conectado" });
      checkDeviceStatus();
    } catch {
      toast({
        title: "Error",
        description: "No se pudo conectar al lector",
        variant: "destructive",
      });
    } finally {
      setIsDeviceLoading(false);
    }
  };

  const handleCaptureFingerprint = async () => {
    if (!deviceStatus?.connected) {
      toast({
        title: "Error",
        description: "El lector no está conectado",
        variant: "destructive",
      });
      return;
    }

    setIsCapturing(true);
    try {
      const data = await captureFingerprint();

      if (data.success) {
        setFingerprintCaptured(true);
        onFormChange({ ...form, huellaBiometrica: data.template ?? "" });
        toast({
          title: "Éxito",
          description: `Huella capturada (calidad: ${data.quality}%)`,
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "No se pudo capturar la huella",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Error al capturar huella",
        variant: "destructive",
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    onFormChange({
      nombre: "",
      apellido: "",
      dni: "",
      email: "",
      telefono: "",
      fechaNacimiento: "",
      direccion: "",
      huellaBiometrica: "",
    });
    setFingerprintCaptured(false);
  };

  const handleSubmit = () => {
    if (!isEditing && !fingerprintCaptured && !form.huellaBiometrica) {
      // Si el dispositivo no está disponible, permitir guardar sin huella
      if (deviceError) {
        onSubmit();
        return;
      }
      toast({
        title: "Error",
        description: "Debes capturar la huella biométrica antes de guardar. Si el lector no funciona, ingresa el código manualmente.",
        variant: "destructive",
      });
      return;
    }
    onSubmit();
  };

  const getDeviceStatusColor = () => {
    if (deviceStatus?.connected) return "bg-emerald-500";
    if (deviceError) return "bg-red-500";
    return "bg-red-500";
  };

  const getDeviceStatusText = () => {
    if (isDeviceLoading) return "Verificando...";
    if (deviceStatus?.connected) return "Conectado";
    if (deviceError) return "Sin servicio";
    return "Desconectado";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Cliente" : "Registrar Nuevo Cliente"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los datos del cliente"
              : "Complete los datos y capture la huella biométrica"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {/* Personal Data */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={form.nombre}
                onChange={(e) => onFormChange({ ...form, nombre: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="apellido">Apellido *</Label>
              <Input
                id="apellido"
                value={form.apellido}
                onChange={(e) =>
                  onFormChange({ ...form, apellido: e.target.value })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dni">DNI</Label>
              <Input
                id="dni"
                placeholder="12345678"
                value={form.dni}
                onChange={(e) => onFormChange({ ...form, dni: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="telefono">Teléfono *</Label>
              <Input
                id="telefono"
                value={form.telefono}
                onChange={(e) =>
                  onFormChange({ ...form, telefono: e.target.value })
                }
              />
            </div>
          </div>
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => onFormChange({ ...form, email: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fechaNacimiento">Fecha de Nacimiento</Label>
              <Input
                id="fechaNacimiento"
                type="date"
                value={form.fechaNacimiento}
                onChange={(e) =>
                  onFormChange({ ...form, fechaNacimiento: e.target.value })
                }
              />
            </div>
          </div>
          <div>
            <Label htmlFor="direccion">Dirección</Label>
            <Input
              id="direccion"
              placeholder="Av. Principal 123"
              value={form.direccion}
              onChange={(e) =>
                onFormChange({ ...form, direccion: e.target.value })
              }
            />
          </div>

          {/* Fingerprint Section */}
          <div key={open ? "fingerprint-open" : "fingerprint-closed"} className="p-4 rounded-lg border-2 border-dashed border-emerald-500/50 bg-emerald-500/5">
            <div className="flex items-center gap-2 mb-3">
              <Fingerprint className="w-5 h-5 text-emerald-500" />
              <Label className="text-emerald-600 font-semibold">
                Huella Biométrica *
              </Label>
            </div>

            {/* Device Status */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 mb-3">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${getDeviceStatusColor()}`}
                />
                <div>
                  <p className="text-sm font-medium">
                    {deviceStatus?.deviceName || "DigitalPersona 4500"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getDeviceStatusText()}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={checkDeviceStatus}
                  disabled={isDeviceLoading}
                  className="h-7 w-7 p-0"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${
                      isDeviceLoading ? "animate-spin" : ""
                    }`}
                  />
                </Button>
                {!deviceStatus?.connected && !isDeviceLoading && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleConnectDevice}
                    disabled={isDeviceLoading}
                    className="h-7 text-xs"
                  >
                    Conectar
                  </Button>
                )}
              </div>
            </div>

            {/* Device Error */}
            {deviceError && (
              <div className="flex items-center gap-2 p-2 rounded bg-amber-500/10 border border-amber-500/20 mb-3">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-700">{deviceError}</p>
              </div>
            )}

            {/* Capture Button - solo cuando el dispositivo está conectado */}
            {deviceStatus?.connected && !fingerprintCaptured && (
              <Button
                onClick={handleCaptureFingerprint}
                disabled={isCapturing}
                className="w-full bg-emerald-500 hover:bg-emerald-600"
              >
                {isCapturing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Coloca tu dedo en el lector...
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-4 h-4 mr-2" />
                    Capturar Huella
                  </>
                )}
              </Button>
            )}

            {/* Captured */}
            {fingerprintCaptured && (
              <div className="flex items-center gap-2 p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <p className="text-sm text-emerald-700 font-medium">
                  Huella capturada correctamente
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFingerprintCaptured(false);
                    onFormChange({ ...form, huellaBiometrica: "" });
                  }}
                  className="ml-auto h-7 text-xs"
                >
                  Recapturar
                </Button>
              </div>
            )}

            {/* Manual input: siempre disponible para nuevo cliente cuando el lector falla o no se usa */}
            {(isEditing || (!deviceStatus?.connected && !isDeviceLoading)) && (
              <div className="mt-3">
                <Label htmlFor="huellaBiometrica" className="text-xs">
                  {deviceError
                    ? "Código de huella (ingreso manual - servicio no disponible)"
                    : "Código de huella (manual)"}
                </Label>
                <Input
                  id="huellaBiometrica"
                  placeholder={deviceError ? "Ingresa el template manualmente" : "Código de huella"}
                  value={form.huellaBiometrica}
                  onChange={(e) =>
                    onFormChange({
                      ...form,
                      huellaBiometrica: e.target.value,
                    })
                  }
                  className="border-emerald-500/30 focus:border-emerald-500 mt-1"
                />
                {deviceError && (
                  <p className="text-xs text-amber-600 mt-1">
                    El lector de huellas no está disponible. Puedes ingresar el código manualmente.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            {isEditing ? "Guardar Cambios" : "Registrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}