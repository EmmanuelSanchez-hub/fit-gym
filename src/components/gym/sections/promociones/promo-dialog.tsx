"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Loader2, Info, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Promocion } from "../../types";

const WHATSAPP_VARIABLES = [
  { variable: "{nombre}", descripcion: "Nombre completo del cliente", ejemplo: "Juan Pérez" },
  { variable: "{dias}", descripcion: "Días restantes o transcurridos (formato amigable)", ejemplo: "5 días, ayer, hace 10 días" },
  { variable: "{DIAS}", descripcion: "Número de días (sin formato)", ejemplo: "5, -3" },
  { variable: "{titulo}", descripcion: "Título de la promoción", ejemplo: "Descuento de Verano" },
  { variable: "{descripcion}", descripcion: "Descripción de la promoción", ejemplo: "Oferta especial..." },
  { variable: "{descuento}", descripcion: "Porcentaje de descuento", ejemplo: "20" },
  { variable: "{InicioPromocion}", descripcion: "Fecha de inicio de la promoción", ejemplo: "15/01/2025" },
  { variable: "{finPromocion}", descripcion: "Fecha de fin de la promoción", ejemplo: "15/02/2025" },
];

interface PromoForm {
  titulo: string;
  tipo: string;
  descuento: string;
  validoDesde: string;
  validoHasta: string;
  plantillaWhatsApp: string;
}

interface PromoDialogProps {
  open: boolean;
  editing: Promocion | null;
  form: PromoForm;
  onOpenChange: (open: boolean) => void;
  onFormChange: (form: PromoForm) => void;
  onSave: () => void;
}

function generateTemplate(form: PromoForm): string {
  const descuento = form.descuento || "0";
  const fechaHasta = form.validoHasta
    ? new Date(form.validoHasta).toLocaleDateString("es-ES", { day: "numeric", month: "long" })
    : "";

  const emojis = ["🎉", "🔥", "💪", "⭐", "🎁", "✨", "🏋️", "⚡"];
  const emoji = emojis[Math.floor(Math.random() * emojis.length)];

  const templates: Record<string, string> = {
    vencimiento_proximo: `¡Hola {nombre}! ${emoji}\n\n⏰ ¡Tu membresía está por vencer!\n\n📌 ${form.titulo}\n💰 ${descuento}% de descuento${fechaHasta ? `\n📅 Válido hasta el ${fechaHasta}` : ''}\n\n🏃 ¡No dejes pasar esta oportunidad! Renueva ahora y sigue entrenando al máximo. 🔥\n\nTe esperamos 💪`,
    membresia_expirada: `¡Hola {nombre}! ${emoji}\n\n😢 ¡Te extrañamos en el gym! Pero tenemos una sorpresa...\n\n📌 ${form.titulo}\n💰 ${descuento}% de descuento${fechaHasta ? `\n📅 Válido hasta el ${fechaHasta}` : ''}\n\n🏋️ ¡Regresa con más fuerza que nunca! Tu lugar te espera. 🔥\n\nTe esperamos 💪`,
    bienvenida: `¡Hola {nombre}! ${emoji}\n\n👋 ¡Bienvenido a la familia del gym!\n\n📌 ${form.titulo}\n💰 ${descuento}% de descuento${fechaHasta ? `\n📅 Válido hasta el ${fechaHasta}` : ''}\n\n💪 ¡Empieza hoy tu transformación! Estamos aquí para ayudarte a alcanzar tus metas. 🔥\n\nTe esperamos 🏋️`,
    especial: `¡Hola {nombre}! ${emoji}\n\n🎊 ¡Tenemos una oferta especial para ti!\n\n📌 ${form.titulo}\n💰 ${descuento}% de descuento${fechaHasta ? `\n📅 Válido hasta el ${fechaHasta}` : ''}\n\n✨ No dejes pasar esta promoción exclusiva. ¡Aprovecha ahora! 🔥\n\nTe esperamos 💪`,
  };

  return templates[form.tipo] || templates.especial;
}

