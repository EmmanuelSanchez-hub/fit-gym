"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Fingerprint,
  CreditCard,
  CalendarDays,
  Edit,
  Trash2,
  CheckCircle,
  X,
} from "lucide-react";
import type { Membresia, Cliente, MembresiaForm, AuthUser } from "../types";

interface MembresiasSectionProps {
  membresias: Membresia[];
  clientes: Cliente[];
  busquedaHuella: string;
  clienteEncontrado: Cliente | null;
  membresiaForm: MembresiaForm;
  showPlanDialog: boolean;
  showAssignDialog: boolean;
  selectedPlan: Membresia | null;
  planForm: { nombre: string; descripcion: string; precio: string; duracionDias: string };
  user: AuthUser;
  onBusquedaHuellaChange: (huella: string) => void;
  onClearCliente: () => void;
  onMembresiaFormChange: (form: MembresiaForm) => void;
  onShowPlanDialog: (show: boolean) => void;
  onShowAssignDialog: (show: boolean) => void;
  onSelectedPlanChange: (plan: Membresia | null) => void;
  onPlanFormChange: (form: { nombre: string; descripcion: string; precio: string; duracionDias: string }) => void;
  onAssignMembresia: () => void;
  onSavePlan: () => void;
  onDeletePlan: (id: string) => void;
  onEditPlan: (plan: Membresia) => void;
}

