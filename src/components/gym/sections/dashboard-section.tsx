"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  CreditCard,
  UserCheck,
  TrendingUp,
  AlertTriangle,
  Users2,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  XCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { DashboardData, Empleado } from "../types";
import { CHART_COLORS } from "../constants";

interface DashboardSectionProps {
  data: DashboardData | null;
  userRol: string;
  onSendPromotion?: (clienteId: string) => void;
}

export function DashboardSection({ data, userRol, onSendPromotion }: DashboardSectionProps) {
  if (!data) return null;

  const { generales, empleados, accesosPorDia, membresiasConCount, clientesPorVencer, clientesExpirados } = data;

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    });
  };

  const getDiasRestantes = (fechaFin: string | Date) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fin = new Date(fechaFin);
    fin.setHours(0, 0, 0, 0);
    const diff = Math.ceil((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="stats-cards">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-emerald-600">
              <Users className="w-4 h-4" />
              Total Clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">
              {generales.totalClientes}
            </div>
            <p className="text-sm text-muted-foreground">
              +{generales.clientesNuevos} este mes
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-blue-600">
              <CreditCard className="w-4 h-4" />
              Membresías Activas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {generales.membresiasActivas}
            </div>
            <p className="text-sm text-muted-foreground">
              {generales.membresiasPorVencer} por vencer
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-amber-600">
              <UserCheck className="w-4 h-4" />
              Accesos Hoy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {generales.accesosHoy}
            </div>
            <p className="text-sm text-muted-foreground">
              {generales.reservasHoy} reservas hoy
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-purple-600">
              <TrendingUp className="w-4 h-4" />
              Ingresos del Mes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              S/ {generales.ingresosMes.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">
              Total recaudado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Access Chart */}
        <Card id="access-chart">
          <CardHeader>
            <CardTitle>Accesos de la Semana</CardTitle>
            <CardDescription>
              {userRol === "SUPER_USUARIO" || userRol === "ADMINISTRADOR"
                ? "Todos los accesos del gimnasio"
                : "Accesos validados por ti"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={accesosPorDia}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="dia" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar
                    dataKey="accesos"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    name="Accesos"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Membership Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Membresías</CardTitle>
            <CardDescription>Clientes por tipo de plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={membresiasConCount}
                    dataKey="count"
                    nameKey="nombre"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ nombre, count }) => `${nombre}: ${count}`}
                  >
                    {membresiasConCount.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section - Membresías por Vencer */}
      {clientesPorVencer && clientesPorVencer.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5" id="alerts-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              Membresías por Vencer ({clientesPorVencer.length})
            </CardTitle>
            <CardDescription>
              Clientes con membresías que expiran en los próximos 7 días
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {clientesPorVencer.map((m) => {
                const diasRestantes = getDiasRestantes(m.fechaFin);
                const fueContactado = m.contactoReciente && m.contactoReciente.haceDias < 2;
                const puedeContactar = !fueContactado;
                
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-amber-500/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {m.cliente.nombre} {m.cliente.apellido}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{m.membresia.nombre}</span>
                          <span>•</span>
                          <span className="text-amber-600 font-medium">
                            {diasRestantes} días restantes
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {m.contactoReciente ? (
                        <div className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/10 text-emerald-600 text-xs">
                          <CheckCircle className="w-3 h-3" />
                          <span>Contactado{m.contactoReciente.haceDias === 0 ? ' hoy' : ` hace ${m.contactoReciente.haceDias}d`}</span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="border-amber-500/50 text-amber-600">
                          {formatDate(m.fechaFin)}
                        </Badge>
                      )}
                      {onSendPromotion && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className={puedeContactar ? "text-amber-600 hover:text-amber-700 hover:bg-amber-500/10" : "text-muted-foreground cursor-not-allowed opacity-50"}
                          onClick={() => puedeContactar && onSendPromotion(m.cliente.id)}
                          disabled={!puedeContactar}
                          title={puedeContactar ? "Enviar mensaje" : "Espera 2 días para volver a contactar"}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts Section - Membresías Expiradas */}
      {clientesExpirados && clientesExpirados.length > 0 && (
        <Card className="border-red-500/50 bg-red-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              Membresías Expiradas ({clientesExpirados.length})
            </CardTitle>
            <CardDescription>
              Clientes con membresías vencidas que requieren renovación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {clientesExpirados.map((m) => {
                const diasVencido = Math.abs(getDiasRestantes(m.fechaFin));
                const fueContactado = m.contactoReciente && m.contactoReciente.haceDias < 2;
                const puedeContactar = !fueContactado;
                
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-red-500/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                        <XCircle className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {m.cliente.nombre} {m.cliente.apellido}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{m.membresia.nombre}</span>
                          <span>•</span>
                          <span className="text-red-600 font-medium">
                            Vencido hace {diasVencido} días
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {m.contactoReciente ? (
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/10 text-emerald-600 text-xs">
                            <CheckCircle className="w-3 h-3" />
                            <span>Contactado{m.contactoReciente.haceDias === 0 ? ' hoy' : ` hace ${m.contactoReciente.haceDias}d`}</span>
                          </div>
                          <div className="flex gap-1">
                            <a
                              href={`tel:${m.cliente.telefono}`}
                              className="p-1 rounded hover:bg-red-500/10"
                            >
                              <Phone className="w-3 h-3 text-muted-foreground" />
                            </a>
                            <a
                              href={`mailto:${m.cliente.email}`}
                              className="p-1 rounded hover:bg-red-500/10"
                            >
                              <Mail className="w-3 h-3 text-muted-foreground" />
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="destructive">
                            {formatDate(m.fechaFin)}
                          </Badge>
                          <div className="flex gap-1">
                            <a
                              href={`tel:${m.cliente.telefono}`}
                              className="p-1 rounded hover:bg-red-500/10"
                            >
                              <Phone className="w-3 h-3 text-muted-foreground" />
                            </a>
                            <a
                              href={`mailto:${m.cliente.email}`}
                              className="p-1 rounded hover:bg-red-500/10"
                            >
                              <Mail className="w-3 h-3 text-muted-foreground" />
                            </a>
                          </div>
                        </div>
                      )}
                      {onSendPromotion && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className={puedeContactar ? "text-red-600 hover:text-red-700 hover:bg-red-500/10" : "text-muted-foreground cursor-not-allowed opacity-50"}
                          onClick={() => puedeContactar && onSendPromotion(m.cliente.id)}
                          disabled={!puedeContactar}
                          title={puedeContactar ? "Enviar mensaje" : "Espera 2 días para volver a contactar"}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employee Metrics */}
      {(userRol === "SUPER_USUARIO" || userRol === "ADMINISTRADOR") && empleados.length > 0 && (
        <Card id="employee-metrics">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users2 className="w-5 h-5" />
              Métricas por Empleado
            </CardTitle>
            <CardDescription>Rendimiento del equipo este mes</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {/* Table Header */}
            <div className="flex items-center justify-between py-2 px-3 mb-4 bg-muted/50 rounded-lg text-sm font-medium text-muted-foreground min-w-[400px]">
              <span className="w-32 sm:w-40 flex-shrink-0">Empleado</span>
              <div className="flex gap-4 sm:gap-6">
                <span className="text-emerald-600 w-12 sm:w-16 text-center">Clientes</span>
                <span className="text-blue-600 w-12 sm:w-16 text-center">Accesos</span>
                <span className="text-amber-600 w-12 sm:w-16 text-center">Reservas</span>
              </div>
            </div>
            <div className="space-y-4 min-w-[400px]">
              {empleados.map((empleado: Empleado) => {
                const totalActividades = 
                  (empleado._count?.clientesRegistrados || 0) +
                  (empleado._count?.accesosRegistrados || 0) +
                  (empleado._count?.reservasCreadas || 0);
                const maxActividades = Math.max(...empleados.map((e: Empleado) => 
                  (e._count?.clientesRegistrados || 0) +
                  (e._count?.accesosRegistrados || 0) +
                  (e._count?.reservasCreadas || 0)
                ));
                const progreso = maxActividades > 0 ? (totalActividades / maxActividades) * 100 : 0;

                return (
                  <div key={empleado.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 w-32 sm:w-40 flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-emerald-600">
                            {empleado.nombre.split(" ").map((n: string) => n[0]).join("")}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{empleado.nombre}</p>
                          <p className="text-xs text-muted-foreground truncate">{empleado.cargo}</p>
                        </div>
                      </div>
                      <div className="flex gap-4 sm:gap-6 text-sm">
                        <span className="text-emerald-600 w-12 sm:w-16 text-center">
                          {empleado._count?.clientesRegistrados || 0}
                        </span>
                        <span className="text-blue-600 w-12 sm:w-16 text-center">
                          {empleado._count?.accesosRegistrados || 0}
                        </span>
                        <span className="text-amber-600 w-12 sm:w-16 text-center">
                          {empleado._count?.reservasCreadas || 0}
                        </span>
                      </div>
                    </div>
                    <Progress value={progreso} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
