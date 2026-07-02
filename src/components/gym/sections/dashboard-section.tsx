"use client";

import { motion } from "framer-motion";
import type { DashboardData } from "../types";
import { StatsCards } from "./dashboard/stats-cards";
import { RiskMetrics } from "./dashboard/risk-metrics";
import { ChartsRow } from "./dashboard/charts-row";
import { HourlyChart } from "./dashboard/hourly-chart";
import { MembershipAlerts } from "./dashboard/membership-alerts";
import { EmployeeMetrics } from "./dashboard/employee-metrics";

interface DashboardSectionProps {
  data: DashboardData | null;
  userRol: string;
  onSendPromotion?: (clienteId: string, tipoAlerta: "vencer" | "expirado") => void;
}

export function DashboardSection({ data, userRol, onSendPromotion }: DashboardSectionProps) {
  if (!data) return null;

  const { generales, empleados, accesosPorDia, accesosPorHora, membresiasConCount, clientesPorVencer, clientesExpirados } = data;

  const formatDate = (d: string | Date) =>
    new Date(d).toLocaleDateString("es-ES", { day: "numeric", month: "short" });

  const getDiasRestantes = (fechaFin: string | Date) => {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const fin = new Date(fechaFin); fin.setHours(0, 0, 0, 0);
    return Math.ceil((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  };

  const showEmployeeMetrics = userRol === "SUPER_USUARIO" || userRol === "ADMINISTRADOR";

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
      {/* Stats Cards */}
      <StatsCards
        totalClientes={generales.totalClientes} clientesNuevos={generales.clientesNuevos}
        membresiasActivas={generales.membresiasActivas} membresiasPorVencer={generales.membresiasPorVencer}
        accesosHoy={generales.accesosHoy} reservasHoy={generales.reservasHoy}
        ingresosMes={generales.ingresosMes}
      />

      {/* Risk & Retention */}
      <RiskMetrics
        tasaRetencion={generales.tasaRetencion}
        clientesEnRiesgo={generales.clientesEnRiesgo}
        membresiasActivas={generales.membresiasActivas}
      />

      {/* Charts Row (Accesos semanales + Distribución membresías) */}
      <ChartsRow accesosPorDia={accesosPorDia} membresiasConCount={membresiasConCount} userRol={userRol} />

      {/* Hourly Chart */}
      {accesosPorHora && accesosPorHora.length > 0 && (
        <HourlyChart accesosPorHora={accesosPorHora} />
      )}

      {/* Membership Alerts */}
      <MembershipAlerts
        clientesPorVencer={clientesPorVencer} clientesExpirados={clientesExpirados}
        formatDate={formatDate} getDiasRestantes={getDiasRestantes}
        onSendPromotion={onSendPromotion}
      />

      {/* Employee Metrics */}
      {showEmployeeMetrics && <EmployeeMetrics empleados={empleados} />}
    </motion.div>
  );
}