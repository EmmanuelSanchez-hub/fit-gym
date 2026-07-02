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
    <Card className={`relative ${!active ? "opacity-60" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{promo.titulo}</CardTitle>
            <div className="mt-1">{getTipoBadge(promo.tipo)}</div>
          </div>
          <Badge variant={active ? "default" : "secondary"} className={active ? "bg-emerald-500" : ""}>
            {active ? "Activa" : "Inactiva"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-emerald-600">
            <Percent className="w-4 h-4" />
            <span className="font-semibold">{promo.descuento}%</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{new Date(promo.validoHasta).toLocaleDateString("es-ES")}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Smartphone className="w-3 h-3" />
            {promo._count?.envios || 0} envíos
          </span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onSend(promo)}
              disabled={!active}
              title={whatsappConnected ? "Enviar por WhatsApp" : "Conecta WhatsApp primero"}
            >
              <Send className={`w-4 h-4 ${whatsappConnected ? 'text-green-500' : 'text-muted-foreground'}`} />
            </Button>
            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit(promo)}
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500"
                onClick={() => onDelete(promo.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}