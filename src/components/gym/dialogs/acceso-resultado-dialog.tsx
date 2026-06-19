"use client";

import { useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  XCircle,
  CalendarDays,
  Clock,
} from "lucide-react";
import type { AccesoResultado } from "../types";

interface AccesoResultadoDialogProps {
  open: boolean;
  resultado: AccesoResultado | null;
  onOpenChange: (open: boolean) => void;
  onRenovar: () => void;
}

export function AccesoResultadoDialog({
  open,
  resultado,
  onOpenChange,
  onRenovar,
}: AccesoResultadoDialogProps) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-cerrar el diálogo después de 6 segundos
  useEffect(() => {
    if (open) {
      // Limpiar timer anterior si existe
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // Configurar nuevo timer
      timerRef.current = setTimeout(() => {
        onOpenChange(false);
      }, 6000);
    }

    // Cleanup
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [open, onOpenChange]);

  if (!resultado) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Verificación de Acceso</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Resultado principal */}
          <div className={`p-6 rounded-lg text-center ${
            resultado.exitoso 
              ? "bg-emerald-500/10 border border-emerald-500/20" 
              : "bg-red-500/10 border border-red-500/20"
          }`}>
            {resultado.exitoso ? (
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-2" />
            ) : (
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-2" />
            )}
            <h3 className={`text-xl font-bold ${
              resultado.exitoso ? "text-emerald-600" : "text-red-600"
            }`}>
              {resultado.exitoso ? "ACCESO PERMITIDO" : "ACCESO DENEGADO"}
            </h3>
            <p className="text-muted-foreground mt-1">
              {resultado.mensaje || (resultado.exitoso 
                ? "El cliente puede ingresar al gimnasio" 
                : "Membresía no válida o expirada")}
            </p>
          </div>

          {/* Información del cliente */}
          {resultado.cliente && (
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                  {resultado.cliente.nombre[0]}
                  {resultado.cliente.apellido[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {resultado.cliente.nombre} {resultado.cliente.apellido}
                </p>
              </div>
            </div>
          )}

          {/* Información de membresía */}
          {resultado.membresia && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-muted-foreground">Plan</Label>
                  <Badge variant="outline">{resultado.membresia.nombre}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="w-4 h-4" />
                    Fecha Inicio
                  </Label>
                  <span className="text-sm">
                    {new Date(resultado.membresia.fechaInicio).toLocaleDateString("es-ES")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="w-4 h-4" />
                    Fecha Fin
                  </Label>
                  <span className="text-sm">
                    {new Date(resultado.membresia.fechaFin).toLocaleDateString("es-ES")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-muted-foreground flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Días Restantes
                  </Label>
                  <Badge variant={resultado.membresia.diasRestantes > 7 ? "default" : "destructive"}>
                    {resultado.membresia.diasRestantes} días
                  </Badge>
                </div>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          {!resultado.exitoso && (
            <Button variant="outline" onClick={onRenovar}>
              Renovar Membresía
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
