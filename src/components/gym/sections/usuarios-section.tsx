"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Shield, UsersRound } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { SystemUser, AuthUser } from "../types";
import { UserTable } from "./usuarios/user-table";
import { UserDialog } from "./usuarios/user-dialog";
import { PasswordDialog } from "./usuarios/password-dialog";

interface UsuariosSectionProps {
  user: AuthUser;
}

export function UsuariosSection({ user }: UsuariosSectionProps) {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [form, setForm] = useState({
    email: "", password: "", rol: "RECEPCIONISTA",
    empleadoId: "", activo: true,
    crearEmpleado: false, empleadoNombre: "", empleadoTelefono: "",
  });
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });

  const canManageUsers = user.rol === "SUPER_USUARIO" || user.rol === "ADMINISTRADOR";

  // ──── Fetch ────
  const fetchUsers = async () => {
    if (!canManageUsers) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) setUsers(await res.json());
      else { const e = await res.json().catch(() => ({})); toast({ title: "Error", description: e.error || "Error al cargar usuarios", variant: "destructive" }); }
    } catch { toast({ title: "Error", description: "Error de conexión", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [canManageUsers]);

  // ──── CRUD ────
  const resetForm = () => setForm({ email: "", password: "", rol: "RECEPCIONISTA", empleadoId: "", activo: true, crearEmpleado: false, empleadoNombre: "", empleadoTelefono: "" });

  const handleCreateUser = async () => {
    if (!form.email.trim() || !form.password.trim() || !form.rol) { toast({ title: "Error", description: "Complete todos los campos", variant: "destructive" }); return; }
    try {
      const res = await fetch("/api/users", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password, rol: form.rol, empleadoId: form.empleadoId || null, activo: form.activo, crearEmpleado: form.crearEmpleado, empleadoData: form.crearEmpleado ? { nombre: form.empleadoNombre || form.email.split("@")[0], email: form.email, telefono: form.empleadoTelefono || null } : null }),
      });
      if (res.ok) { toast({ title: "Éxito", description: "Usuario creado" }); setShowDialog(false); resetForm(); fetchUsers(); }
      else { const e = await res.json(); toast({ title: "Error", description: e.error || "No se pudo crear", variant: "destructive" }); }
    } catch { toast({ title: "Error", description: "Error al crear", variant: "destructive" }); }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email, rol: form.rol,
          empleadoId: form.empleadoId || null, activo: form.activo,
          empleadoData: form.empleadoId ? { nombre: form.empleadoNombre, telefono: form.empleadoTelefono || null } : null,
        }),
      });
      if (res.ok) { toast({ title: "Éxito", description: "Usuario actualizado" }); setShowDialog(false); setSelectedUser(null); resetForm(); fetchUsers(); }
      else { const e = await res.json(); toast({ title: "Error", description: e.error || "No se pudo actualizar", variant: "destructive" }); }
    } catch { toast({ title: "Error", description: "Error al actualizar", variant: "destructive" }); }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("¿Eliminar este usuario?")) return;
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      if (res.ok) { toast({ title: "Éxito", description: "Usuario eliminado" }); fetchUsers(); }
      else { const e = await res.json(); toast({ title: "Error", description: e.error || "No se pudo eliminar", variant: "destructive" }); }
    } catch { toast({ title: "Error", description: "Error al eliminar", variant: "destructive" }); }
  };

  const handleChangePassword = async () => {
    if (!selectedUser) return;
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { toast({ title: "Error", description: "Las contraseñas no coinciden", variant: "destructive" }); return; }
    if (passwordForm.newPassword.length < 6) { toast({ title: "Error", description: "Mínimo 6 caracteres", variant: "destructive" }); return; }
    try {
      const res = await fetch(`/api/users/${selectedUser.id}/password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ newPassword: passwordForm.newPassword }) });
      if (res.ok) { toast({ title: "Éxito", description: "Contraseña cambiada" }); setShowPasswordDialog(false); setSelectedUser(null); setPasswordForm({ newPassword: "", confirmPassword: "" }); }
      else { toast({ title: "Error", description: "No se pudo cambiar", variant: "destructive" }); }
    } catch { toast({ title: "Error", description: "Error al cambiar", variant: "destructive" }); }
  };

  // ──── Handlers ────
  const openCreate = () => { resetForm(); setSelectedUser(null); setShowDialog(true); };
  const openEdit = (u: SystemUser) => { setSelectedUser(u); setForm({ email: u.email, password: "", rol: u.rol, empleadoId: u.empleado?.id || "", activo: u.activo, crearEmpleado: true, empleadoNombre: u.empleado?.nombre || "", empleadoTelefono: "" }); setShowDialog(true); };
  const openPassword = (u: SystemUser) => { setSelectedUser(u); setPasswordForm({ newPassword: "", confirmPassword: "" }); setShowPasswordDialog(true); };

  const filtered = users.filter(u => u.email.toLowerCase().includes(searchQuery.toLowerCase()) || u.rol.toLowerCase().includes(searchQuery.toLowerCase()) || u.empleado?.nombre.toLowerCase().includes(searchQuery.toLowerCase()));

  // ──── Loading / No permiso ────
  if (loading) return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!canManageUsers) return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-12">
      <Shield className="w-16 h-16 text-muted-foreground mb-4" />
      <h2 className="text-xl font-semibold mb-2">Acceso Restringido</h2>
      <p className="text-muted-foreground text-center">Solo Super Usuarios y Administradores.</p>
    </motion.div>
  );

  // ──── Render ────
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <UsersRound className="w-5 h-5" />Gestión de Usuarios
          </h2>
          <p className="text-muted-foreground text-sm">Administra los usuarios del sistema</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <Button className="bg-emerald-500 hover:bg-emerald-600" onClick={openCreate} id="new-user-btn">
            <Plus className="w-4 h-4 mr-2" />Nuevo Usuario
          </Button>
        </div>
      </div>

      <UserTable users={filtered} onEdit={openEdit} onChangePassword={openPassword} onDelete={handleDeleteUser} />

      <UserDialog open={showDialog} selectedUser={selectedUser} form={form} onOpenChange={setShowDialog} onFormChange={setForm} onSubmit={selectedUser ? handleUpdateUser : handleCreateUser} />

      <PasswordDialog open={showPasswordDialog} email={selectedUser?.email || ""} form={passwordForm} onOpenChange={setShowPasswordDialog} onFormChange={setPasswordForm} onSubmit={handleChangePassword} />
    </motion.div>
  );
}