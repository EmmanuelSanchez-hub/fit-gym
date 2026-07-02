"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Send, Loader2, XCircle } from "lucide-react";
import type { Promocion, Cliente } from "../../types";

interface SendDialogProps {
  open: boolean;
  promo: Promocion | null;
  clientes: Cliente[];
  whatsappConnected: boolean;
  sending: boolean;
  preSelectedClienteId?: string;
  onOpenChange: (open: boolean) => void;
  onSend: (clienteIds: string[]) => void;
}

/** Verifica si una membresía está activa (case-insensitive) */
function esMembresiaActiva(estado: string): boolean {
  return estado.toLowerCase() === "activa";
}

function getClientesFiltrados(clientes: Cliente[], tipoPromocion: string) {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  switch (tipoPromocion) {
    case "bienvenida":
      // Clientes que NO tienen ninguna membresía asignada
      return clientes.filter(c => {
        if (!c.telefono) return false;
        return !c.membresias || c.membresias.length === 0;
      });

    case "vencimiento_proximo":
      // Clientes con membresía activa que vence en los próximos 7 días
      return clientes.filter(c => {
        if (!c.telefono) return false;
        return c.membresias?.some(m => {
          if (!esMembresiaActiva(m.estado)) return false;
          const fechaFin = new Date(m.fechaFin);
          return fechaFin <= sevenDaysFromNow && fechaFin >= now;
        });
      });

    case "membresia_expirada":
      // Clientes con membresía expirada Y SIN otra membresía activa (no molestar a los que ya renovaron)
      return clientes.filter(c => {
        if (!c.telefono) return false;
        const tieneActiva = c.membresias?.some(m => esMembresiaActiva(m.estado) && new Date(m.fechaFin) >= now);
        if (tieneActiva) return false; // ya renovó, no está expirado realmente
        return c.membresias?.some(m => {
          const fechaFin = new Date(m.fechaFin);
          return fechaFin < now;
        });
      });

    default:
      // Especial: todos los clientes con teléfono
      return clientes.filter(c => c.telefono);
  }
}

export function SendDialog({ open, promo, clientes, whatsappConnected, sending, preSelectedClienteId, onOpenChange, onSend }: SendDialogProps) {
  const [selectedClientes, setSelectedClientes] = useState<Set<string>>(new Set());

  // Auto-select the pre-selected client when dialog opens
  useEffect(() => {
    if (open && preSelectedClienteId) {
      setSelectedClientes(new Set([preSelectedClienteId]));
    }
  }, [open, preSelectedClienteId]);

  // Reset selection when dialog closes
  const handleOpenChange = (open: boolean) => {
    if (!open) setSelectedClientes(new Set());
    onOpenChange(open);
  };

  const clientesFiltrados = promo ? getClientesFiltrados(clientes, promo.tipo) : [];

  const toggleCliente = (clienteId: string) => {
    const newSelected = new Set(selectedClientes);
    if (newSelected.has(clienteId)) {
      newSelected.delete(clienteId);
    } else {
      newSelected.add(clienteId);
    }
    setSelectedClientes(newSelected);
  };

  const selectAllClientes = () => {
    if (selectedClientes.size === clientesFiltrados.length) {
      setSelectedClientes(new Set());
    } else {
      setSelectedClientes(new Set(clientesFiltrados.map(c => c.id)));
    }
  };

  const tipoInfo: Record<string, string> = {
    bienvenida: "📋 Clientes sin membresía activa",
    vencimiento_proximo: "⏰ Clientes con membresía por vencer (7 días)",
    membresia_expirada: "❌ Clientes con membresía expirada",
    especial: "✨ Todos los clientes con teléfono",
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-green-500" />
            Enviar Promoción por WhatsApp
          </DialogTitle>
          <DialogDescription>
            Selecciona los clientes a quienes enviar "{promo?.titulo}"
          </DialogDescription>
        </DialogHeader>

        {!whatsappConnected && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800">
            <XCircle className="w-5 h-5 text-amber-500" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              WhatsApp no está conectado. Conéctalo primero arriba.
            </p>
          </div>
        )}

        <div className="py-4">
          {promo && (
            <div className="mb-3 p-2 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground">
                {tipoInfo[promo.tipo] || "✨ Todos los clientes con teléfono"}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">
              {selectedClientes.size} de {clientesFiltrados.length} clientes seleccionados
            </p>
            <Button variant="outline" size="sm" onClick={selectAllClientes}>
              {selectedClientes.size === clientesFiltrados.length ? "Deseleccionar todos" : "Seleccionar todos"}
            </Button>
          </div>

          <ScrollArea className="h-64 border rounded-lg">
            <div className="p-2 space-y-1">
              {clientesFiltrados.map((cliente) => (
                <label
                  key={cliente.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                >
                  <Checkbox
                    checked={selectedClientes.has(cliente.id)}
                    onCheckedChange={() => toggleCliente(cliente.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{cliente.nombre} {cliente.apellido}</p>
                    <p className="text-xs text-muted-foreground">{cliente.telefono}</p>
                  </div>
                </label>
              ))}

              {clientesFiltrados.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No hay clientes que cumplan los criterios para esta promoción</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => onSend(Array.from(selectedClientes))}
            disabled={sending || !whatsappConnected || selectedClientes.size === 0}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar ({selectedClientes.size})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Re-export for parent use
export { getClientesFiltrados };