"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Membresia } from "../../types";

interface PlanForm {
  nombre: string;
  descripcion: string;
  precio: string;
  duracionDias: string;
}

interface PlanDialogProps {
  open: boolean;
  editing: Membresia | null;
  form: PlanForm;
  onOpenChange: (open: boolean) => void;
  onFormChange: (form: PlanForm) => void;
  onSave: () => void;
}

export function PlanDialog({ open, editing, form, onOpenChange, onFormChange, onSave }: PlanDialogProps) {
  const isEditing = !!editing;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Plan" : "Nuevo Plan de Membresía"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Modifica los datos del plan" : "Crea un nuevo plan de membresía"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="planNombre">Nombre del Plan</Label>
            <Input id="planNombre" value={form.nombre}
              onChange={(e) => onFormChange({ ...form, nombre: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="planDescripcion">Descripción</Label>
            <Input id="planDescripcion" value={form.descripcion}
              onChange={(e) => onFormChange({ ...form, descripcion: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="planPrecio">Precio (S/)</Label>
              <Input id="planPrecio" type="number" value={form.precio}
                onChange={(e) => onFormChange({ ...form, precio: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="planDuracion">Duración (días)</Label>
              <Input id="planDuracion" type="number" value={form.duracionDias}
                onChange={(e) => onFormChange({ ...form, duracionDias: e.target.value })} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSave} className="bg-emerald-500 hover:bg-emerald-600">
            {isEditing ? "Guardar Cambios" : "Crear Plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}