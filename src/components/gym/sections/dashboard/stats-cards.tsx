"use client";

import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Users, CreditCard, UserCheck, TrendingUp } from "lucide-react";

interface StatsCardsProps {
  totalClientes: number;
  clientesNuevos: number;
  membresiasActivas: number;
  membresiasPorVencer: number;
  accesosHoy: number;
  reservasHoy: number;
  ingresosMes: number;
}

export function StatsCards({ totalClientes, clientesNuevos, membresiasActivas, membresiasPorVencer, accesosHoy, reservasHoy, ingresosMes }: StatsCardsProps) {
  const cards = [
    { icon: Users, color: "emerald", title: "Total Clientes", value: totalClientes, sub: `+${clientesNuevos} este mes` },
    { icon: CreditCard, color: "blue", title: "Membresías Activas", value: membresiasActivas, sub: `${membresiasPorVencer} por vencer` },
    { icon: UserCheck, color: "amber", title: "Accesos Hoy", value: accesosHoy, sub: `${reservasHoy} reservas hoy` },
    { icon: TrendingUp, color: "purple", title: "Ingresos del Mes", value: `S/ ${ingresosMes.toLocaleString()}`, sub: "Total recaudado" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="stats-cards">
      {cards.map((c) => (
        <Card key={c.title} className={`bg-gradient-to-br from-${c.color}-500/10 to-${c.color}-600/5 border-${c.color}-500/20`}>
          <CardHeader className="pb-2">
            <CardDescription className={`flex items-center gap-2 text-${c.color}-600`}>
              <c.icon className="w-4 h-4" />{c.title}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold text-${c.color}-600`}>{c.value}</div>
            <p className="text-sm text-muted-foreground">{c.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}