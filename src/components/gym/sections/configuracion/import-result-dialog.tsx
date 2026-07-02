"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ImportResult {
  type: string;
  total: number;
  exitosos: number;
  errores: string[];
  creados: unknown[];
}

interface ImportResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: ImportResult | null;
}

export function ImportResultDialog({ open, onOpenChange, result }: ImportResultDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Resultado de Importación</DialogTitle>
          <DialogDescription>Resumen de la importación de datos</DialogDescription>
        </DialogHeader>
        {result && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-2xl font-bold">{result.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <p className="text-2xl font-bold text-emerald-600">{result.exitosos}</p>
                <p className="text-xs text-muted-foreground">Exitosos</p>
              </div>
              <div className="p-3 rounded-lg bg-red-500/10">
                <p className="text-2xl font-bold text-red-600">{result.errores.length}</p>
                <p className="text-xs text-muted-foreground">Errores</p>
              </div>
            </div>
            {result.errores.length > 0 && (
              <div className="space-y-2">
                <Label>Errores</Label>
                <ScrollArea className="h-32">
                  <div className="space-y-1 p-2 rounded bg-muted text-xs">
                    {result.errores.map((err, i) => (
                      <p key={i} className="text-red-600">{err}</p>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}