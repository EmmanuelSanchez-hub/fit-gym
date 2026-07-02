"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Search, Filter } from "lucide-react";
import type { Clase, Reserva } from "../../types";

interface ReservasTableProps {
  reservas: Reserva[];
  clases: Clase[];
  selectedDate: string;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  onCancel: (id: string) => void;
}

const estadoConfig: Record<string, { color: string; label: string }> = {
  confirmada: { color: "bg-emerald-500/20 text-emerald-600", label: "Confirmada" },
  cancelada: { color: "bg-red-500/20 text-red-600", label: "Cancelada" },
  completada: { color: "bg-blue-500/20 text-blue-600", label: "Completada" },
};

export function ReservasTable({ reservas, clases, selectedDate, searchQuery, onSearchChange, onCancel }: ReservasTableProps) {
  const [claseFilter, setClaseFilter] = useRuntimeState<string>("");
  
  // Set of valid class IDs (only show reservas for existing classes)
  const validClaseIds = new Set(clases.map(c => c.id));

  // Filter by search query AND selected class AND valid classes
  const filtered = reservas.filter(r => {
    if (!validClaseIds.has(r.claseId)) return false;
    const matchSearch = r.cliente.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        r.clase.nombre.toLowerCase().includes(searchQuery.toLowerCase());
    const matchClase = !claseFilter || r.claseId === claseFilter;
    return matchSearch && matchClase;
  });

  const uniqueClases = Array.from(new Map(clases.map(c => [c.id, c])).values());

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div>
            <CardTitle>Reservas del Día</CardTitle>
            <CardDescription>
              {formatLocalDate(selectedDate)}
            </CardDescription>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-40">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Select value={claseFilter} onValueChange={setClaseFilter}>
                <SelectTrigger className="pl-9 h-9 text-xs"><SelectValue placeholder="Todas las clases" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las clases</SelectItem>
                  {uniqueClases.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar cliente..." className="pl-10 h-9" value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Clase</TableHead>
              <TableHead>Hora</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(r => (
              <TableRow key={r.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{r.cliente.nombre} {r.cliente.apellido}</p>
                    <p className="text-xs text-muted-foreground">{r.cliente.telefono}</p>
                  </div>
                </TableCell>
                <TableCell>{r.clase.nombre}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1"><Clock className="w-3 h-3 text-muted-foreground" />{r.horaInicio} - {r.horaFin}</div>
                </TableCell>
                <TableCell>
                  {(() => { const cfg = estadoConfig[r.estado] || estadoConfig.confirmada; return <Badge className={cfg.color}>{cfg.label}</Badge>; })()}
                </TableCell>
                <TableCell className="text-right">
                  {r.estado === "confirmada" && (
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => onCancel(r.id)}>Cancelar</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No hay reservas para esta fecha</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/** Convierte una fecha "YYYY-MM-DD" a formato legible en español sin desplazamiento UTC */
function formatLocalDate(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Simple state hook usable inside React component
function useRuntimeState<T>(initial: T) {
  return useState<T>(initial);
}
