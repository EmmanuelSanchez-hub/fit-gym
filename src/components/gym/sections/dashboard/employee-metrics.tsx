"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users2 } from "lucide-react";
import type { Empleado } from "../../types";

interface EmployeeMetricsProps {
  empleados: Empleado[];
}

export function EmployeeMetrics({ empleados }: EmployeeMetricsProps) {
  if (empleados.length === 0) return null;

  const maxActividades = Math.max(...empleados.map((e) =>
    (e._count?.clientesRegistrados || 0) + (e._count?.accesosRegistrados || 0) + (e._count?.reservasCreadas || 0)
  ), 1);

  return (
    <Card id="employee-metrics">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users2 className="w-5 h-5" />Métricas por Empleado</CardTitle>
        <CardDescription>Rendimiento del equipo este mes</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="flex items-center justify-between py-2 px-3 mb-4 bg-muted/50 rounded-lg text-sm font-medium text-muted-foreground min-w-[400px]">
          <span className="w-32 sm:w-40 flex-shrink-0">Empleado</span>
          <div className="flex gap-4 sm:gap-6">
            <span className="text-emerald-600 w-12 sm:w-16 text-center">Clientes</span>
            <span className="text-blue-600 w-12 sm:w-16 text-center">Accesos</span>
            <span className="text-amber-600 w-12 sm:w-16 text-center">Reservas</span>
          </div>
        </div>
        <div className="space-y-4 min-w-[400px]">
          {empleados.map((emp) => {
            const total = (emp._count?.clientesRegistrados || 0) + (emp._count?.accesosRegistrados || 0) + (emp._count?.reservasCreadas || 0);
            const progreso = (total / maxActividades) * 100;
            return (
              <div key={emp.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 w-32 sm:w-40 flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-emerald-600">{emp.nombre.split(" ").map(n => n[0]).join("")}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{emp.nombre}</p>
                      <p className="text-xs text-muted-foreground truncate">{emp.cargo}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 sm:gap-6 text-sm">
                    <span className="text-emerald-600 w-12 sm:w-16 text-center">{emp._count?.clientesRegistrados || 0}</span>
                    <span className="text-blue-600 w-12 sm:w-16 text-center">{emp._count?.accesosRegistrados || 0}</span>
                    <span className="text-amber-600 w-12 sm:w-16 text-center">{emp._count?.reservasCreadas || 0}</span>
                  </div>
                </div>
                <Progress value={progreso} className="h-2" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}