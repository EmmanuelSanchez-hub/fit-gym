"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, TrendingUp, DoorOpen, AlertCircle, CheckCircle } from "lucide-react";

interface ReporteGerencial {
  titulo: string;
  fechaGeneracion: string;
  periodo: { inicio: string; fin: string };
  metricasGenerales: {
    totalClientes: number;
    clientesNuevosPeriodo: number;
    crecimientoClientes: string;
    membresiasActivas: number;
    membresiasPorVencer: number;
    membresiasExpiradas: number;
    tasaRenovacion: string;
  };
  ingresos: {
    totalPeriodo: number;
    porPlan: Array<{ plan: string; cantidad: number; total: number }>;
    porMetodoPago: Array<{ metodo: string; cantidad: number; total: number }>;
  };
  actividad: {
    accesosPeriodo: number;
    reservasPeriodo: number;
    promedioAccesosDiario: string;
    tendenciaAccesos: Array<{ fecha: string; total: number }>;
  };
  recomendaciones: Array<{
    tipo: string;
    titulo: string;
    descripcion: string;
    accion: string;
  }>;
}

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reporte: ReporteGerencial | null;
}

export function ReportDialog({ open, onOpenChange, reporte }: ReportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{reporte?.titulo}</DialogTitle>
          <DialogDescription>Período: {reporte?.periodo.inicio} - {reporte?.periodo.fin}</DialogDescription>
        </DialogHeader>
        {reporte && (
          <ScrollArea className="h-[70vh] pr-4">
            <div className="space-y-6">
              {/* Métricas Generales */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-500" />Métricas Generales
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground">Total Clientes</p>
                    <p className="text-xl font-bold">{reporte.metricasGenerales.totalClientes}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-500/10">
                    <p className="text-xs text-muted-foreground">Nuevos del Período</p>
                    <p className="text-xl font-bold text-emerald-600">{reporte.metricasGenerales.clientesNuevosPeriodo}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground">Crecimiento</p>
                    <p className="text-xl font-bold">{reporte.metricasGenerales.crecimientoClientes}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground">Membresías Activas</p>
                    <p className="text-xl font-bold">{reporte.metricasGenerales.membresiasActivas}</p>
                  </div>
                </div>
              </div>

              {/* Ingresos */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />Ingresos del Período
                </h4>
                <div className="p-4 rounded-lg bg-emerald-500/10 mb-3">
                  <p className="text-sm text-muted-foreground">Total Ingresos</p>
                  <p className="text-3xl font-bold text-emerald-600">S/ {reporte.ingresos.totalPeriodo.toLocaleString()}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Por Plan</p>
                    <div className="space-y-2">
                      {reporte.ingresos.porPlan.map((p, i) => (
                        <div key={i} className="flex justify-between text-sm p-2 rounded bg-muted">
                          <span>{p.plan}</span>
                          <span className="font-medium">S/ {p.total.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Por Método de Pago</p>
                    <div className="space-y-2">
                      {reporte.ingresos.porMetodoPago.map((m, i) => (
                        <div key={i} className="flex justify-between text-sm p-2 rounded bg-muted">
                          <span>{m.metodo}</span>
                          <span className="font-medium">S/ {m.total.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actividad */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <DoorOpen className="w-4 h-4 text-emerald-500" />Actividad
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground">Accesos</p>
                    <p className="text-xl font-bold">{reporte.actividad.accesosPeriodo}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground">Reservas</p>
                    <p className="text-xl font-bold">{reporte.actividad.reservasPeriodo}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground">Promedio Diario</p>
                    <p className="text-xl font-bold">{reporte.actividad.promedioAccesosDiario}</p>
                  </div>
                </div>
              </div>

              {/* Alertas */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />Alertas
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs text-muted-foreground">Por Vencer (7 días)</p>
                    <p className="text-xl font-bold text-amber-600">{reporte.metricasGenerales.membresiasPorVencer}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-xs text-muted-foreground">Expiradas</p>
                    <p className="text-xl font-bold text-red-600">{reporte.metricasGenerales.membresiasExpiradas}</p>
                  </div>
                </div>
              </div>

              {/* Recomendaciones */}
              {reporte.recomendaciones.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />Recomendaciones
                  </h4>
                  <div className="space-y-2">
                    {reporte.recomendaciones.map((rec, i) => (
                      <div key={i} className={`p-3 rounded-lg border ${rec.tipo === 'urgente' ? 'bg-red-500/5 border-red-500/20' : rec.tipo === 'importante' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-blue-500/5 border-blue-500/20'}`}>
                        <div className="flex items-start gap-2">
                          <Badge variant="outline" className={rec.tipo === 'urgente' ? 'border-red-500 text-red-600' : rec.tipo === 'importante' ? 'border-amber-500 text-amber-600' : 'border-blue-500 text-blue-600'}>
                            {rec.tipo}
                          </Badge>
                          <div>
                            <p className="font-medium">{rec.titulo}</p>
                            <p className="text-sm text-muted-foreground">{rec.descripcion}</p>
                            <p className="text-sm font-medium mt-1">💡 {rec.accion}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}