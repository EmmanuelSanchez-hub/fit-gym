"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { CHART_COLORS } from "../../constants";

interface ChartsRowProps {
  accesosPorDia: { fecha: string; dia: string; accesos: number }[];
  membresiasConCount: { nombre: string; count: number }[];
  userRol: string;
}

export function ChartsRow({ accesosPorDia, membresiasConCount, userRol }: ChartsRowProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      <Card id="access-chart">
        <CardHeader className="pb-2 sm:pb-6">
          <CardTitle className="text-sm sm:text-lg">Accesos de la Semana</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {userRol === "SUPER_USUARIO" || userRol === "ADMINISTRADOR"
              ? "Todos los accesos del gimnasio" : "Accesos validados por ti"}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={accesosPorDia}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="dia" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                <Bar dataKey="accesos" fill="#10b981" radius={[4, 4, 0, 0]} name="Accesos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 sm:pb-6">
          <CardTitle className="text-sm sm:text-lg">Distribución de Membresías</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Clientes por tipo de plan</CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={membresiasConCount} dataKey="count" nameKey="nombre" cx="50%" cy="50%" outerRadius={80} label={({ nombre, count }) => `${nombre}: ${count}`}>
                  {membresiasConCount.map((_, i) => <Cell key={`cell-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}