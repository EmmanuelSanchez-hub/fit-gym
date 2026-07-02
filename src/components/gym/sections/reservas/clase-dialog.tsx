"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Clase } from "../../types";

const DIAS = [
  { value: "Lunes", label: "Lunes" },
  { value: "Martes", label: "Martes" },
  { value: "Miércoles", label: "Miércoles" },
  { value: "Jueves", label: "Jueves" },
  { value: "Viernes", label: "Viernes" },
  { value: "Sábado", label: "Sábado" },
  { value: "Domingo", label: "Domingo" },
];

interface ClaseForm {
  nombre: string;
  descripcion: string;
  capacidad: string;
  duracion: string;
  instructor: string;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
}

interface ClaseDialogProps {
  open: boolean;
  editingClase: Clase | null;
  form: ClaseForm;
  onOpenChange: (open: boolean) => void;
  onFormChange: (form: ClaseForm) => void;
  onSubmit: () => void;
}

/** Calcula horaFin a partir de horaInicio + duración en minutos */
function calcularHoraFin(horaInicio: string, duracionMin: number): string {
  if (!horaInicio || !duracionMin) return "";
  const [h, m] = horaInicio.split(":").map(Number);
  const totalMin = h * 60 + m + duracionMin;
  const hh = Math.floor(totalMin / 60) % 24;
  const mm = totalMin % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function ClaseDialog({ open, editingClase, form, onOpenChange, onFormChange, onSubmit }: ClaseDialogProps) {
  const isEditing = !!editingClase;

  const horaFinCalculada = useMemo(
    () => calcularHoraFin(form.horaInicio, parseInt(form.duracion) || 0),
    [form.horaInicio, form.duracion]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Clase" : "Nueva Clase"}</DialogTitle>
          <DialogDescription>
            {isEditing ? `Modifica los datos de ${editingClase.nombre}` : "Crea una nueva clase o espacio para reservar"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 overflow-y-auto flex-1">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input value={form.nombre} onChange={(e) => onFormChange({ ...form, nombre: e.target.value })} placeholder="Ej: Spinning, Yoga, CrossFit" />
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea value={form.descripcion} onChange={(e) => onFormChange({ ...form, descripcion: e.target.value })} placeholder="Descripción de la clase..." rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Capacidad</Label>
              <Input type="number" value={form.capacidad} onChange={(e) => onFormChange({ ...form, capacidad: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Duración (min)</Label>
              <Input type="number" value={form.duracion} onChange={(e) => onFormChange({ ...form, duracion: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Instructor</Label>
            <Input value={form.instructor} onChange={(e) => onFormChange({ ...form, instructor: e.target.value })} placeholder="Nombre del instructor" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Día</Label>
              <Select value={form.diaSemana} onValueChange={(v) => onFormChange({ ...form, diaSemana: v })}>
                <SelectTrigger><SelectValue placeholder="Día" /></SelectTrigger>
                <SelectContent>
                  {DIAS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Hora Inicio</Label>
              <Input type="time" value={form.horaInicio} onChange={(e) => onFormChange({ ...form, horaInicio: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Hora Fin</Label>
              <Input type="time" value={horaFinCalculada} disabled className="opacity-70 cursor-not-allowed" />
              <p className="text-[10px] text-muted-foreground">Inicio + duración</p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSubmit} className="bg-emerald-500 hover:bg-emerald-600">
            {isEditing ? "Guardar Cambios" : "Crear Clase"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}