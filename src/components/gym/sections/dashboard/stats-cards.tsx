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
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4" id="stats-cards">
      {cards.map((c) => (
        <Card key={c.title} className={`bg-gradient-to-br from-${c.color}-500/10 to-${c.color}-600/5 border-${c.color}-500/20 overflow-hidden`}>
          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6">
            <CardDescription className={`flex items-center gap-1 sm:gap-2 text-${c.color}-600 text-xs sm:text-sm`}>
              <c.icon className="w-3 h-3 sm:w-4 sm:h-4" />{c.title}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className={`text-xl sm:text-2xl lg:text-3xl font-bold text-${c.color}-600 truncate`}>{c.value}</div>
            <p className="text-[10px] sm:text-sm text-muted-foreground truncate">{c.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}