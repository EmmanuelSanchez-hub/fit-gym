"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, CalendarDays } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Clase, Cliente, Reserva } from "../types";
import { ClassesCalendar } from "./reservas/classes-calendar";
import { ReservaDialog } from "./reservas/reserva-dialog";
import { ReservasTable } from "./reservas/reservas-table";
import { ClaseDialog } from "./reservas/clase-dialog";

/** Calcula horaFin a partir de horaInicio + duración en minutos */
function calcularHoraFin(horaInicio: string, duracionMin: number): string {
  if (!horaInicio || !duracionMin) return "";
  const [h, m] = horaInicio.split(":").map(Number);
  const totalMin = h * 60 + m + duracionMin;
  const hh = Math.floor(totalMin / 60) % 24;
  const mm = totalMin % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

interface ReservasSectionProps {
  reservas: Reserva[];
  clases: Clase[];
  clientes: Cliente[];
  user?: { id: string; nombre: string; empleadoId?: string };
  onRefresh?: () => void;
}

export function ReservasSection({ reservas, clases, clientes, user, onRefresh }: ReservasSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [showReservaDialog, setShowReservaDialog] = useState(false);
  const [showClaseDialog, setShowClaseDialog] = useState(false);
  const [editingClase, setEditingClase] = useState<Clase | null>(null);
  const [busquedaHuella, setBusquedaHuella] = useState("");
  const [clienteEncontrado, setClienteEncontrado] = useState<Cliente | null>(null);
  const [reservaForm, setReservaForm] = useState({ clienteId: "", claseId: "", fecha: new Date().toISOString().split("T")[0], notas: "" });
  const [claseForm, setClaseForm] = useState({ nombre: "", descripcion: "", capacidad: "20", duracion: "60", instructor: "", diaSemana: "", horaInicio: "09:00", horaFin: "" });

  const fetchReservas = async (fecha?: string) => {
    try {
      const res = await fetch(`/api/reservas?fecha=${fecha || selectedDate}`);
      if (res.ok) {
        // Refresh from parent to update reservas prop
        onRefresh?.();
      }
    } catch { toast({ title: "Error", description: "Error al cargar reservas", variant: "destructive" }); }
  };

  const handleBusquedaHuella = (v: string) => {
    setBusquedaHuella(v);
    if (v.trim()) {
      const c = clientes.find(x => x.huellaBiometrica?.toLowerCase().includes(v.toLowerCase()));
      setClienteEncontrado(c || null);
      setReservaForm(prev => ({ ...prev, clienteId: c ? c.id : "" }));
    } else { setClienteEncontrado(null); setReservaForm(prev => ({ ...prev, clienteId: "" })); }
  };

  const handleCreateReserva = async () => {
    if (!reservaForm.clienteId || !reservaForm.claseId) { toast({ title: "Error", description: "Busca un cliente y selecciona una clase", variant: "destructive" }); return; }
    try {
      const clase = clases.find(c => c.id === reservaForm.claseId);
      const res = await fetch("/api/reservas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clienteId: reservaForm.clienteId, claseId: reservaForm.claseId, fecha: reservaForm.fecha, horaInicio: clase?.horaInicio || "09:00", horaFin: clase?.horaFin || "10:00", empleadoId: user?.empleadoId, notas: reservaForm.notas }) });
      if (res.ok) { toast({ title: "Éxito", description: "Reserva creada" }); setShowReservaDialog(false); setReservaForm({ clienteId: "", claseId: "", fecha: new Date().toISOString().split("T")[0], notas: "" }); setBusquedaHuella(""); setClienteEncontrado(null); onRefresh?.(); }
      else { const e = await res.json(); toast({ title: "Error", description: e.error || "No se pudo crear", variant: "destructive" }); }
    } catch { toast({ title: "Error", description: "Error al crear", variant: "destructive" }); }
  };

  const handleSaveClase = async () => {
    if (!claseForm.nombre || !claseForm.capacidad) { toast({ title: "Error", description: "Complete los campos", variant: "destructive" }); return; }
    const duracion = parseInt(claseForm.duracion) || 60;
    const horaFinCalc = calcularHoraFin(claseForm.horaInicio, duracion);
    try {
      if (editingClase) {
        const res = await fetch(`/api/clases/${editingClase.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre: claseForm.nombre, descripcion: claseForm.descripcion || null, capacidad: parseInt(claseForm.capacidad), duracion, instructor: claseForm.instructor || null, diaSemana: claseForm.diaSemana || null, horaInicio: claseForm.horaInicio, horaFin: horaFinCalc }),
        });
        if (res.ok) {
          toast({ title: "Éxito", description: "Clase actualizada" });
          onRefresh?.();
        } else { const e = await res.json(); toast({ title: "Error", description: e.error || "No se pudo actualizar", variant: "destructive" }); return; }
      } else {
        const res = await fetch("/api/clases", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nombre: claseForm.nombre, descripcion: claseForm.descripcion || null, capacidad: parseInt(claseForm.capacidad), duracion, instructor: claseForm.instructor || null, diaSemana: claseForm.diaSemana || null, horaInicio: claseForm.horaInicio, horaFin: horaFinCalc }) });
        if (res.ok) {
          toast({ title: "Éxito", description: "Clase creada" });
          onRefresh?.();
        }
        else { toast({ title: "Error", description: "No se pudo crear", variant: "destructive" }); return; }
      }
      setShowClaseDialog(false); setEditingClase(null);
      setClaseForm({ nombre: "", descripcion: "", capacidad: "20", duracion: "60", instructor: "", diaSemana: "", horaInicio: "09:00", horaFin: "" });
    } catch { toast({ title: "Error", description: "Error al guardar", variant: "destructive" }); }
  };

  const openEditClase = (clase: Clase) => {
    setEditingClase(clase);
    setClaseForm({
      nombre: clase.nombre, descripcion: clase.descripcion || "",
      capacidad: String(clase.capacidad), duracion: String(clase.duracion),
      instructor: clase.instructor || "", diaSemana: clase.diaSemana || "",
      horaInicio: clase.horaInicio || "09:00", horaFin: clase.horaFin || "",
    });
    setShowClaseDialog(true);
  };

  const openCreateClase = () => {
    setEditingClase(null);
    setClaseForm({ nombre: "", descripcion: "", capacidad: "20", duracion: "60", instructor: "", diaSemana: "", horaInicio: "09:00", horaFin: "" });
    setShowClaseDialog(true);
  };

  const handleCancelReserva = async (id: string) => {
    if (!confirm("¿Cancelar esta reserva?")) return;
    try {
      const res = await fetch(`/api/reservas/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ estado: "cancelada" }) });
      if (res.ok) { toast({ title: "Éxito", description: "Reserva cancelada" }); onRefresh?.(); }
    } catch { toast({ title: "Error", description: "Error al cancelar", variant: "destructive" }); }
  };

  const handleDeleteClase = async (clase: Clase) => {
    try {
      const res = await fetch(`/api/clases/${clase.id}`, { method: "DELETE" });
      if (res.ok) {
        const data = await res.json();
        const msg = data.reservasCanceladas > 0
          ? `"${clase.nombre}" eliminada. ${data.reservasCanceladas} reserva(s) cancelada(s).`
          : `"${clase.nombre}" ha sido eliminada`;
        toast({ title: "Clase eliminada", description: msg });
        onRefresh?.();
      }
      else { const e = await res.json(); toast({ title: "Error", description: e.error || "No se pudo eliminar", variant: "destructive" }); }
    } catch { toast({ title: "Error", description: "Error al eliminar", variant: "destructive" }); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
        <div>
          <p className="text-xs sm:text-sm text-muted-foreground">Gestiona las reservas de clases</p>
        </div>
        <div className="flex gap-1.5 sm:gap-2 w-full sm:w-auto">
          <Input type="date" value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); fetchReservas(e.target.value); }} className="w-28 sm:w-40 h-8 sm:h-9 text-[10px] sm:text-sm flex-shrink-1" />
          <Button variant="outline" size="sm" onClick={openCreateClase} className="h-8 sm:h-9 text-[10px] sm:text-sm px-2 sm:px-3"><Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />Clase</Button>
          <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 h-8 sm:h-9 text-[10px] sm:text-sm px-2 sm:px-3" onClick={() => { setBusquedaHuella(""); setClienteEncontrado(null); setReservaForm({ clienteId: "", claseId: "", fecha: new Date().toISOString().split("T")[0], notas: "" }); setShowReservaDialog(true); }}>
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />Reserva
          </Button>
        </div>
      </div>

      <ClassesCalendar clases={clases} reservas={reservas} selectedDate={selectedDate} onReservar={(claseId) => { setBusquedaHuella(""); setClienteEncontrado(null); setReservaForm({ clienteId: "", claseId, fecha: new Date().toISOString().split("T")[0], notas: "" }); setShowReservaDialog(true); }} onEditClase={openEditClase} onDeleteClase={handleDeleteClase} />

      <ReservasTable reservas={reservas} clases={clases} selectedDate={selectedDate} searchQuery={searchQuery} onSearchChange={setSearchQuery} onCancel={handleCancelReserva} />

      <ReservaDialog open={showReservaDialog} clases={clases} busquedaHuella={busquedaHuella} clienteEncontrado={clienteEncontrado} form={reservaForm} onOpenChange={setShowReservaDialog} onBusquedaHuellaChange={handleBusquedaHuella} onFormChange={setReservaForm} onSubmit={handleCreateReserva} />

      <ClaseDialog open={showClaseDialog} editingClase={editingClase} form={claseForm} onOpenChange={setShowClaseDialog} onFormChange={setClaseForm} onSubmit={handleSaveClase} />
    </motion.div>
  );
}