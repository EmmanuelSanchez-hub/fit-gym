"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Key, Trash2, User } from "lucide-react";
import type { SystemUser } from "../../types";

interface UserTableProps {
  users: SystemUser[];
  onEdit: (user: SystemUser) => void;
  onChangePassword: (user: SystemUser) => void;
  onDelete: (userId: string) => void;
}

const rolBadgeColors: Record<string, string> = {
  SUPER_USUARIO: "bg-purple-500/20 text-purple-600 dark:text-purple-400",
  ADMINISTRADOR: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
  RECEPCIONISTA: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
  ENTRENADOR: "bg-amber-500/20 text-amber-600 dark:text-amber-400",
};

export function UserTable({ users, onEdit, onChangePassword, onDelete }: UserTableProps) {
  return (
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
            {users.map((u) => (
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
                <TableCell className="text-sm">{u.email}</TableCell>
                <TableCell>
                  <Badge className={rolBadgeColors[u.rol] || "bg-gray-500/20 text-gray-600"}>
                    {u.rol.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={u.activo ? "default" : "secondary"} className={u.activo ? "bg-emerald-500/20 text-emerald-600" : ""}>
                    {u.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {new Date(u.createdAt).toLocaleDateString("es-ES")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1" id="user-actions">
                    {u.rol !== "SUPER_USUARIO" && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(u)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onChangePassword(u)}>
                      <Key className="w-4 h-4" />
                    </Button>
                    {u.rol !== "SUPER_USUARIO" && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => onDelete(u.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
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
  );
}