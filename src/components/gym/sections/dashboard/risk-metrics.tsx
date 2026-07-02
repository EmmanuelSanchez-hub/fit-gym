"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ShieldCheck, UserMinus } from "lucide-react";

interface RiskMetricsProps {
  tasaRetencion: number;
  clientesEnRiesgo: number;
  membresiasActivas: number;
}

export function RiskMetrics({ tasaRetencion, clientesEnRiesgo, membresiasActivas }: RiskMetricsProps) {
  const riesgoPct = membresiasActivas > 0 ? Math.round((clientesEnRiesgo / membresiasActivas) * 100) : 0;
  const retencionColor = tasaRetencion >= 80 ? "emerald" : tasaRetencion >= 60 ? "amber" : "red";
  const riesgoColor = riesgoPct <= 10 ? "emerald" : riesgoPct <= 25 ? "amber" : "red";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Tasa de Retención */}
      <Card className={`bg-gradient-to-br from-${retencionColor}-500/10 to-${retencionColor}-600/5 border-${retencionColor}-500/20`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <ShieldCheck className={`w-4 h-4 text-${retencionColor}-600`} />
            Tasa de Retención (60 días)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold text-${retencionColor}-600`}>{tasaRetencion}%</span>
            <span className="text-sm text-muted-foreground">de clientes renuevan</span>
          </div>
          <Progress value={tasaRetencion} className={`h-2 [&>div]:bg-${retencionColor}-500`} />
          {tasaRetencion < 70 && (
            <p className="text-xs text-amber-600">⚠️ Por debajo del objetivo (70%). Revisar estrategia de fidelización.</p>
          )}
        </CardContent>
      </Card>

      {/* Clientes en Riesgo */}
      <Card className={`bg-gradient-to-br from-${riesgoColor}-500/10 to-${riesgoColor}-600/5 border-${riesgoColor}-500/20`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <UserMinus className={`w-4 h-4 text-${riesgoColor}-600`} />
            Clientes en Riesgo (15+ días sin ir)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold text-${riesgoColor}-600`}>{clientesEnRiesgo}</span>
            <span className="text-sm text-muted-foreground">de {membresiasActivas} ({riesgoPct}%)</span>
          </div>
          <Progress value={Math.min(riesgoPct * 2, 100)} className={`h-2 [&>div]:bg-${riesgoColor}-500`} />
          {riesgoPct > 20 && (
            <p className="text-xs text-red-600">⚠️ Más del 20% en riesgo. Activar campaña de reactivación.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}