"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PasswordForm {
  newPassword: string;
  confirmPassword: string;
}

interface PasswordDialogProps {
  open: boolean;
  email: string;
  form: PasswordForm;
  onOpenChange: (open: boolean) => void;
  onFormChange: (form: PasswordForm) => void;
  onSubmit: () => void;
}

export function PasswordDialog({ open, email, form, onOpenChange, onFormChange, onSubmit }: PasswordDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Cambiar Contraseña</DialogTitle>
          <DialogDescription>
            Nueva contraseña para: <span className="font-medium">{email}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">Nueva Contraseña</Label>
            <Input
              id="new-password"
              type="password"
              value={form.newPassword}
              onChange={(e) => onFormChange({ ...form, newPassword: e.target.value })}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
            <Input
              id="confirm-password"
              type="password"
              value={form.confirmPassword}
              onChange={(e) => onFormChange({ ...form, confirmPassword: e.target.value })}
              placeholder="Repita la contraseña"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} className="bg-emerald-500 hover:bg-emerald-600">
            Cambiar Contraseña
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}