export function MembresiasSection({
  membresias,
  clientes,
  busquedaHuella,
  clienteEncontrado,
  membresiaForm,
  showPlanDialog,
  selectedPlan,
  planForm,
  user,
  onBusquedaHuellaChange,
  onClearCliente,
  onMembresiaFormChange,
  onShowPlanDialog,
  onSelectedPlanChange,
  onPlanFormChange,
  onAssignMembresia,
  onSavePlan,
  onDeletePlan,
  onEditPlan,
}: MembresiasSectionProps) {
  // Verificar permisos
  const canCreatePlan = user.rol === 'SUPER_USUARIO' || user.rol === 'ADMINISTRADOR';
  const canEditPlan = user.rol === 'SUPER_USUARIO' || user.rol === 'ADMINISTRADOR';
  const canDeletePlan = user.rol === 'SUPER_USUARIO' || user.rol === 'ADMINISTRADOR';

  const handleNewPlan = () => {
    if (!canCreatePlan) {
      toast({ title: "Sin permisos", description: "No tiene permisos para crear planes", variant: "destructive" });
      return;
    }
    onSelectedPlanChange(null);
    onPlanFormChange({ nombre: "", descripcion: "", precio: "", duracionDias: "30" });
    onShowPlanDialog(true);
  };

  const handleEditPlan = (plan: Membresia) => {
    if (!canEditPlan) {
      toast({ title: "Sin permisos", description: "No tiene permisos para editar planes", variant: "destructive" });
      return;
    }
    onEditPlan(plan);
  };

  const handleDeletePlan = (id: string) => {
    if (!canDeletePlan) {
      toast({ title: "Sin permisos", description: "No tiene permisos para eliminar planes", variant: "destructive" });
      return;
    }
    onDeletePlan(id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Plans Section */}
      <div id="planes-section">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Planes de Membresía</h2>
          {canCreatePlan && (
            <Button
              onClick={handleNewPlan}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Plan
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {membresias.map((plan) => (
            <Card key={plan.id} className="relative overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {plan.nombre}
                  <div className="flex gap-1">
                    {canEditPlan && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditPlan(plan)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    {canDeletePlan && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500"
                        onClick={() => handleDeletePlan(plan.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardTitle>
                <CardDescription>{plan.descripcion}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-emerald-600">
                      S/ {plan.precio}
                    </span>
                    <Badge variant="outline">{plan.duracionDias} días</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {plan._count?.clientesMembresia || 0} clientes activos
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Biometric Search & Assign */}
      <Card id="assign-membresia">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-emerald-500" />
            Asignar Membresía
          </CardTitle>
          <CardDescription>
            Busca un cliente por código de huella y asígnale una membresía
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Biometric Search */}
          <div id="biometric-search">
            <Label>Código de Huella Biométrica</Label>
            <div className="flex gap-2 mt-1.5">
              <div className="relative flex-1">
                <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Ingresa el código de huella..."
                  value={busquedaHuella}
                  onChange={(e) => onBusquedaHuellaChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Found Client */}
          {clienteEncontrado && (
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-emerald-500/20 text-emerald-600">
                      {clienteEncontrado.nombre[0]}
                      {clienteEncontrado.apellido[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">
                      {clienteEncontrado.nombre} {clienteEncontrado.apellido}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {clienteEncontrado.email}
                    </p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={onClearCliente}
                    title="Limpiar selección"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {/* Active Membership Info */}
              {(() => {
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);
                const membresiaActiva = clientes
                  .find(c => c.id === clienteEncontrado.id)
                  ?.membresias?.find(m => {
                    const fechaFin = new Date(m.fechaFin);
                    return m.estado === "activa" && fechaFin >= hoy;
                  });
                
                if (membresiaActiva) {
                  const fechaFin = new Date(membresiaActiva.fechaFin);
                  return (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <div className="flex items-start gap-2">
                        <CalendarDays className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                            Membresía activa detectada
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Plan: <span className="font-medium">{membresiaActiva.membresia.nombre}</span>
                            {" — "}Vence el{" "}
                            {fechaFin.toLocaleDateString("es-ES", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            La nueva membresía comenzará automáticamente el día siguiente al vencimiento de la actual.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}

          {/* Assign Form */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Plan de Membresía</Label>
              <Select
                value={membresiaForm.membresiaId}
                onValueChange={(value) => onMembresiaFormChange({ ...membresiaForm, membresiaId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar plan" />
                </SelectTrigger>
                <SelectContent>
                  {membresias.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nombre} - S/ {m.precio}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Método de Pago</Label>
              <Select
                value={membresiaForm.metodoPago}
                onValueChange={(value) => onMembresiaFormChange({ ...membresiaForm, metodoPago: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Efectivo">Efectivo</SelectItem>
                  <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="Transferencia">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fecha de Inicio</Label>
              <Input
                type="date"
                value={membresiaForm.fechaInicio}
                onChange={(e) => onMembresiaFormChange({ ...membresiaForm, fechaInicio: e.target.value })}
              />
            </div>
            <div>
              <Label>Fecha de Fin</Label>
              <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-input bg-muted/50 text-muted-foreground">
                <CalendarDays className="w-4 h-4" />
                {membresiaForm.fechaInicio && membresiaForm.membresiaId ? (
                  <span>
                    {(() => {
                      const plan = membresias.find(m => m.id === membresiaForm.membresiaId);
                      if (plan) {
                        const fechaFin = new Date(membresiaForm.fechaInicio);
                        fechaFin.setDate(fechaFin.getDate() + plan.duracionDias);
                        return fechaFin.toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "numeric",
                          year: "numeric"
                        });
                      }
                      return "Selecciona un plan";
                    })()}
                  </span>
                ) : (
                  <span>Selecciona un plan</span>
                )}
              </div>
            </div>
          </div>

          <Button
            className="w-full bg-emerald-500 hover:bg-emerald-600"
            onClick={onAssignMembresia}
            disabled={!clienteEncontrado || !membresiaForm.membresiaId}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Asignar Membresía
          </Button>
        </CardContent>
      </Card>

      {/* Plan Dialog */}
      <Dialog open={showPlanDialog} onOpenChange={onShowPlanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedPlan ? "Editar Plan" : "Nuevo Plan de Membresía"}</DialogTitle>
            <DialogDescription>
              {selectedPlan ? "Modifica los datos del plan" : "Crea un nuevo plan de membresía"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="planNombre">Nombre del Plan</Label>
              <Input
                id="planNombre"
                value={planForm.nombre}
                onChange={(e) => onPlanFormChange({ ...planForm, nombre: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="planDescripcion">Descripción</Label>
              <Input
                id="planDescripcion"
                value={planForm.descripcion}
                onChange={(e) => onPlanFormChange({ ...planForm, descripcion: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="planPrecio">Precio (S/)</Label>
                <Input
                  id="planPrecio"
                  type="number"
                  value={planForm.precio}
                  onChange={(e) => onPlanFormChange({ ...planForm, precio: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="planDuracion">Duración (días)</Label>
                <Input
                  id="planDuracion"
                  type="number"
                  value={planForm.duracionDias}
                  onChange={(e) => onPlanFormChange({ ...planForm, duracionDias: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onShowPlanDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={onSavePlan} className="bg-emerald-500 hover:bg-emerald-600">
              {selectedPlan ? "Guardar Cambios" : "Crear Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
