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
      <CardContent>
        <div className="flex items-center justify-between py-2 px-2 sm:px-3 mb-3 sm:mb-4 bg-muted/50 rounded-lg text-xs sm:text-sm font-medium text-muted-foreground">
          <span className="w-24 sm:w-40 flex-shrink-0">Empleado</span>
          <div className="flex gap-2 sm:gap-6">
            <span className="text-emerald-600 w-10 sm:w-16 text-center">Cli.</span>
            <span className="text-blue-600 w-10 sm:w-16 text-center">Acc.</span>
            <span className="text-amber-600 w-10 sm:w-16 text-center">Res.</span>
          </div>
        </div>
        <div className="space-y-3 sm:space-y-4">
          {empleados.map((emp) => {
            const total = (emp._count?.clientesRegistrados || 0) + (emp._count?.accesosRegistrados || 0) + (emp._count?.reservasCreadas || 0);
            const progreso = (total / maxActividades) * 100;
            return (
              <div key={emp.id} className="space-y-1 sm:space-y-2">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 sm:gap-2 w-24 sm:w-40 flex-shrink-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs sm:text-sm font-medium text-emerald-600">{emp.nombre.split(" ").map(n => n[0]).join("")}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-xs sm:text-sm truncate">{emp.nombre}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{emp.cargo}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 sm:gap-6 text-xs sm:text-sm">
                    <span className="text-emerald-600 w-10 sm:w-16 text-center">{emp._count?.clientesRegistrados || 0}</span>
                    <span className="text-blue-600 w-10 sm:w-16 text-center">{emp._count?.accesosRegistrados || 0}</span>
                    <span className="text-amber-600 w-10 sm:w-16 text-center">{emp._count?.reservasCreadas || 0}</span>
                  </div>
                </div>
                <Progress value={progreso} className="h-1.5 sm:h-2" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}