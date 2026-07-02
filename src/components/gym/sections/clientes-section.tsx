"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search,
  Plus,
  Phone,
  Mail,
  QrCode,
  Fingerprint,
  Edit,
} from "lucide-react";
import type { Cliente } from "../types";

interface ClientesSectionProps {
  clientes: Cliente[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNewCliente: () => void;
  onEditCliente: (cliente: Cliente) => void;
  onSelectCliente: (cliente: Cliente) => void;
}

export function ClientesSection({
  clientes,
  searchQuery,
  onSearchChange,
  onNewCliente,
  onEditCliente,
  onSelectCliente,
}: ClientesSectionProps) {
  // Filter clients
  const filteredClientes = clientes.filter(
    (c) =>
      c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.apellido.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get membership status
  const getMembresiaStatus = (cliente: Cliente) => {
    if (!cliente.membresias || cliente.membresias.length === 0) {
      return { status: "Sin membresía", color: "secondary" };
    }
    const membresia = cliente.membresias[0];
    const fechaFin = new Date(membresia.fechaFin);
    const hoy = new Date();
    const diasRestantes = Math.ceil((fechaFin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

    if (diasRestantes < 0) {
      return { status: "Expirada", color: "destructive" as const };
    } else if (diasRestantes <= 7) {
      return { status: `Por vencer (${diasRestantes}d)`, color: "warning" as const };
    }
    return { status: `Activa (${diasRestantes}d)`, color: "success" as const };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Header with search and add button */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-xl font-semibold">Lista de Clientes</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64" id="search-clientes">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar clientes..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <Button 
            className="bg-emerald-500 hover:bg-emerald-600" 
            onClick={onNewCliente}
            id="new-cliente-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      {/* Client Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="cliente-cards">
        {filteredClientes.map((cliente) => {
          const membresiaStatus = getMembresiaStatus(cliente);
          return (
            <Card
              key={cliente.id}
              className="hover:shadow-lg transition-shadow overflow-hidden"
            >
              <CardHeader className="pb-3 px-4">
                <div className="flex items-start gap-3">
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                      {cliente.nombre[0]}
                      {cliente.apellido[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div
                      className="cursor-pointer"
                      onClick={() => onSelectCliente(cliente)}
                    >
                      <CardTitle className="text-base truncate">
                        {cliente.nombre} {cliente.apellido}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 truncate mt-0.5 text-xs">
                        <Mail className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{cliente.email}</span>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1 mt-1.5">
                      <Badge
                        variant={
                          membresiaStatus.color === "success"
                            ? "default"
                            : membresiaStatus.color === "warning"
                              ? "secondary"
                              : "destructive"
                        }
                        className={
                          "truncate max-w-[120px] text-[10px] px-1.5 py-0 " +
                          (membresiaStatus.color === "success"
                            ? "bg-emerald-500/20 text-emerald-600"
                            : membresiaStatus.color === "warning"
                              ? "bg-amber-500/20 text-amber-600"
                              : "")
                        }
                      >
                        {membresiaStatus.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-auto flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditCliente(cliente);
                        }}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent
                className="space-y-2 cursor-pointer px-4 pb-4"
                onClick={() => onSelectCliente(cliente)}
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                  <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{cliente.telefono}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                  <QrCode className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">Código: {cliente.codigoAcceso}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                  <Fingerprint className="w-3.5 h-3.5 flex-shrink-0" />
                  {cliente.huellaBiometrica ? (
                    <span className="text-emerald-600">Huella registrada</span>
                  ) : (
                    <span className="text-amber-600">Sin huella</span>
                  )}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-muted-foreground">
                  <span>{cliente._count?.accesos || 0} accesos</span>
                  <span>{cliente._count?.reservas || 0} reservas</span>
                  {cliente.empleado && (
                    <span className="truncate max-w-[80px]">Reg: {cliente.empleado.nombre}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredClientes.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No se encontraron clientes</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}