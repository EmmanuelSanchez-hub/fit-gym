"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
  Search,
  Plus,
  Edit,
  Key,
  Trash2,
  Shield,
  User,
  UsersRound,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { SystemUser, AuthUser } from "../types";

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
    email: "",
    password: "",
    rol: "RECEPCIONISTA",
    empleadoId: "",
    activo: true,
    crearEmpleado: false,
    empleadoNombre: "",
    empleadoTelefono: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  // Verificar permisos - solo SUPER_USUARIO y ADMINISTRADOR pueden gestionar usuarios
  const canManageUsers = user.rol === "SUPER_USUARIO" || user.rol === "ADMINISTRADOR";

  const fetchUsers = async () => {
    if (!canManageUsers) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        setUsers(await res.json());
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast({ title: "Error", description: errorData.error || "Error al cargar usuarios", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Error de conexión al cargar usuarios", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [canManageUsers]);

  const handleCreateUser = async () => {
    if (!form.email.trim() || !form.password.trim() || !form.rol) {
      toast({ title: "Error", description: "Complete todos los campos obligatorios", variant: "destructive" });
      return;
    }

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          rol: form.rol,
          empleadoId: form.empleadoId || null,
          activo: form.activo,
          crearEmpleado: form.crearEmpleado,
          empleadoData: form.crearEmpleado ? {
            nombre: form.empleadoNombre || form.email.split('@')[0],
            email: form.email,
            telefono: form.empleadoTelefono || null,
          } : null,
        }),
      });

      if (res.ok) {
        toast({ title: "Éxito", description: "Usuario creado exitosamente" });
        setShowDialog(false);
        resetForm();
        fetchUsers();
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.error || "No se pudo crear el usuario", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Error al crear usuario", variant: "destructive" });
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          rol: form.rol,
          empleadoId: form.empleadoId || null,
          activo: form.activo,
        }),
      });

      if (res.ok) {
        toast({ title: "Éxito", description: "Usuario actualizado exitosamente" });
        setShowDialog(false);
        setSelectedUser(null);
        resetForm();
        fetchUsers();
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.error || "No se pudo actualizar el usuario", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Error al actualizar usuario", variant: "destructive" });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("¿Está seguro de eliminar este usuario?")) return;

    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Éxito", description: "Usuario eliminado exitosamente" });
        fetchUsers();
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.error || "No se pudo eliminar el usuario", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Error al eliminar usuario", variant: "destructive" });
    }
  };

  const handleChangePassword = async () => {
    if (!selectedUser) return;
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: "Error", description: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast({ title: "Error", description: "La contraseña debe tener al menos 6 caracteres", variant: "destructive" });
      return;
    }

    try {
      const res = await fetch(`/api/users/${selectedUser.id}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: passwordForm.newPassword }),
      });

      if (res.ok) {
        toast({ title: "Éxito", description: "Contraseña actualizada exitosamente" });
        setShowPasswordDialog(false);
        setSelectedUser(null);
        setPasswordForm({ newPassword: "", confirmPassword: "" });
      } else {
        toast({ title: "Error", description: "No se pudo cambiar la contraseña", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Error al cambiar contraseña", variant: "destructive" });
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setSelectedUser(null);
    setShowDialog(true);
  };

  const openEditDialog = (u: SystemUser) => {
    setSelectedUser(u);
    setForm({
      email: u.email,
      password: "",
      rol: u.rol,
      empleadoId: u.empleado?.id || "",
      activo: u.activo,
      crearEmpleado: false,
      empleadoNombre: "",
      empleadoTelefono: "",
    });
    setShowDialog(true);
  };

  const openPasswordDialog = (u: SystemUser) => {
    setSelectedUser(u);
    setPasswordForm({ newPassword: "", confirmPassword: "" });
    setShowPasswordDialog(true);
  };

  const resetForm = () => {
    setForm({
      email: "",
      password: "",
      rol: "RECEPCIONISTA",
      empleadoId: "",
      activo: true,
      crearEmpleado: false,
      empleadoNombre: "",
      empleadoTelefono: "",
    });
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.rol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.empleado?.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRolBadgeColor = (rol: string) => {
    switch (rol) {
      case "SUPER_USUARIO":
        return "bg-purple-500/20 text-purple-600";
      case "ADMINISTRADOR":
        return "bg-blue-500/20 text-blue-600";
      case "RECEPCIONISTA":
        return "bg-emerald-500/20 text-emerald-600";
      case "ENTRENADOR":
        return "bg-amber-500/20 text-amber-600";
      default:
        return "bg-gray-500/20 text-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Mostrar mensaje si no tiene permisos
  if (!canManageUsers) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="flex flex-col items-center justify-center py-12"
      >
        <Shield className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Acceso Restringido</h2>
        <p className="text-muted-foreground text-center">
          No tienes permisos para gestionar usuarios.<br />
          Esta sección está disponible solo para Super Usuarios y Administradores.
        </p>
      </motion.div>
    );
  }

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
            <UsersRound className="w-5 h-5" />
            Gestión de Usuarios
          </h2>
          <p className="text-muted-foreground text-sm">
            Administra los usuarios del sistema
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuarios..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            className="bg-emerald-500 hover:bg-emerald-600"
            onClick={openCreateDialog}
            id="new-user-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Usuario
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <Card id="users-table">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha Creación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium">{u.empleado?.nombre || "Sin nombre"}</p>
                        <p className="text-xs text-muted-foreground">{u.empleado?.cargo || ""}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge className={getRolBadgeColor(u.rol)}>
                      {u.rol.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.activo ? "default" : "secondary"} className={u.activo ? "bg-emerald-500/20 text-emerald-600" : ""}>
                      {u.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(u.createdAt).toLocaleDateString("es-ES")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1" id="user-actions">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(u)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openPasswordDialog(u)}
                      >
                        <Key className="w-4 h-4" />
                      </Button>
                      {u.rol !== "SUPER_USUARIO" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500"
                          onClick={() => handleDeleteUser(u.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">No se encontraron usuarios</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit User Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedUser ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
            <DialogDescription>
              {selectedUser ? "Modifica los datos del usuario" : "Crea un nuevo usuario para el sistema"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="userEmail">Email</Label>
              <Input
                id="userEmail"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="usuario@gym.com"
              />
            </div>
            {!selectedUser && (
              <div>
                <Label htmlFor="userPassword">Contraseña</Label>
                <Input
                  id="userPassword"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            )}
            <div>
              <Label htmlFor="userRol">Rol</Label>
              <Select
                value={form.rol}
                onValueChange={(value) => setForm({ ...form, rol: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMINISTRADOR">Administrador</SelectItem>
                  <SelectItem value="RECEPCIONISTA">Recepcionista</SelectItem>
                  <SelectItem value="ENTRENADOR">Entrenador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="activo"
                checked={form.activo}
                onChange={(e) => setForm({ ...form, activo: e.target.checked })}
              />
              <Label htmlFor="activo">Usuario activo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={selectedUser ? handleUpdateUser : handleCreateUser}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {selectedUser ? "Guardar Cambios" : "Crear Usuario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Contraseña</DialogTitle>
            <DialogDescription>
              Nueva contraseña para: {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="Repita la contraseña"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleChangePassword} className="bg-emerald-500 hover:bg-emerald-600">
              Cambiar Contraseña
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
