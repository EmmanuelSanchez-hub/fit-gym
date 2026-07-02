"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Fingerprint, User, CheckCircle } from "lucide-react";
import type { Clase, Cliente } from "../../types";

interface ReservaDialogProps {
  open: boolean;
  clases: Clase[];
  busquedaHuella: string;
  clienteEncontrado: Cliente | null;
  form: { clienteId: string; claseId: string; fecha: string; notas: string };
  onOpenChange: (open: boolean) => void;
  onBusquedaHuellaChange: (v: string) => void;
  onFormChange: (form: { clienteId: string; claseId: string; fecha: string; notas: string }) => void;
  onSubmit: () => void;
}

export function ReservaDialog({
  open, clases, busquedaHuella, clienteEncontrado, form,
  onOpenChange, onBusquedaHuellaChange, onFormChange, onSubmit,
}: ReservaDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Nueva Reserva</DialogTitle>
          <DialogDescription>Busca el cliente por huella biométrica y selecciona la clase</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 overflow-y-auto flex-1">
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-emerald-500" />Buscar por Huella Biométrica
            </Label>
            <div className="relative">
              <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Ingresa el código de huella..."
                value={busquedaHuella}
                onChange={(e) => onBusquedaHuellaChange(e.target.value)}
                className="pl-12 h-12 text-lg"
              />
            </div>
            {clienteEncontrado ? (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-emerald-500/20 text-emerald-600">
                      {clienteEncontrado.nombre.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-emerald-600 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />{clienteEncontrado.nombre} {clienteEncontrado.apellido}
                    </p>
                    <p className="text-sm text-muted-foreground">{clienteEncontrado.telefono}</p>
                  </div>
                </div>
              </motion.div>
            ) : busquedaHuella && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                <p className="text-sm text-red-600 flex items-center gap-2"><User className="w-4 h-4" />No se encontró cliente con esa huella</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Clase</Label>
            <Select value={form.claseId} onValueChange={(v) => onFormChange({ ...form, claseId: v })}>
              <SelectTrigger><SelectValue placeholder="Seleccionar clase" /></SelectTrigger>
              <SelectContent>
                {clases.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre} ({c.horaInicio})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Fecha</Label>
            <Input type="date" value={form.fecha} onChange={(e) => onFormChange({ ...form, fecha: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea value={form.notas} onChange={(e) => onFormChange({ ...form, notas: e.target.value })} placeholder="Notas adicionales..." rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSubmit} className="bg-emerald-500 hover:bg-emerald-600" disabled={!form.clienteId || !form.claseId}>
            Crear Reserva
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}