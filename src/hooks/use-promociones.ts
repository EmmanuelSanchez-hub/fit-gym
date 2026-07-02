"use client";

import { useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import type { Promocion } from "@/components/gym/types";

interface UsePromocionesProps {
  onRefresh?: () => void;
}

export function usePromociones({ onRefresh }: UsePromocionesProps) {
  const checkWhatsAppStatus = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/whatsapp/status");
      const data = await res.json();
      if (!data.connected) {
        toast({ title: "WhatsApp desconectado", description: "Conéctalo primero usando el botón de arriba", variant: "destructive" });
        return false;
      }
      return true;
    } catch {
      toast({ title: "Error", description: "No se pudo verificar WhatsApp", variant: "destructive" });
      return false;
    }
  }, []);

  const savePromocion = useCallback(async (form: {
    titulo: string;
    tipo: string;
    descuento: string;
    validoDesde: string;
    validoHasta: string;
    plantillaWhatsApp: string;
  }, editing: Promocion | null): Promise<boolean> => {
    if (!form.titulo || !form.descuento) {
      toast({ title: "Error", description: "Complete todos los campos obligatorios", variant: "destructive" });
      return false;
    }

    try {
      const data = {
        titulo: form.titulo,
        tipo: form.tipo,
        descuento: parseFloat(form.descuento),
        validoDesde: new Date(form.validoDesde),
        validoHasta: new Date(form.validoHasta),
        plantillaWhatsApp: form.plantillaWhatsApp || null,
      };

      const res = editing
        ? await fetch(`/api/promociones/${editing.id}`, {
            method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
          })
        : await fetch("/api/promociones", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
          });

      if (res.ok) {
        toast({ title: "Éxito", description: editing ? "Promoción actualizada" : "Promoción creada" });
        onRefresh?.();
        return true;
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.error || "No se pudo guardar", variant: "destructive" });
        return false;
      }
    } catch {
      toast({ title: "Error", description: "Error al guardar promoción", variant: "destructive" });
      return false;
    }
  }, [onRefresh]);

  const deletePromocion = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/promociones/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Promoción eliminada", description: "La promoción ha sido eliminada" });
        onRefresh?.();
        return true;
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.error || "No se pudo eliminar", variant: "destructive" });
        return false;
      }
    } catch {
      toast({ title: "Error", description: "Error al eliminar promoción", variant: "destructive" });
      return false;
    }
  }, [onRefresh]);

  const sendPromocion = useCallback(async (promoId: string, clienteIds: string[]): Promise<boolean> => {
    const isConnected = await checkWhatsAppStatus();
    if (!isConnected) return false;

    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "promotion", promocionId: promoId, clienteIds }),
      });
      const result = await res.json();

      if (result.success) {
        toast({
          title: "Éxito",
          description: `Promoción enviada a ${result.sent} clientes${result.failed > 0 ? ` (${result.failed} fallidos)` : ''}`,
        });
        onRefresh?.();
        return true;
      } else {
        toast({ title: "Error", description: result.error || "No se pudo enviar la promoción", variant: "destructive" });
        return false;
      }
    } catch {
      toast({ title: "Error", description: "Error al enviar promoción", variant: "destructive" });
      return false;
    }
  }, [onRefresh, checkWhatsAppStatus]);

  const createQuickPromotion = useCallback(async (
    tipo: "membresia_expirada" | "vencimiento_proximo"
  ): Promise<Promocion | null> => {
    const now = new Date();
    const hasta = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const data = {
      titulo: tipo === "vencimiento_proximo" ? "Renovación - Membresía por Vencer" : "Reactivación - Membresía Expirada",
      tipo,
      descuento: 15,
      validoDesde: now,
      validoHasta: hasta,
      plantillaWhatsApp: null as string | null,
    };

    try {
      const res = await fetch("/api/promociones", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      const promo = await res.json();
      onRefresh?.();
      return promo;
    } catch {
      toast({ title: "Error", description: "No se pudo crear la promoción", variant: "destructive" });
      return null;
    }
  }, [onRefresh]);

  return { savePromocion, deletePromocion, sendPromocion, checkWhatsAppStatus, createQuickPromotion };
}