export function PromoDialog({ open, editing, form, onOpenChange, onFormChange, onSave }: PromoDialogProps) {
  const [aiGenerating, setAiGenerating] = useState(false);
  const isEditing = !!editing;

  const handleGenerateTemplate = () => {
    if (!form.titulo) {
      toast({ title: "Completa el título primero", description: "Escribe el título de la promoción para generar la plantilla", variant: "destructive" });
      return;
    }
    onFormChange({ ...form, plantillaWhatsApp: generateTemplate(form) });
    toast({ title: "✨ Plantilla generada", description: "Puedes personalizarla antes de enviar" });
  };

  const handleGenerateWithAI = async () => {
    if (!form.descuento) {
      toast({ title: "Completa el descuento primero", description: "Ingresa el porcentaje de descuento para generar", variant: "destructive" });
      return;
    }

    setAiGenerating(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: form.tipo,
          descuento: parseInt(form.descuento),
          finPromocion: form.validoHasta,
        }),
      });

      if (!res.ok) throw new Error("Error en la respuesta");

      const data = await res.json();
      onFormChange({
        ...form,
        titulo: data.titulo,
        plantillaWhatsApp: data.plantillaWhatsApp,
      });
      toast({ title: "🤖 IA: Contenido generado", description: "Título y plantilla creados automáticamente" });
    } catch {
      toast({ title: "Error", description: "No se pudo generar con IA", variant: "destructive" });
    } finally {
      setAiGenerating(false);
    }
  };

  const insertVariable = (variable: string) => {
    onFormChange({ ...form, plantillaWhatsApp: form.plantillaWhatsApp + variable });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg flex flex-col max-h-[90vh]">
        <DialogHeader className="shrink-0">
          <DialogTitle>{isEditing ? "Editar Promoción" : "Nueva Promoción"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Modifica los datos de la promoción" : "Crea una nueva promoción para enviar a clientes"}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto min-h-0 space-y-5 px-1 py-1">
          <div>
            <Label htmlFor="titulo" className="mb-1.5 block">Título</Label>
            <Input
              id="titulo"
              value={form.titulo}
              onChange={(e) => onFormChange({ ...form, titulo: e.target.value })}
              placeholder="Ej: Descuento de Verano"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tipo" className="mb-1.5 block">Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => onFormChange({ ...form, tipo: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="especial">Especial</SelectItem>
                  <SelectItem value="bienvenida">Bienvenida</SelectItem>
                  <SelectItem value="vencimiento_proximo">Vencimiento Próximo</SelectItem>
                  <SelectItem value="membresia_expirada">Membresía Expirada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="descuento" className="mb-1.5 block">Descuento (%)</Label>
              <Input
                id="descuento"
                type="number"
                min="0"
                max="100"
                value={form.descuento}
                onChange={(e) => onFormChange({ ...form, descuento: e.target.value })}
                placeholder="15"
              />
            </div>
          </div>
          <Button
            type="button"
            variant="default"
            size="sm"
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white gap-2 h-9"
            onClick={handleGenerateWithAI}
            disabled={aiGenerating}
          >
            {aiGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generar todo con IA
              </>
            )}
          </Button>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="validoDesde" className="mb-1.5 block">Válido desde</Label>
              <Input
                id="validoDesde"
                type="date"
                value={form.validoDesde}
                onChange={(e) => onFormChange({ ...form, validoDesde: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="validoHasta" className="mb-1.5 block">Válido hasta</Label>
              <Input
                id="validoHasta"
                type="date"
                value={form.validoHasta}
                onChange={(e) => onFormChange({ ...form, validoHasta: e.target.value })}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label htmlFor="plantilla">Mensaje WhatsApp</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={handleGenerateTemplate}
                title="Genera automáticamente una plantilla con emojis basada en los datos de la promoción"
              >
                ✨ Generar plantilla
              </Button>
            </div>
            <Textarea
              id="plantilla"
              value={form.plantillaWhatsApp}
              onChange={(e) => onFormChange({ ...form, plantillaWhatsApp: e.target.value })}
              placeholder="¡Hola {nombre}! Tenemos una oferta especial para ti..."
              rows={3}
              className="min-h-[72px] resize-none"
            />

            <div className="mt-3 p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Variables disponibles</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {WHATSAPP_VARIABLES.map((v) => (
                  <Button
                    key={v.variable}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => insertVariable(v.variable)}
                    title={`${v.descripcion}\nEjemplo: ${v.ejemplo}`}
                  >
                    {v.variable}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="shrink-0 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSave} className="bg-emerald-500 hover:bg-emerald-600">
            {isEditing ? "Guardar Cambios" : "Crear Promoción"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}