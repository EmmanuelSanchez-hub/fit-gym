"use client";

import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Mail,
  Phone,
  Fingerprint,
  CreditCard,
  CalendarDays,
} from "lucide-react";
import type { Cliente } from "../types";

interface ClienteDetailDialogProps {
  open: boolean;
  cliente: Cliente | null;
  onOpenChange: (open: boolean) => void;
  onRegisterAccess: (cliente: Cliente) => void;
  onAssignMembership: (cliente: Cliente) => void;
}

export function ClienteDetailDialog({
  open,
  cliente,
  onOpenChange,
  onRegisterAccess,
  onAssignMembership,
}: ClienteDetailDialogProps) {
  // Calcular si la membresía está activa comparando solo fechas (sin horas)
  const membresiaInfo = useMemo(() => {
    if (!cliente?.membresias || cliente.membresias.length === 0) return null;
    
    const membresia = cliente.membresias[0];
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Normalizar a medianoche
    
    const fechaFin = new Date(membresia.fechaFin);
    fechaFin.setHours(0, 0, 0, 0); // Normalizar a medianoche
    
    const fechaInicio = new Date(membresia.fechaInicio);
    fechaInicio.setHours(0, 0, 0, 0);
    
    const diasRestantes = Math.ceil((fechaFin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    const expirada = diasRestantes < 0;
    const porVencer = diasRestantes >= 0 && diasRestantes <= 7;
    
    return {
      membresia,
      expirada,
      porVencer,
      diasRestantes,
      fechaInicio,
      fechaFin,
    };
  }, [cliente]);

  if (!cliente) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Información del Cliente</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-2xl">
                {cliente.nombre[0]}
                {cliente.apellido[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-bold">
                {cliente.nombre} {cliente.apellido}
              </h3>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Badge
                  variant={cliente.activo ? "default" : "secondary"}
                  className={cliente.activo ? "bg-emerald-500/20 text-emerald-600" : ""}
                >
                  {cliente.activo ? "Activo" : "Inactivo"}
                </Badge>
                <span>•</span>
                <span>Código: {cliente.codigoAcceso}</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {cliente.email}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Teléfono</Label>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {cliente.telefono}
              </p>
            </div>
            {cliente.huellaBiometrica && (
              <div className="col-span-2">
                <Label className="text-muted-foreground">Huella Biométrica</Label>
                <p className="flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-emerald-500" />
                  <span className="font-mono">{cliente.huellaBiometrica}</span>
                </p>
              </div>
            )}
          </div>

          {membresiaInfo && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2">Membresía Actual</h4>
                <div className="p-4 rounded-lg bg-muted">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">
                      {membresiaInfo.membresia.membresia.nombre}
                    </span>
                    <Badge
                      variant={
                        membresiaInfo.expirada
                          ? "destructive"
                          : membresiaInfo.porVencer
                            ? "secondary"
                            : "default"
                      }
                      className={
                        membresiaInfo.expirada
                          ? ""
                          : membresiaInfo.porVencer
                            ? "bg-amber-500/20 text-amber-600"
                            : "bg-emerald-500/20 text-emerald-600"
                      }
                    >
                      {membresiaInfo.expirada
                        ? "Expirada"
                        : membresiaInfo.porVencer
                          ? `Por vencer (${membresiaInfo.diasRestantes}d)`
                          : `Activa (${membresiaInfo.diasRestantes}d)`
                      }
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4" />
                      <span>Inicio: {membresiaInfo.fechaInicio.toLocaleDateString("es-ES")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4" />
                      <span>Fin: {membresiaInfo.fechaFin.toLocaleDateString("es-ES")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => onRegisterAccess(cliente)}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600"
            >
              <Fingerprint className="w-4 h-4 mr-2" />
              Registrar Acceso
            </Button>
            <Button
              variant="outline"
              onClick={() => onAssignMembership(cliente)}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Asignar Membresía
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
