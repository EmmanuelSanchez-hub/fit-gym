"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Calendar,
  Clock,
  Search,
  CalendarDays,
  Fingerprint,
  User,
  CheckCircle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Clase, Cliente, Reserva } from "../types";

interface ReservasSectionProps {
  reservas: Reserva[];
  clases: Clase[];
  clientes: Cliente[];
  user?: { id: string; nombre: string; empleadoId?: string };
}

export function ReservasSection({ reservas: initialReservas, clases, clientes, user }: ReservasSectionProps) {
  const [reservas, setReservas] = useState<Reserva[]>(initialReservas);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showReservaDialog, setShowReservaDialog] = useState(false);
  const [showClaseDialog, setShowClaseDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  // Estado para búsqueda por huella
  const [busquedaHuella, setBusquedaHuella] = useState("");
  const [clienteEncontrado, setClienteEncontrado] = useState<Cliente | null>(null);

  const [reservaForm, setReservaForm] = useState({
    clienteId: "",
    claseId: "",
    fecha: new Date().toISOString().split("T")[0],
    notas: "",
  });

  const [claseForm, setClaseForm] = useState({
    nombre: "",
    descripcion: "",
    capacidad: "20",
    duracion: "60",
    instructor: "",
    diaSemana: "",
    horaInicio: "09:00",
    horaFin: "10:00",
  });

  // Búsqueda por huella biométrica
  const handleBusquedaHuella = (huella: string) => {
    setBusquedaHuella(huella);
    if (huella.trim()) {
      const cliente = clientes.find(c =>
        c.huellaBiometrica?.toLowerCase().includes(huella.toLowerCase())
      );
      setClienteEncontrado(cliente || null);
      if (cliente) {
        setReservaForm(prev => ({ ...prev, clienteId: cliente.id }));
      } else {
        setReservaForm(prev => ({ ...prev, clienteId: "" }));
      }
    } else {
      setClienteEncontrado(null);
      setReservaForm(prev => ({ ...prev, clienteId: "" }));
    }
  };

  const fetchReservas = async (fecha?: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reservas?fecha=${fecha || selectedDate}`);
      if (res.ok) {
        setReservas(await res.json());
      }
    } catch {
      toast({ title: "Error", description: "Error al cargar reservas", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReserva = async () => {
    if (!reservaForm.clienteId || !reservaForm.claseId) {
      toast({ title: "Error", description: "Busca un cliente por huella y selecciona una clase", variant: "destructive" });
      return;
    }

    try {
      const clase = clases.find(c => c.id === reservaForm.claseId);
      const res = await fetch("/api/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId: reservaForm.clienteId,
          claseId: reservaForm.claseId,
          fecha: reservaForm.fecha,
          horaInicio: clase?.horaInicio || "09:00",
          horaFin: clase?.horaFin || "10:00",
          empleadoId: user?.empleadoId,
          notas: reservaForm.notas,
        }),
      });

      if (res.ok) {
        toast({ title: "Éxito", description: "Reserva creada exitosamente" });
        setShowReservaDialog(false);
        setReservaForm({ clienteId: "", claseId: "", fecha: new Date().toISOString().split("T")[0], notas: "" });
        setBusquedaHuella("");
        setClienteEncontrado(null);
        fetchReservas();
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.error || "No se pudo crear la reserva", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Error al crear reserva", variant: "destructive" });
    }
  };

  const handleCreateClase = async () => {
    if (!claseForm.nombre || !claseForm.capacidad) {
      toast({ title: "Error", description: "Complete los campos obligatorios", variant: "destructive" });
      return;
    }

    try {
      const res = await fetch("/api/clases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: claseForm.nombre,
          descripcion: claseForm.descripcion || null,
          capacidad: parseInt(claseForm.capacidad),
          duracion: parseInt(claseForm.duracion),
          instructor: claseForm.instructor || null,
          diaSemana: claseForm.diaSemana || null,
          horaInicio: claseForm.horaInicio,
          horaFin: claseForm.horaFin,
        }),
      });

      if (res.ok) {
        toast({ title: "Éxito", description: "Clase creada exitosamente" });
        setShowClaseDialog(false);
        setClaseForm({
          nombre: "",
          descripcion: "",
          capacidad: "20",
          duracion: "60",
          instructor: "",
          diaSemana: "",
          horaInicio: "09:00",
          horaFin: "10:00",
        });
      } else {
        toast({ title: "Error", description: "No se pudo crear la clase", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Error al crear clase", variant: "destructive" });
    }
  };

  const handleCancelReserva = async (id: string) => {
    if (!confirm("¿Está seguro de cancelar esta reserva?")) return;

    try {
      const res = await fetch(`/api/reservas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "cancelada" }),
      });

      if (res.ok) {
        toast({ title: "Éxito", description: "Reserva cancelada" });
        fetchReservas();
      }
    } catch {
      toast({ title: "Error", description: "Error al cancelar reserva", variant: "destructive" });
    }
  };

  const filteredReservas = reservas.filter(
    (r) =>
      r.cliente.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.clase.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getEstadoBadge = (estado: string) => {
    const estados: Record<string, { color: string; label: string }> = {
      confirmada: { color: "bg-emerald-500/20 text-emerald-600", label: "Confirmada" },
      cancelada: { color: "bg-red-500/20 text-red-600", label: "Cancelada" },
      completada: { color: "bg-blue-500/20 text-blue-600", label: "Completada" },
    };
    const config = estados[estado] || estados.confirmada;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const diasSemana = [
    { value: "Lunes", label: "Lunes" },
    { value: "Martes", label: "Martes" },
    { value: "Miércoles", label: "Miércoles" },
    { value: "Jueves", label: "Jueves" },
    { value: "Viernes", label: "Viernes" },
    { value: "Sábado", label: "Sábado" },
    { value: "Domingo", label: "Domingo" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            Reservas
          </h2>
          <p className="text-muted-foreground text-sm">
            Gestiona las reservas de clases
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              const newDate = e.target.value;
              setSelectedDate(newDate);
              fetchReservas(newDate);
            }}
            className="w-40"
          />
          <Button
            variant="outline"
            onClick={() => setShowClaseDialog(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Clase
          </Button>
          <Button
            className="bg-emerald-500 hover:bg-emerald-600"
            onClick={() => {
              setBusquedaHuella("");
              setClienteEncontrado(null);
              setReservaForm({ clienteId: "", claseId: "", fecha: new Date().toISOString().split("T")[0], notas: "" });
              setShowReservaDialog(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Reserva
          </Button>
        </div>
      </div>

      {/* Clases disponibles */}
      <Card id="clases-section">
        <CardHeader>
          <CardTitle className="text-lg">Clases Disponibles</CardTitle>
          <CardDescription>Horarios y disponibilidad</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clases.map((clase) => (
              <Card key={clase.id} className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{clase.nombre}</h3>
                    <Badge variant="outline">
                      {clase._count?.reservas || 0}/{clase.capacidad}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {clase.instructor && (
                      <p>Instructor: {clase.instructor}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      <span>{clase.horaInicio} - {clase.horaFin}</span>
                    </div>
                    {clase.diaSemana && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        <span>{clase.diaSemana}</span>
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    className="w-full mt-3 bg-emerald-500 hover:bg-emerald-600"
                    onClick={() => {
                      setBusquedaHuella("");
                      setClienteEncontrado(null);
                      setReservaForm({ clienteId: "", claseId: clase.id, fecha: new Date().toISOString().split("T")[0], notas: "" });
                      setShowReservaDialog(true);
                    }}
                  >
                    Reservar
                  </Button>
                </CardContent>
              </Card>
            ))}
            {clases.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No hay clases creadas. Crea una clase para empezar.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

          {/* Tabla de Reservas */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <div>
              <CardTitle>Reservas del Día</CardTitle>
              <CardDescription>
                {new Date(selectedDate).toLocaleDateString("es-ES", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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
              {filteredReservas.map((reserva) => (
                <TableRow key={reserva.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{reserva.cliente.nombre} {reserva.cliente.apellido}</p>
                      <p className="text-xs text-muted-foreground">{reserva.cliente.telefono}</p>
                    </div>
                  </TableCell>
                  <TableCell>{reserva.clase.nombre}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      {reserva.horaInicio} - {reserva.horaFin}
                    </div>
                  </TableCell>
                  <TableCell>{getEstadoBadge(reserva.estado)}</TableCell>
                  <TableCell className="text-right">
                    {reserva.estado === "confirmada" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500"
                        onClick={() => handleCancelReserva(reserva.id)}
                      >
                        Cancelar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredReservas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No hay reservas para esta fecha
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Nueva Reserva - Con huella biométrica */}
      <Dialog open={showReservaDialog} onOpenChange={setShowReservaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Reserva</DialogTitle>
            <DialogDescription>
              Busca el cliente por huella biométrica y selecciona la clase
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Búsqueda por Huella Biométrica */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-emerald-500" />
                Buscar por Huella Biométrica
              </Label>
              <div className="relative">
                <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Ingresa el código de huella..."
                  value={busquedaHuella}
                  onChange={(e) => handleBusquedaHuella(e.target.value)}
                  className="pl-12 h-12 text-lg"
                />
              </div>
              
              {/* Cliente encontrado */}
              {clienteEncontrado ? (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-emerald-500/20 text-emerald-600">
                        {clienteEncontrado.nombre.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold text-emerald-600 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        {clienteEncontrado.nombre} {clienteEncontrado.apellido}
                      </p>
                      <p className="text-sm text-muted-foreground">{clienteEncontrado.telefono}</p>
                    </div>
                  </div>
                </motion.div>
              ) : busquedaHuella && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <p className="text-sm text-red-600 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    No se encontró cliente con esa huella
                  </p>
                </div>
              )}
            </div>

            <div>
              <Label>Clase</Label>
              <Select
                value={reservaForm.claseId}
                onValueChange={(v) => setReservaForm({ ...reservaForm, claseId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar clase" />
                </SelectTrigger>
                <SelectContent>
                  {clases.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre} ({c.horaInicio})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fecha</Label>
              <Input
                type="date"
                value={reservaForm.fecha}
                onChange={(e) => setReservaForm({ ...reservaForm, fecha: e.target.value })}
              />
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea
                value={reservaForm.notas}
                onChange={(e) => setReservaForm({ ...reservaForm, notas: e.target.value })}
                placeholder="Notas adicionales..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReservaDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateReserva} 
              className="bg-emerald-500 hover:bg-emerald-600"
              disabled={!reservaForm.clienteId || !reservaForm.claseId}
            >
              Crear Reserva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Nueva Clase */}
      <Dialog open={showClaseDialog} onOpenChange={setShowClaseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Clase</DialogTitle>
            <DialogDescription>
              Crea una nueva clase o espacio para reservar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nombre</Label>
              <Input
                value={claseForm.nombre}
                onChange={(e) => setClaseForm({ ...claseForm, nombre: e.target.value })}
                placeholder="Ej: Spinning, Yoga, CrossFit"
              />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea
                value={claseForm.descripcion}
                onChange={(e) => setClaseForm({ ...claseForm, descripcion: e.target.value })}
                placeholder="Descripción de la clase..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Capacidad</Label>
                <Input
                  type="number"
                  value={claseForm.capacidad}
                  onChange={(e) => setClaseForm({ ...claseForm, capacidad: e.target.value })}
                />
              </div>
              <div>
                <Label>Duración (min)</Label>
                <Input
                  type="number"
                  value={claseForm.duracion}
                  onChange={(e) => setClaseForm({ ...claseForm, duracion: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Instructor</Label>
              <Input
                value={claseForm.instructor}
                onChange={(e) => setClaseForm({ ...claseForm, instructor: e.target.value })}
                placeholder="Nombre del instructor"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Día</Label>
                <Select
                  value={claseForm.diaSemana}
                  onValueChange={(v) => setClaseForm({ ...claseForm, diaSemana: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Día" />
                  </SelectTrigger>
                  <SelectContent>
                    {diasSemana.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Hora Inicio</Label>
                <Input
                  type="time"
                  value={claseForm.horaInicio}
                  onChange={(e) => setClaseForm({ ...claseForm, horaInicio: e.target.value })}
                />
              </div>
              <div>
                <Label>Hora Fin</Label>
                <Input
                  type="time"
                  value={claseForm.horaFin}
                  onChange={(e) => setClaseForm({ ...claseForm, horaFin: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClaseDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateClase} className="bg-emerald-500 hover:bg-emerald-600">
              Crear Clase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}