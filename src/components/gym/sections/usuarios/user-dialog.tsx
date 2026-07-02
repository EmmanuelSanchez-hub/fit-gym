"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UserForm {
  email: string;
  password: string;
  rol: string;
  empleadoId: string;
  activo: boolean;
  crearEmpleado: boolean;
  empleadoNombre: string;
  empleadoTelefono: string;
}

interface UserDialogProps {
  open: boolean;
  selectedUser: { id: string; email: string; rol: string; activo: boolean; empleado?: { id: string; nombre: string } | null } | null;
  form: UserForm;
  onOpenChange: (open: boolean) => void;
  onFormChange: (form: UserForm) => void;
  onSubmit: () => void;
}

export function UserDialog({ open, selectedUser, form, onOpenChange, onFormChange, onSubmit }: UserDialogProps) {
  const isEditing = !!selectedUser;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Modifica los datos del usuario" : "Crea un nuevo usuario para el sistema"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 overflow-y-auto flex-1">
          <div className="space-y-2">
            <Label htmlFor="user-email">Email *</Label>
            <Input
              id="user-email"
              type="email"
              value={form.email}
              onChange={(e) => onFormChange({ ...form, email: e.target.value })}
              placeholder="usuario@gym.com"
            />
          </div>

          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="user-password">Contraseña *</Label>
              <Input
                id="user-password"
                type="password"
                value={form.password}
                onChange={(e) => onFormChange({ ...form, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="user-rol">Rol *</Label>
            <Select value={form.rol} onValueChange={(v) => onFormChange({ ...form, rol: v })}>
              <SelectTrigger id="user-rol">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMINISTRADOR">Administrador</SelectItem>
                <SelectItem value="RECEPCIONISTA">Recepcionista</SelectItem>
                <SelectItem value="ENTRENADOR">Entrenador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Datos del empleado vinculado */}
          <div className="space-y-3 rounded-lg border border-border/50 p-3">
            <p className="text-sm font-medium text-muted-foreground">
              {isEditing ? "Empleado vinculado" : "Crear empleado vinculado"}
            </p>
            {!isEditing && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <Checkbox
                  id="crear-empleado"
                  checked={form.crearEmpleado}
                  onCheckedChange={(checked) => onFormChange({ ...form, crearEmpleado: checked === true })}
                />
                <Label htmlFor="crear-empleado" className="cursor-pointer text-sm font-medium">
                  Crear empleado vinculado
                </Label>
              </div>
            )}
            {(form.crearEmpleado || isEditing) && (
              <div className="space-y-3 pl-4 border-l-2 border-emerald-500/30">
                <div className="space-y-2">
                  <Label htmlFor="empleado-nombre">Nombre del empleado</Label>
                  <Input
                    id="empleado-nombre"
                    value={form.empleadoNombre}
                    onChange={(e) => onFormChange({ ...form, empleadoNombre: e.target.value })}
                    placeholder="Juan Pérez"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="empleado-telefono">Teléfono</Label>
                  <Input
                    id="empleado-telefono"
                    value={form.empleadoTelefono}
                    onChange={(e) => onFormChange({ ...form, empleadoTelefono: e.target.value })}
                    placeholder="+51 999 888 777"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <Checkbox
              id="user-activo"
              checked={form.activo}
              onCheckedChange={(checked) => onFormChange({ ...form, activo: checked === true })}
            />
            <Label htmlFor="user-activo" className="cursor-pointer text-sm font-medium">
              Usuario activo
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSubmit} className="bg-emerald-500 hover:bg-emerald-600">
            {isEditing ? "Guardar Cambios" : "Crear Usuario"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}