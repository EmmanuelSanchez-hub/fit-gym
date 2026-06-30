"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Smartphone,
  QrCode,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  WifiOff,
  Wifi,
  Phone,
  Play,
  Power,
  AlertTriangle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface WhatsAppStatus {
  connected: boolean;
  qrCode: string | null;
  phoneNumber: string | null;
  lastConnection: string | null;
  status: 'disconnected' | 'connecting' | 'connected' | 'qr_ready' | 'service_unavailable' | 'error';
  error?: string;
}

interface WhatsAppConnectionProps {
  onConnectionChange?: (connected: boolean) => void;
}

export function WhatsAppConnection({ onConnectionChange }: WhatsAppConnectionProps) {
  const [status, setStatus] = useState<WhatsAppStatus>({
    connected: false,
    qrCode: null,
    phoneNumber: null,
    lastConnection: null,
    status: 'disconnected'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);

  // Fetch WhatsApp status
  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/whatsapp/status');
      const data = await response.json();
      setStatus(data);
      onConnectionChange?.(data.connected);
    } catch {
      setStatus({
        connected: false,
        qrCode: null,
        phoneNumber: null,
        lastConnection: null,
        status: 'service_unavailable'
      });
      onConnectionChange?.(false);
    }
  }, [onConnectionChange]);

  // Polling inteligente: solo cuando realmente se necesita
  useEffect(() => {
    // Solo hacer polling si está conectando o esperando QR (no en error/connected/disconnected)
    const activePolling = status.status === 'connecting' || status.status === 'qr_ready';
    const dialogOpen = showQRDialog;
    
    if (!activePolling && !dialogOpen) return;
    // Si hay error, no seguir polling aunque el diálogo esté abierto
    if (status.status === 'error') return;

    // Diálogo abierto: cada 3s. Solo conectando: cada 10s
    const intervalMs = dialogOpen ? 3000 : 10000;
    const interval = setInterval(fetchStatus, intervalMs);
    
    return () => clearInterval(interval);
  }, [showQRDialog, fetchStatus, status.status]);

  // Connect to WhatsApp
  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/whatsapp/connect', { method: 'POST' });
      const data = await response.json();
      
      if (data.status === 'connecting') {
        setShowQRDialog(true);
        toast({ title: "Conectando", description: "Escanea el código QR con WhatsApp" });
      }
    } catch {
      toast({ 
        title: "Error", 
        description: "No se pudo conectar con el servicio de WhatsApp", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect WhatsApp
  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/whatsapp/disconnect', { method: 'DELETE' });
      toast({ title: "Desconectado", description: "WhatsApp ha sido desconectado" });
      fetchStatus();
    } catch {
      toast({ 
        title: "Error", 
        description: "No se pudo desconectar", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get status badge
  const getStatusBadge = () => {
    switch (status.status) {
      case 'connected':
        return <Badge className="bg-emerald-500">Conectado</Badge>;
      case 'connecting':
        return <Badge className="bg-amber-500">Conectando...</Badge>;
      case 'qr_ready':
        return <Badge className="bg-blue-500">QR Listo</Badge>;
      case 'service_unavailable':
        return <Badge variant="destructive">Servicio no disponible</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Desconectado</Badge>;
    }
  };

  // Get status icon
  const getStatusIcon = () => {
    switch (status.status) {
      case 'connected':
        return <Wifi className="w-5 h-5 text-emerald-500" />;
      case 'connecting':
      case 'qr_ready':
        return <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />;
      case 'service_unavailable':
      case 'error':
        return <WifiOff className="w-5 h-5 text-red-500" />;
      default:
        return <WifiOff className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-base">WhatsApp</CardTitle>
                <CardDescription className="text-xs">Envío de promociones</CardDescription>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            {getStatusIcon()}
            <div className="flex-1">
              {status.connected ? (
                <div>
                  <p className="font-medium text-sm">Conectado</p>
                  {status.phoneNumber && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      +{status.phoneNumber}
                    </p>
                  )}
                </div>
              ) : status.status === 'service_unavailable' ? (
                <p className="text-sm text-muted-foreground">
                  El servicio de WhatsApp no está ejecutándose
                </p>
              ) : status.status === 'error' ? (
                <div>
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                    Error de conexión
                  </p>
                  {status.error && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {status.error}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No conectado
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {status.connected ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => setShowQRDialog(true)}
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Ver Estado
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                </Button>
              </>
            ) : status.status === 'connecting' || status.status === 'qr_ready' ? (
              <Button 
                size="sm" 
                className="flex-1 bg-amber-500 hover:bg-amber-600"
                disabled
              >
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Conectando...
              </Button>
            ) : status.status === 'error' ? (
              <Button 
                size="sm" 
                className="flex-1 bg-amber-500 hover:bg-amber-600"
                onClick={handleConnect}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
            ) : (
              <Button 
                size="sm" 
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                onClick={handleConnect}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <QrCode className="w-4 h-4 mr-2" />
                )}
                Conectar WhatsApp
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={(open) => {
        if (!open && status.status === 'connecting') {
          // Si cierra el diálogo sin conectarse, cancelar la conexión
          handleDisconnect();
        }
        setShowQRDialog(open);
      }}>
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
          
          <div className="flex flex-col items-center py-4">
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
                  {getStatusBadge()}
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
                    <p className="text-sm text-muted-foreground">
                      +{status.phoneNumber}
                    </p>
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
                    <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                      {status.error}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 p-8">
                <Loader2 className="w-10 h-10 text-muted-foreground animate-spin" />
                <p className="text-sm text-muted-foreground">
                  Generando código QR...
                </p>
              </div>
            )}

            {/* Instructions */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg text-sm space-y-2">
              <p className="font-medium">Instrucciones:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Abre WhatsApp en tu teléfono</li>
                <li>Ve a Configuración → Dispositivos vinculados</li>
                <li>Toca "Vincular un dispositivo"</li>
                <li>Escanea el código QR</li>
              </ol>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}