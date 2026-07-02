"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, AlertTriangle, X } from "lucide-react";
import type { Clase, Reserva } from "../../types";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const HORA_INICIO_CALENDARIO = 5;
const HORA_FIN_CALENDARIO = 22;
const TOTAL_HORAS = HORA_FIN_CALENDARIO - HORA_INICIO_CALENDARIO + 1;
const HORAS = Array.from({ length: TOTAL_HORAS }, (_, i) => {
  const h = HORA_INICIO_CALENDARIO + i;
  return `${String(h).padStart(2, "0")}:00`;
});

interface ClassesCalendarProps {
  clases: Clase[];
  reservas: Reserva[];
  selectedDate: string;
  onReservar: (claseId: string) => void;
  onEditClase: (clase: Clase) => void;
  onDeleteClase?: (clase: Clase) => void;
}

function normalizarDia(dia: string | null | undefined): string | null {
  if (!dia || !dia.trim()) return null;
  const trimmed = dia.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

function horaToIndex(hora: string | null | undefined): number {
  if (!hora) return -1;
  const [h, m] = hora.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return -1;
  const totalMin = h * 60 + m;
  const inicioMin = HORA_INICIO_CALENDARIO * 60;
  const idx = Math.floor((totalMin - inicioMin) / 60);
  return idx >= 0 && idx < TOTAL_HORAS ? idx : -1;
}

function horaFinToIndex(hora: string | null | undefined): number {
  if (!hora) return -1;
  const [h, m] = hora.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return -1;
  const totalMin = h * 60 + m;
  const inicioMin = HORA_INICIO_CALENDARIO * 60;
  const idx = Math.ceil((totalMin - inicioMin) / 60);
  return idx >= 0 && idx <= TOTAL_HORAS ? idx : -1;
}

export function ClassesCalendar({ clases, reservas, selectedDate, onReservar, onEditClase, onDeleteClase }: ClassesCalendarProps) {
  const getReservasCount = (claseId: string) => {
    return reservas.filter(r => r.claseId === claseId && r.estado === "confirmada").length;
  };

  const { clasesEnCuadricula, clasesFueraRango } = useMemo(() => {
    const enCuadricula = new Set<string>();
    const fueraRango: { id: string; razon: string }[] = [];

    for (const c of clases) {
      const dia = normalizarDia(c.diaSemana);
      const idxInicio = horaToIndex(c.horaInicio);
      const idxFin = horaFinToIndex(c.horaFin);

      if (!dia) { fueraRango.push({ id: c.id, razon: "Sin día asignado" }); continue; }
      if (!DIAS.includes(dia)) { fueraRango.push({ id: c.id, razon: `Día "${c.diaSemana}" no reconocido` }); continue; }
      if (idxInicio === -1 || idxFin === -1) { fueraRango.push({ id: c.id, razon: `Hora (${c.horaInicio}→${c.horaFin}) fuera del rango ${HORAS[0]}-${HORAS[HORAS.length - 1]}` }); continue; }

      enCuadricula.add(c.id);
    }

    return { clasesEnCuadricula: enCuadricula, clasesFueraRango: fueraRango };
  }, [clases]);

  const getClaseEnSlot = (dia: string, hora: string): Clase | undefined => {
    const idx = horaToIndex(hora);
    const ocupantes = clases.filter(c => {
      const diaNorm = normalizarDia(c.diaSemana);
      if (diaNorm !== dia) return false;
      const inicio = horaToIndex(c.horaInicio);
      const fin = horaFinToIndex(c.horaFin);
      if (inicio === -1 || fin === -1) return false;
      return idx >= inicio && idx < fin;
    });
    ocupantes.sort((a, b) => (a.horaInicio || "").localeCompare(b.horaInicio || ""));
    return ocupantes[0];
  };

  const isFirstRow = (dia: string, hora: string) => {
    const clase = getClaseEnSlot(dia, hora);
    if (!clase) return false;
    return horaToIndex(hora) === horaToIndex(clase.horaInicio);
  };

  return (
    <Card id="clases-section">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-500" />
          Clases Disponibles
        </CardTitle>
        <CardDescription>
          Horario semanal · {clasesEnCuadricula.size} en cuadrícula
          {clasesFueraRango.length > 0 && ` · ${clasesFueraRango.length} fuera de rango`}
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto px-3 pb-3">
        <div className="min-w-[900px]">
          {/* Cabecera de días */}
          <div className="grid grid-cols-8 gap-0.5 mb-0.5">
            <div className="py-1 text-[10px] font-medium text-muted-foreground text-center">Hora</div>
            {DIAS.map(dia => (
              <div key={dia} className="py-1 text-[10px] font-semibold text-center bg-muted/50 rounded-t">
                {dia.slice(0, 3)}
              </div>
            ))}
          </div>

          {/* Filas de horarios */}
          {HORAS.map(hora => (
            <div key={hora} className="grid grid-cols-8 gap-0.5">
              <div className="py-1 text-[10px] text-muted-foreground text-right pr-2 font-medium border-r border-border/20">
                {hora}
              </div>
              {DIAS.map(dia => {
                const clase = getClaseEnSlot(dia, hora);
                const first = isFirstRow(dia, hora);
                if (!clase) {
                  return <div key={`${dia}-${hora}`} className="rounded min-h-[28px] border border-transparent bg-muted/10" />;
                }
                if (!first) {
                  return <div key={`${dia}-${hora}`} className="rounded border border-emerald-500/20 bg-emerald-500/5" />;
                }
                return (
                  <div
                    key={`${dia}-${hora}`}
                    className="relative rounded border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors cursor-pointer min-h-[28px] group"
                    onClick={() => onEditClase(clase)}
                    title="Clic para editar clase"
                  >
                    <div className="flex items-center justify-between h-full px-1 py-0.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 truncate leading-tight">
                          {clase.nombre}
                        </p>
                        <p className="text-[9px] text-muted-foreground leading-tight">
                          {clase.horaInicio} - {clase.horaFin}{clase.instructor ? ` · ${clase.instructor}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Badge variant="outline" className="text-[9px] h-3.5 px-1 py-0">
                          <Users className="w-2 h-2 mr-0.5" />
                          {getReservasCount(clase.id)}/{clase.capacidad}
                        </Badge>
                        {onDeleteClase && (
                          <button
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-red-500 hover:bg-red-500/10 rounded transition-opacity"
                            onClick={(e) => { e.stopPropagation(); onDeleteClase(clase); }}
                            title="Eliminar clase"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {clasesFueraRango.length > 0 && (
          <div className="mt-3 p-2 rounded-lg border border-amber-500/30 bg-amber-500/5 min-w-0">
            <p className="text-[10px] font-semibold text-amber-700 mb-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {clasesFueraRango.length} clase(s) no visible(s) en la cuadrícula
            </p>
            <div className="space-y-0.5">
              {clasesFueraRango.map(({ id, razon }) => {
                const clase = clases.find(c => c.id === id);
                if (!clase) return null;
                return (
                  <div
                    key={id}
                    className="flex items-center gap-2 text-[10px] text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => onEditClase(clase)}
                  >
                    <span className="font-medium">{clase.nombre}</span>
                    <span>· {clase.diaSemana || "sin día"}{clase.horaInicio ? ` ${clase.horaInicio}${clase.horaFin ? `-${clase.horaFin}` : ""}` : ""}</span>
                    <Badge variant="outline" className="text-[9px] h-3.5 px-1 border-amber-500/30 text-amber-600">{razon}</Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}