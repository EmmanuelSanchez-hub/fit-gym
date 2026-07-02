"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Clock } from "lucide-react";

interface HourlyChartProps {
  accesosPorHora: { hora: string; accesos: number }[];
}

export function HourlyChart({ accesosPorHora }: HourlyChartProps) {
  const maxAcceso = Math.max(...accesosPorHora.map((a) => a.accesos), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-500" />Accesos por Hora (Hoy)
        </CardTitle>
        <CardDescription>Distribución horaria de accesos para identificar horas pico</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={accesosPorHora}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="hora" className="text-xs" interval={2} />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                formatter={(value: number) => [`${value} accesos`, "Cantidad"]}
              />
              <Bar dataKey="accesos" radius={[4, 4, 0, 0]} name="Accesos">
                {accesosPorHora.map((entry, index) => (
                  <rect key={`cell-${index}`} fill={entry.accesos > maxAcceso * 0.7 ? "#ef4444" : entry.accesos > maxAcceso * 0.4 ? "#f59e0b" : "#10b981"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          🟢 Normal &nbsp; 🟡 Moderado &nbsp; 🔴 Hora pico
        </p>
      </CardContent>
    </Card>
  );
}