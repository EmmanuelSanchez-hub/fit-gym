"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Megaphone, Plus, Search } from "lucide-react";
import { WhatsAppConnection } from "../whatsapp-connection";
import { PromoCard } from "./promociones/promo-card";
import { PromoDialog } from "./promociones/promo-dialog";
import { SendDialog } from "./promociones/send-dialog";
import { usePromociones } from "@/hooks/use-promociones";
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
  titulo: "", tipo: "especial", descuento: "",
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
  const [preSelectedCliente, setPreSelectedCliente] = useState<string | undefined>(undefined);

  const { savePromocion, deletePromocion, sendPromocion, createQuickPromotion } = usePromociones({ onRefresh });

  const canCreate = user.rol === 'SUPER_USUARIO' || user.rol === 'ADMINISTRADOR';
  const canEdit = canCreate;
  const canDelete = canCreate;

  // Derivar estado de activación (patrón estándar React)
  // Cuando activation cambia, calculamos el resultado sincrónicamente
  // y lo pasamos directamente al diálogo sin estado intermedio
  const activationState = useMemo(() => {
    if (!activation) return null;
    const existente = promociones.find(p => p.tipo === activation.tipo);
    return { clienteId: activation.clienteId, promocion: existente, tipo: activation.tipo };
  }, [activation, promociones]);

  const activationHandledRef = useRef(false);

  // Efecto único para abrir el diálogo cuando hay activación
  useEffect(() => {
    if (!activationState || activationHandledRef.current) return;
    activationHandledRef.current = true;

    if (activationState.promocion) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- patrón estándar para abrir diálogos desde props
      setSelectedPromocion(activationState.promocion);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreSelectedCliente(activationState.clienteId);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowSendDialog(true);
      onActivationHandled?.();
      return;
    }

    createQuickPromotion(activationState.tipo).then(promo => {
      if (promo) {
        setSelectedPromocion(promo);
        setPreSelectedCliente(activationState.clienteId);
        setShowSendDialog(true);
      }
      onActivationHandled?.();
    });
  }, [activationState, createQuickPromotion, onActivationHandled]);

  const handleSave = async () => {
    const ok = await savePromocion(form, selectedPromocion);
    if (ok) { setShowDialog(false); setForm(INITIAL_FORM); }
  };

  const handleDelete = async (id: string) => { await deletePromocion(id); };

  const handleSendPromotion = async (clienteIds: string[]) => {
    if (!selectedPromocion) return;
    setSending(true);
    const ok = await sendPromocion(selectedPromocion.id, clienteIds);
    if (ok) setShowSendDialog(false);
    setSending(false);
  };

  const openCreateDialog = () => { setSelectedPromocion(null); setForm(INITIAL_FORM); setShowDialog(true); };

  const openEditDialog = (promo: Promocion) => {
    setSelectedPromocion(promo);
    setForm({
      titulo: promo.titulo, tipo: promo.tipo, descuento: promo.descuento.toString(),
      validoDesde: new Date(promo.validoDesde).toISOString().split("T")[0],
      validoHasta: new Date(promo.validoHasta).toISOString().split("T")[0],
      plantillaWhatsApp: promo.plantillaWhatsApp || "",
    });
    setShowDialog(true);
  };

  const filtered = promociones.filter(p => p.titulo.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center justify-between">
        <div>
          <p className="text-xs sm:text-sm text-muted-foreground">Gestiona y envía promociones por WhatsApp</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
            <Input placeholder="Buscar..." className="pl-7 sm:pl-10 h-8 sm:h-9 text-xs sm:text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          {canCreate && (
            <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 h-8 sm:h-9 text-xs sm:text-sm" onClick={openCreateDialog}>
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />Nueva
            </Button>
          )}
        </div>
      </div>

      <WhatsAppConnection onConnectionChange={setWhatsappConnected} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4" id="promociones-list">
        {filtered.map(promo => (
          <PromoCard key={promo.id} promo={promo} canEdit={canEdit} canDelete={canDelete}
            whatsappConnected={whatsappConnected}
            onSend={(p) => { setSelectedPromocion(p); setShowSendDialog(true); }}
            onEdit={openEditDialog} onDelete={handleDelete} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No hay promociones</h3>
            <p className="text-muted-foreground">Crea tu primera promoción para enviar a los clientes</p>
          </div>
        )}
      </div>

      <PromoDialog open={showDialog} editing={selectedPromocion} form={form} onOpenChange={setShowDialog} onFormChange={setForm} onSave={handleSave} />

      <SendDialog open={showSendDialog} promo={selectedPromocion} clientes={clientes}
        whatsappConnected={whatsappConnected} sending={sending} preSelectedClienteId={preSelectedCliente}
        onOpenChange={setShowSendDialog} onSend={handleSendPromotion} />
    </motion.div>
  );
}