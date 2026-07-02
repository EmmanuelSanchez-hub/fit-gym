"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Percent, Calendar, Smartphone, Send, Edit, Trash2 } from "lucide-react";
import type { Promocion } from "../../types";

interface PromoCardProps {
  promo: Promocion;
  canEdit: boolean;
  canDelete: boolean;
  whatsappConnected: boolean;
  onSend: (promo: Promocion) => void;
  onEdit: (promo: Promocion) => void;
  onDelete: (id: string) => void;
}

function isActive(promo: Promocion) {
  const now = new Date();
  return new Date(promo.validoDesde) <= now && new Date(promo.validoHasta) >= now && promo.activo;
}

function getTipoBadge(tipo: string) {
  const tipos: Record<string, { color: string; label: string }> = {
    vencimiento_proximo: { color: "bg-amber-500/20 text-amber-600", label: "Vencimiento Próximo" },
    membresia_expirada: { color: "bg-red-500/20 text-red-600", label: "Membresía Expirada" },
    especial: { color: "bg-purple-500/20 text-purple-600", label: "Especial" },
    bienvenida: { color: "bg-emerald-500/20 text-emerald-600", label: "Bienvenida" },
  };
  const config = tipos[tipo] || tipos.especial;
  return <Badge className={config.color}>{config.label}</Badge>;
}

export function PromoCard({ promo, canEdit, canDelete, whatsappConnected, onSend, onEdit, onDelete }: PromoCardProps) {
  const active = isActive(promo);

  return (
    <Card className={`relative ${!active ? "opacity-60" : ""} overflow-hidden flex flex-col`}>
      <CardHeader className="pb-1.5 sm:pb-2 px-3 sm:px-6">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-sm sm:text-lg leading-tight truncate">{promo.titulo}</CardTitle>
            <div className="mt-1">{getTipoBadge(promo.tipo)}</div>
          </div>
          <Badge variant={active ? "default" : "secondary"} className={`shrink-0 text-[10px] sm:text-xs ${active ? "bg-emerald-500" : ""}`}>
            {active ? "Activa" : "Inactiva"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-3 sm:pb-4 px-3 sm:px-6 mt-auto space-y-2 sm:space-y-3">
        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-1 text-emerald-600">
            <Percent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="font-semibold">{promo.descuento}%</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-[11px] sm:text-sm">{new Date(promo.validoHasta).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-0.5 sm:gap-1">
            <Smartphone className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            {promo._count?.envios || 0} envíos
          </span>
          <div className="flex gap-0.5 sm:gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8"
              onClick={() => onSend(promo)} disabled={!active}
              title={whatsappConnected ? "Enviar por WhatsApp" : "Conecta WhatsApp primero"}>
              <Send className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${whatsappConnected ? 'text-green-500' : 'text-muted-foreground'}`} />
            </Button>
            {canEdit && (
              <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => onEdit(promo)}>
                <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
            )}
            {canDelete && (
              <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-red-500" onClick={() => onDelete(promo.id)}>
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}