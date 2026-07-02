"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Fingerprint,
  QrCode,
  ArrowRightLeft,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Acceso, Cliente } from "../types";
import {
  checkFingerprintStatus,
  captureFingerprint,
} from "@/lib/fingerprint-client";

interface AccesosSectionProps {
  accesos: Acceso[];
  clientes?: Cliente[];
  codigoAcceso: string;
  tipoAcceso: string;
  onCodigoChange: (codigo: string) => void;
  onTipoChange: (tipo: string) => void;
  onVerify: () => void;
  onHuellaChange?: (huella: string) => void;
  huellaAcceso?: string;
  onCaptureFingerprint?: () => Promise<boolean>;
  isCapturing?: boolean;
}

export function AccesosSection({
  accesos,
  clientes = [],
  codigoAcceso,
  tipoAcceso,
  onCodigoChange,
  onTipoChange,
  onVerify,
  onHuellaChange,
  huellaAcceso = "",
  onCaptureFingerprint,
  isCapturing = false,
}: AccesosSectionProps) {
  const [metodoAcceso, setMetodoAcceso] = useState<"codigo" | "huella">("huella");
  const [huellaLocal, setHuellaLocal] = useState(huellaAcceso);
  const [lastCapture, setLastCapture] = useState<string | null>(null);

  const handleHuellaChange = (value: string) => {
    setHuellaLocal(value);
    onHuellaChange?.(value);
  };

  const handleCaptureFromLector = async () => {
    if (onCaptureFingerprint) {
      const captured = await onCaptureFingerprint();
      if (captured) {
        // La huella capturada se sincroniza via onHuellaChange desde el hook
      }
    }
  };

  const handleVerify = () => {
    onVerify();
  };

  // Captura de huella manual (sin polling automático para evitar saturar el servicio)
  // El usuario debe hacer clic en el botón de captura para leer la huella

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Access Verification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-emerald-500" />
              Verificar Acceso
            </CardTitle>
            <CardDescription>
              Selecciona el método de verificación
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={metodoAcceso} onValueChange={(v) => setMetodoAcceso(v as "codigo" | "huella")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="huella" className="flex items-center gap-2">
                  <Fingerprint className="w-4 h-4" />
                  Huella
                </TabsTrigger>
                <TabsTrigger value="codigo" className="flex items-center gap-2">
                  <QrCode className="w-4 h-4" />
                  Código
                </TabsTrigger>
              </TabsList>

              <TabsContent value="huella" className="space-y-4 mt-4">
                <div id="acceso-input">
                  <Label htmlFor="huellaAcceso" className="flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-emerald-500" />
                    Huella Biométrica
                  </Label>
                  <div className="relative mt-1.5">
                    <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="huellaAcceso"
                      placeholder="Ingresa código de huella..."
                      value={huellaLocal}
                      onChange={(e) => handleHuellaChange(e.target.value)}
                      className="pl-12 h-12 text-lg"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    El código de huella está registrado en el perfil del cliente
                  </p>

                  {/* Botón para capturar desde el lector biométrico local */}
                  <Button
                    onClick={handleCaptureFromLector}
                    disabled={isCapturing}
                    variant="outline"
                    className="w-full mt-2 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                  >
                    {isCapturing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Coloca tu dedo en el lector...
                      </>
                    ) : (
                      <>
                        <Fingerprint className="w-4 h-4 mr-2" />
                        Capturar desde Lector Biométrico
                      </>
                    )}
                  </Button>
                  {huellaLocal && (
                    <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Huella capturada desde el lector
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="codigo" className="space-y-4 mt-4">
                <div id="acceso-input">
                  <Label htmlFor="codigoAcceso" className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-emerald-500" />
                    Código de Acceso
                  </Label>
                  <div className="relative mt-1.5">
                    <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="codigoAcceso"
                      placeholder="Ej: ABC123"
                      value={codigoAcceso}
                      onChange={(e) => onCodigoChange(e.target.value)}
                      className="pl-12 h-12 text-lg"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Código único asignado al cliente
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div>
              <Label>Tipo de Acceso</Label>
              <div className="flex gap-2 mt-1.5">
                <Button
                  variant={tipoAcceso === "entrada" ? "default" : "outline"}
                  className={tipoAcceso === "entrada" ? "bg-emerald-500 hover:bg-emerald-600" : ""}
                  onClick={() => onTipoChange("entrada")}
                >
                  <ArrowRightLeft className="w-4 h-4 mr-2" />
                  Entrada
                </Button>
                <Button
                  variant={tipoAcceso === "salida" ? "default" : "outline"}
                  className={tipoAcceso === "salida" ? "bg-emerald-500 hover:bg-emerald-600" : ""}
                  onClick={() => onTipoChange("salida")}
                >
                  <ArrowRightLeft className="w-4 h-4 mr-2 rotate-180" />
                  Salida
                </Button>
              </div>
            </div>

            <Button
              className="w-full bg-emerald-500 hover:bg-emerald-600 h-12"
              onClick={handleVerify}
              id="verify-btn"
              disabled={metodoAcceso === "huella" ? !huellaLocal : !codigoAcceso}
            >
              <Fingerprint className="w-5 h-5 mr-2" />
              Verificar Acceso
            </Button>
          </CardContent>
        </Card>

        {/* Recent Access List */}
        <Card>
          <CardHeader>
            <CardTitle>Últimos Accesos</CardTitle>
            <CardDescription>Historial de accesos del día</CardDescription>
          </CardHeader>
          <CardContent id="accesos-list">
            <ScrollArea className="h-80">
              <div className="space-y-3">
                {accesos.map((acceso) => (
                  <div
                    key={acceso.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className={
                        acceso.exitoso
                          ? "bg-emerald-500/20 text-emerald-600"
                          : "bg-red-500/20 text-red-600"
                      }>
                        {acceso.exitoso ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <XCircle className="w-5 h-5" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {acceso.cliente.nombre} {acceso.cliente.apellido}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {new Date(acceso.fechaHora).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        <Badge variant="outline" className="text-xs">
                          {acceso.tipo}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {acceso.metodo}
                        </Badge>
                      </div>
                    </div>
                    <Badge
                      variant={acceso.exitoso ? "default" : "destructive"}
                      className={
                        acceso.exitoso ? "bg-emerald-500/20 text-emerald-600" : ""
                      }
                    >
                      {acceso.exitoso ? "Permitido" : "Denegado"}
                    </Badge>
                  </div>
                ))}

                {accesos.length === 0 && (
                  <div className="text-center py-8">
                    <Fingerprint className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No hay accesos registrados</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
