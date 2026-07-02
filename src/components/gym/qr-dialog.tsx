"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Smartphone, CheckCircle, Loader2, AlertTriangle } from "lucide-react";

interface WhatsAppStatus {
  connected: boolean;
  qrCode: string | null;
  phoneNumber: string | null;
  status: 'disconnected' | 'connecting' | 'connected' | 'qr_ready' | 'service_unavailable' | 'error';
  error?: string;
}

interface QrDialogProps {
  open: boolean;
  status: WhatsAppStatus;
  onOpenChange: (open: boolean) => void;
  onDisconnect: () => void;
}

function getStatusBadge(status: WhatsAppStatus) {
  switch (status.status) {
    case 'connected': return <Badge className="bg-emerald-500">Conectado</Badge>;
    case 'connecting': return <Badge className="bg-amber-500">Conectando...</Badge>;
    case 'qr_ready': return <Badge className="bg-blue-500">QR Listo</Badge>;
    case 'error': return <Badge variant="destructive">Error</Badge>;
    default: return <Badge variant="secondary">Desconectado</Badge>;
  }
}

export function QrDialog({ open, status, onOpenChange, onDisconnect }: QrDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-green-500" />
            Conectar WhatsApp
          </DialogTitle>
          <DialogDescription>
            Escanea este código QR con WhatsApp en tu teléfono
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-4 max-h-[60vh] overflow-y-auto">
          {status.qrCode ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative"
            >
              <img
                src={status.qrCode}
                alt="WhatsApp QR Code"
                className="w-64 h-64 rounded-lg border shadow-lg"
              />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                {getStatusBadge(status)}
              </div>
            </motion.div>
          ) : status.connected ? (
            <div className="flex flex-col items-center gap-3 p-8">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-emerald-600">¡Conectado!</p>
                {status.phoneNumber && (
                  <p className="text-sm text-muted-foreground">+{status.phoneNumber}</p>
                )}
              </div>
            </div>
          ) : status.status === 'error' ? (
            <div className="flex flex-col items-center gap-3 p-8">
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-red-600">Error de conexión</p>
                {status.error && (
                  <p className="text-sm text-muted-foreground mt-2 max-w-xs">{status.error}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 p-8">
              <Loader2 className="w-10 h-10 text-muted-foreground animate-spin" />
              <p className="text-sm text-muted-foreground">Generando código QR...</p>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-6 space-y-3">
            <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300">
              <p className="font-medium mb-1">⚠️ Antes de escanear:</p>
              <p>Si ya tienes este dispositivo vinculado en tu WhatsApp, desvincúlalo primero: <strong>Ajustes → Dispositivos vinculados → [nombre del dispositivo] → Cerrar sesión</strong></p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-sm space-y-2">
              <p className="font-medium">Instrucciones:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Abre WhatsApp en tu teléfono</li>
                <li>Ve a Ajustes → Dispositivos vinculados</li>
                <li>Toca "Vincular un dispositivo"</li>
                <li>Escanea el código QR</li>
              </ol>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}