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
      <CardContent className="p-0 overflow-x-auto max-w-full">
        <Table className="w-full min-w-[360px] sm:min-w-[600px]">
          <TableHeader>
            <TableRow>
              <TableHead className="text-[10px] sm:text-sm whitespace-nowrap">Usuario</TableHead>
              <TableHead className="text-[10px] sm:text-sm whitespace-nowrap">Email</TableHead>
              <TableHead className="text-[10px] sm:text-sm whitespace-nowrap hidden sm:table-cell">Rol</TableHead>
              <TableHead className="text-[10px] sm:text-sm whitespace-nowrap hidden sm:table-cell">Estado</TableHead>
              <TableHead className="text-[10px] sm:text-sm whitespace-nowrap hidden sm:table-cell">Creado</TableHead>
              <TableHead className="text-right text-[10px] sm:text-sm whitespace-nowrap">Acc.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="py-2 sm:py-4">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none">{u.empleado?.nombre || "Sin nombre"}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">{u.empleado?.cargo || ""}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-[10px] sm:text-sm">{u.email}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge className={`${rolBadgeColors[u.rol] || "bg-gray-500/20 text-gray-600"} text-[9px] sm:text-xs whitespace-nowrap`}>
                    {u.rol.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant={u.activo ? "default" : "secondary"} className={`text-[9px] sm:text-xs whitespace-nowrap ${u.activo ? "bg-emerald-500/20 text-emerald-600" : ""}`}>
                    {u.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-[10px] sm:text-sm hidden sm:table-cell">
                  {new Date(u.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-0.5 sm:gap-1" id="user-actions">
                    {u.rol !== "SUPER_USUARIO" && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => onEdit(u)}>
                        <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => onChangePassword(u)}>
                      <Key className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Button>
                    {u.rol !== "SUPER_USUARIO" && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-red-500" onClick={() => onDelete(u.id)}>
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 sm:py-8">
                  <p className="text-xs sm:text-sm text-muted-foreground">No se encontraron usuarios</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}