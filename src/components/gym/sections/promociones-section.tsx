"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Megaphone, Plus, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { WhatsAppConnection } from "../whatsapp-connection";
import { PromoCard } from "./promociones/promo-card";
import { PromoDialog } from "./promociones/promo-dialog";
import { SendDialog } from "./promociones/send-dialog";
import type { Promocion, Cliente, AuthUser } from "../types";

interface PromoActivation {
  clienteId: string;
  tipo: "membresia_expirada" | "vencimiento_proximo";
}

interface PromocionesSectionProps {
  promociones: Promocion[];
  clientes: Cliente[];
  user: AuthUser;
  onRefresh?: () => void;
  activation?: PromoActivation | null;
  onActivationHandled?: () => void;
}

const INITIAL_FORM = {
  titulo: "",
  tipo: "especial",
  descuento: "",
  validoDesde: new Date().toISOString().split("T")[0],
  validoHasta: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  plantillaWhatsApp: "",
};

export function PromocionesSection({ promociones, clientes, user, onRefresh, activation, onActivationHandled }: PromocionesSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [selectedPromocion, setSelectedPromocion] = useState<Promocion | null>(null);
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  // Store pre-selected client ID from activation
  const [preSelectedCliente, setPreSelectedCliente] = useState<string | undefined>(undefined);

  // Handle activation from dashboard
  useEffect(() => {
    if (!activation) return;

    const { clienteId, tipo } = activation;

    // Buscar si ya existe una promoción de este tipo
    const existente = promociones.find(p => p.tipo === tipo);

    if (existente) {
      // Usar la promoción existente y abrir el diálogo de envío
      setSelectedPromocion(existente);
      setPreSelectedCliente(clienteId);
      setShowSendDialog(true);
      onActivationHandled?.();
      return;
    }

    // Si no existe, crear una nueva del tipo correcto
    const now = new Date();
    const hasta = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const data = {
      titulo: tipo === "vencimiento_proximo"
        ? "Renovación - Membresía por Vencer"
        : "Reactivación - Membresía Expirada",
      tipo,
      descuento: 15,
      validoDesde: now,
      validoHasta: hasta,
      plantillaWhatsApp: null as string | null,
    };

    fetch("/api/promociones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then(res => res.json())
      .then(promo => {
        setSelectedPromocion(promo);
        setPreSelectedCliente(clienteId);
        setShowSendDialog(true);
        onActivationHandled?.();
        onRefresh?.();
      })
      .catch(() => {
        toast({ title: "Error", description: "No se pudo crear la promoción", variant: "destructive" });
        onActivationHandled?.();
      });
  }, [activation, promociones]);

  const canCreate = user.rol === 'SUPER_USUARIO' || user.rol === 'ADMINISTRADOR';
  const canEdit = canCreate;
  const canDelete = canCreate;

  const handleSave = async () => {
    if (!form.titulo || !form.descuento) {
      toast({ title: "Error", description: "Complete todos los campos obligatorios", variant: "destructive" });
      return;
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

      let res;
      if (selectedPromocion) {
        res = await fetch(`/api/promociones/${selectedPromocion.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } else {
        res = await fetch("/api/promociones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }

      if (res.ok) {
        toast({ title: "Éxito", description: selectedPromocion ? "Promoción actualizada" : "Promoción creada" });
        setShowDialog(false);
        setForm(INITIAL_FORM);
        onRefresh?.();
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.error || "No se pudo guardar", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Error al guardar promoción", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/promociones/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Promoción eliminada", description: "La promoción ha sido eliminada" });
        onRefresh?.();
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.error || "No se pudo eliminar", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Error al eliminar promoción", variant: "destructive" });
    }
  };

  const openSendDialog = (promo: Promocion) => {
    setSelectedPromocion(promo);
    setShowSendDialog(true);
  };

  const handleSendPromotion = async (clienteIds: string[]) => {
    if (!selectedPromocion) return;

    // Verificar estado real de WhatsApp antes de enviar
    try {
      const statusRes = await fetch("/api/whatsapp/status");
      const statusData = await statusRes.json();
      if (!statusData.connected) {
        toast({ title: "WhatsApp desconectado", description: "Conéctalo primero usando el botón de arriba", variant: "destructive" });
        return;
      }
    } catch {
      toast({ title: "Error", description: "No se pudo verificar WhatsApp", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "promotion",
          promocionId: selectedPromocion.id,
          clienteIds,
        }),
      });

      const result = await res.json();

      if (result.success) {
        toast({
          title: "Éxito",
          description: `Promoción enviada a ${result.sent} clientes${result.failed > 0 ? ` (${result.failed} fallidos)` : ''}`,
        });
        setShowSendDialog(false);
        onRefresh?.();
      } else {
        toast({ title: "Error", description: result.error || "No se pudo enviar la promoción", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Error al enviar promoción", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const openCreateDialog = () => {
    if (!canCreate) {
      toast({ title: "Sin permisos", description: "No tiene permisos para crear promociones", variant: "destructive" });
      return;
    }
    setSelectedPromocion(null);
    setForm(INITIAL_FORM);
    setShowDialog(true);
  };

  const openEditDialog = (promo: Promocion) => {
    if (!canEdit) {
      toast({ title: "Sin permisos", description: "No tiene permisos para editar promociones", variant: "destructive" });
      return;
    }
    setSelectedPromocion(promo);
    setForm({
      titulo: promo.titulo,
      tipo: promo.tipo,
      descuento: promo.descuento.toString(),
      validoDesde: new Date(promo.validoDesde).toISOString().split("T")[0],
      validoHasta: new Date(promo.validoHasta).toISOString().split("T")[0],
      plantillaWhatsApp: promo.plantillaWhatsApp || "",
    });
    setShowDialog(true);
  };

  const filteredPromociones = promociones.filter(
    (p) => p.titulo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Megaphone className="w-5 h-5" />
            Promociones
          </h2>
          <p className="text-muted-foreground text-sm">
            Gestiona y envía promociones por WhatsApp
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar promociones..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {canCreate && (
            <Button className="bg-emerald-500 hover:bg-emerald-600" onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva
            </Button>
          )}
        </div>
      </div>

      {/* WhatsApp Connection Card */}
      <WhatsAppConnection onConnectionChange={setWhatsappConnected} />

      {/* Promociones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="promociones-list">
        {filteredPromociones.map((promo) => (
          <PromoCard
            key={promo.id}
            promo={promo}
            canEdit={canEdit}
            canDelete={canDelete}
            whatsappConnected={whatsappConnected}
            onSend={openSendDialog}
            onEdit={openEditDialog}
            onDelete={handleDelete}
          />
        ))}

        {filteredPromociones.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No hay promociones</h3>
            <p className="text-muted-foreground">Crea tu primera promoción para enviar a los clientes</p>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <PromoDialog
        open={showDialog}
        editing={selectedPromocion}
        form={form}
        onOpenChange={setShowDialog}
        onFormChange={setForm}
        onSave={handleSave}
      />

      {/* Send Dialog */}
      <SendDialog
        open={showSendDialog}
        promo={selectedPromocion}
        clientes={clientes}
        whatsappConnected={whatsappConnected}
        sending={sending}
        preSelectedClienteId={preSelectedCliente}
        onOpenChange={setShowSendDialog}
        onSend={handleSendPromotion}
      />
    </motion.div>
  );
}