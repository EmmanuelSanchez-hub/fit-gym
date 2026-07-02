"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Fingerprint,
  CreditCard,
  CalendarDays,
  CheckCircle,
  X,
} from "lucide-react";
import type { Membresia, Cliente, MembresiaForm } from "../../types";

interface AssignFormProps {
  membresias: Membresia[];
  clientes: Cliente[];
  busquedaHuella: string;
  clienteEncontrado: Cliente | null;
  membresiaForm: MembresiaForm;
  onBusquedaHuellaChange: (huella: string) => void;
  onClearCliente: () => void;
  onMembresiaFormChange: (form: MembresiaForm) => void;
  onAssign: () => void;
}

export function AssignForm({
  membresias, clientes, busquedaHuella, clienteEncontrado, membresiaForm,
  onBusquedaHuellaChange, onClearCliente, onMembresiaFormChange, onAssign,
}: AssignFormProps) {

  return (
    <Card id="assign-membresia">
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Fingerprint className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" /> Asignar Membresía
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">Busca un cliente por código de huella y asígnale una membresía</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {/* Buscador */}
        <div id="biometric-search">
          <Label className="text-xs sm:text-sm">Código de Huella Biométrica</Label>
          <div className="relative mt-1 sm:mt-1.5">
            <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
            <Input placeholder="Ingresa el código de huella..." value={busquedaHuella}
              onChange={(e) => onBusquedaHuellaChange(e.target.value)}
              className="pl-9 sm:pl-10 h-8 sm:h-9 text-sm" />
          </div>
        </div>

        {/* Cliente encontrado */}
        {clienteEncontrado && (
          <div className="space-y-2 sm:space-y-3">
            <div className="p-3 sm:p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2 sm:gap-3">
                <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                  <AvatarFallback className="bg-emerald-500/20 text-emerald-600 text-xs sm:text-sm">
                    {clienteEncontrado.nombre[0]}{clienteEncontrado.apellido[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm sm:text-base truncate">{clienteEncontrado.nombre} {clienteEncontrado.apellido}</p>
                  <p className="text-xs text-muted-foreground truncate">{clienteEncontrado.email}</p>
                </div>
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 shrink-0" />
                <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 shrink-0" onClick={onClearCliente} title="Limpiar selección">
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Button>
              </div>
            </div>

            {/* Aviso membresía activa */}
            {(() => {
              const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
              const membresiaActiva = clientes.find(c => c.id === clienteEncontrado.id)?.membresias?.find(m => {
                const fechaFin = new Date(m.fechaFin);
                return (m.estado === "activa" || m.estado === "ACTIVA") && fechaFin >= hoy;
              });
              if (membresiaActiva) {
                const fechaFin = new Date(membresiaActiva.fechaFin);
                return (
                  <div className="p-2.5 sm:p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-start gap-2">
                      <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-amber-600 dark:text-amber-400">Membresía activa detectada</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                          Plan: <span className="font-medium">{membresiaActiva.membresia.nombre}</span>{" — "}Vence el{" "}
                          {fechaFin.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">La nueva membresía comenzará automáticamente el día siguiente al vencimiento.</p>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}

        {/* Plan y pago */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <Label className="text-xs sm:text-sm">Plan de Membresía</Label>
            <Select value={membresiaForm.membresiaId} onValueChange={(v) => onMembresiaFormChange({ ...membresiaForm, membresiaId: v })}>
              <SelectTrigger className="h-9 text-sm mt-1"><SelectValue placeholder="Seleccionar plan" /></SelectTrigger>
              <SelectContent>{membresias.map((m) => (<SelectItem key={m.id} value={m.id}>{m.nombre} - S/ {m.precio}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs sm:text-sm">Método de Pago</Label>
            <Select value={membresiaForm.metodoPago} onValueChange={(v) => onMembresiaFormChange({ ...membresiaForm, metodoPago: v })}>
              <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Efectivo">Efectivo</SelectItem>
                <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                <SelectItem value="Transferencia">Transferencia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <Label className="text-xs sm:text-sm">Fecha de Inicio</Label>
            <Input type="date" value={membresiaForm.fechaInicio}
              onChange={(e) => onMembresiaFormChange({ ...membresiaForm, fechaInicio: e.target.value })}
              className="h-9 text-sm mt-1" />
          </div>
          <div>
            <Label className="text-xs sm:text-sm">Fecha de Fin</Label>
            <div className="flex items-center gap-1.5 sm:gap-2 h-9 px-3 mt-1 rounded-md border bg-muted/50 text-muted-foreground text-sm truncate">
              <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              {membresiaForm.fechaInicio && membresiaForm.membresiaId ? (
                <span className="truncate">{(() => {
                  const plan = membresias.find(m => m.id === membresiaForm.membresiaId);
                  if (plan) { const ff = new Date(membresiaForm.fechaInicio); ff.setDate(ff.getDate() + plan.duracionDias); return ff.toLocaleDateString("es-ES", { day: "numeric", month: "numeric", year: "numeric" }); }
                  return "Selecciona un plan";
                })()}</span>
              ) : <span>Selecciona un plan</span>}
            </div>
          </div>
        </div>

        {/* Botón asignar */}
        <Button className="w-full bg-emerald-500 hover:bg-emerald-600 h-9 sm:h-10 text-sm"
          onClick={onAssign} disabled={!clienteEncontrado || !membresiaForm.membresiaId}>
          <CreditCard className="w-4 h-4 mr-2" />Asignar Membresía
        </Button>
      </CardContent>
    </Card>
  );
}