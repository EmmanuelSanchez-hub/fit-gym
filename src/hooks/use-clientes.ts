"use client";

import { useState, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import type { Cliente, ClienteForm, AuthUser } from "@/components/gym/types";

interface UseClientesProps {
  user: AuthUser | null;
  clientes: Cliente[];
  onRefresh: () => void;
}

export function useClientes({ user, clientes, onRefresh }: UseClientesProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState<ClienteForm>({
    nombre: "",
    apellido: "",
    dni: "",
    email: "",
    telefono: "",
    fechaNacimiento: "",
    direccion: "",
    huellaBiometrica: "",
  });

  const validateForm = (): boolean => {
    if (!form.nombre.trim() || !form.apellido.trim() ||
        !form.email.trim() || !form.telefono.trim() ||
        !form.huellaBiometrica.trim()) {
      toast({ title: "Error", description: "Complete todos los campos obligatorios incluyendo la huella biométrica", variant: "destructive" });
      return false;
    }
    return true;
  };

  const createCliente = async () => {
    if (!validateForm()) return;

    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre,
          apellido: form.apellido,
          dni: form.dni || null,
          email: form.email,
          telefono: form.telefono,
          fechaNacimiento: form.fechaNacimiento || null,
          direccion: form.direccion || null,
          huellaBiometrica: form.huellaBiometrica,
          registradoPor: user?.empleadoId || null,
        }),
      });
      if (res.ok) {
        toast({ title: "Éxito", description: "Cliente creado exitosamente" });
        setShowCreateDialog(false);
        resetForm();
        onRefresh();
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.error || "No se pudo crear el cliente", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "No se pudo crear el cliente", variant: "destructive" });
    }
  };

  const updateCliente = async () => {
    if (!selectedCliente || !validateForm()) return;

    try {
      const res = await fetch(`/api/clientes/${selectedCliente.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre,
          apellido: form.apellido,
          dni: form.dni || null,
          email: form.email,
          telefono: form.telefono,
          fechaNacimiento: form.fechaNacimiento || null,
          direccion: form.direccion || null,
          huellaBiometrica: form.huellaBiometrica,
        }),
      });
      if (res.ok) {
        toast({ title: "Éxito", description: "Cliente actualizado exitosamente" });
        setShowEditDialog(false);
        setSelectedCliente(null);
        resetForm();
        onRefresh();
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.error || "No se pudo actualizar el cliente", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "No se pudo actualizar el cliente", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setForm({
      nombre: "",
      apellido: "",
      dni: "",
      email: "",
      telefono: "",
      fechaNacimiento: "",
      direccion: "",
      huellaBiometrica: "",
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  const openEditDialog = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setForm({
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      dni: cliente.dni || "",
      email: cliente.email,
      telefono: cliente.telefono,
      fechaNacimiento: cliente.fechaNacimiento || "",
      direccion: cliente.direccion || "",
      huellaBiometrica: cliente.huellaBiometrica || "",
    });
    setShowEditDialog(true);
  };

  const openDetailDialog = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setShowDetailDialog(true);
  };

  const filteredClientes = clientes.filter(
    (c) =>
      c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.apellido.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
    // State
    showCreateDialog,
    showEditDialog,
    showDetailDialog,
    selectedCliente,
    searchQuery,
    form,
    filteredClientes,
    // Actions
    setShowCreateDialog,
    setShowEditDialog,
    setShowDetailDialog,
    setSearchQuery,
    setForm,
    createCliente,
    updateCliente,
    openCreateDialog,
    openEditDialog,
    openDetailDialog,
    resetForm,
  };
}
