"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, BarChart3 } from "lucide-react";

interface ReportsTabProps {
  fechaInicio: string;
  fechaFin: string;
  isLoading: boolean;
  onFechaInicioChange: (v: string) => void;
  onFechaFinChange: (v: string) => void;
  onGenerate: () => void;
}

export function ReportsTab({
  fechaInicio, fechaFin, isLoading,
  onFechaInicioChange, onFechaFinChange, onGenerate,
}: ReportsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-500" />
          Reporte Gerencial
        </CardTitle>
        <CardDescription>
          Genera un reporte ejecutivo con métricas clave para la toma de decisiones
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Período Inicio</Label>
            <Input type="date" value={fechaInicio} onChange={(e) => onFechaInicioChange(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Período Fin</Label>
            <Input type="date" value={fechaFin} onChange={(e) => onFechaFinChange(e.target.value)} />
          </div>
        </div>

        <Button onClick={onGenerate} disabled={isLoading} className="w-full bg-emerald-500 hover:bg-emerald-600">
          {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BarChart3 className="w-4 h-4 mr-2" />}
          Generar Reporte Gerencial
        </Button>
      </CardContent>
    </Card>
  );
}