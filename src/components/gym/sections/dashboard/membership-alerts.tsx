"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Calendar, XCircle, CheckCircle, Phone, Mail, MessageSquare } from "lucide-react";

interface AlertaMembresia {
  id: string;
  fechaFin: string;
  cliente: { id: string; nombre: string; apellido: string; telefono: string; email: string };
  membresia: { nombre: string };
  contactoReciente?: { fecha: string; estado: string; haceDias: number } | null;
}

interface MembershipAlertsProps {
  clientesPorVencer: AlertaMembresia[];
  clientesExpirados: AlertaMembresia[];
  formatDate: (d: string | Date) => string;
  getDiasRestantes: (d: string | Date) => number;
  onSendPromotion?: (clienteId: string, tipoAlerta: "vencer" | "expirado") => void;
}

function ClienteFila({
  item, tipo, formatDate, getDiasRestantes, onSendPromotion,
}: {
  item: AlertaMembresia; tipo: "vencer" | "expirado";
  formatDate: (d: string | Date) => string; getDiasRestantes: (d: string | Date) => number;
  onSendPromotion?: (clienteId: string, tipoAlerta: "vencer" | "expirado") => void;
}) {
  const dias = Math.abs(getDiasRestantes(item.fechaFin));
  const fueContactado = item.contactoReciente && item.contactoReciente.haceDias < 2;
  const puedeContactar = !fueContactado;
  const color = tipo === "vencer" ? "amber" : "red";
  const Icono = tipo === "vencer" ? Calendar : XCircle;

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg bg-background/50 border border-${color}-500/20`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full bg-${color}-500/20 flex items-center justify-center`}>
          <Icono className={`w-5 h-5 text-${color}-600`} />
        </div>
        <div>
          <p className="font-medium">{item.cliente.nombre} {item.cliente.apellido}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{item.membresia.nombre}</span><span>•</span>
            <span className={`text-${color}-600 font-medium`}>
              {tipo === "vencer" ? `${dias} días restantes` : `Vencido hace ${dias} días`}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {item.contactoReciente ? (
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/10 text-emerald-600 text-xs">
            <CheckCircle className="w-3 h-3" />
            <span>Contactado{item.contactoReciente.haceDias === 0 ? ' hoy' : ` hace ${item.contactoReciente.haceDias}d`}</span>
          </div>
        ) : tipo === "expirado" ? (
          <div className="flex flex-col items-end gap-1">
            <Badge variant="destructive">{formatDate(item.fechaFin)}</Badge>
            <div className="flex gap-1">
              <a href={`tel:${item.cliente.telefono}`} className="p-1 rounded hover:bg-red-500/10"><Phone className="w-3 h-3 text-muted-foreground" /></a>
              <a href={`mailto:${item.cliente.email}`} className="p-1 rounded hover:bg-red-500/10"><Mail className="w-3 h-3 text-muted-foreground" /></a>
            </div>
          </div>
        ) : (
          <Badge variant="outline" className="border-amber-500/50 text-amber-600">{formatDate(item.fechaFin)}</Badge>
        )}
        {onSendPromotion && (
          <Button size="sm" variant="ghost"
            className={puedeContactar ? `text-${color}-600 hover:text-${color}-700 hover:bg-${color}-500/10` : "text-muted-foreground cursor-not-allowed opacity-50"}
            onClick={() => puedeContactar && onSendPromotion(item.cliente.id, tipo)}
            disabled={!puedeContactar}
            title={puedeContactar ? "Enviar mensaje" : "Espera 2 días para volver a contactar"}
          >
            <MessageSquare className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function MembershipAlerts({ clientesPorVencer, clientesExpirados, formatDate, getDiasRestantes, onSendPromotion }: MembershipAlertsProps) {
  return (
    <>
      {clientesPorVencer.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5" id="alerts-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600"><AlertTriangle className="w-5 h-5" />Membresías por Vencer ({clientesPorVencer.length})</CardTitle>
            <CardDescription>Clientes con membresías que expiran en los próximos 7 días</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {clientesPorVencer.map((m) => <ClienteFila key={m.id} item={m} tipo="vencer" formatDate={formatDate} getDiasRestantes={getDiasRestantes} onSendPromotion={onSendPromotion} />)}
            </div>
          </CardContent>
        </Card>
      )}
      {clientesExpirados.length > 0 && (
        <Card className="border-red-500/50 bg-red-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600"><XCircle className="w-5 h-5" />Membresías Expiradas ({clientesExpirados.length})</CardTitle>
            <CardDescription>Clientes con membresías vencidas que requieren renovación</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {clientesExpirados.map((m) => <ClienteFila key={m.id} item={m} tipo="expirado" formatDate={formatDate} getDiasRestantes={getDiasRestantes} onSendPromotion={onSendPromotion} />)}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}