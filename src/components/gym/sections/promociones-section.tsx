"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Plus,
  Edit,
  Trash2,
  Megaphone,
  Send,
  Calendar,
  Percent,
  Search,
  Loader2,
  XCircle,
  Smartphone,
  Info,
  Sparkles,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { WhatsAppConnection } from "../whatsapp-connection";
import type { Promocion, Cliente, AuthUser } from "../types";

interface PromocionesSectionProps {
  promociones: Promocion[];
  clientes: Cliente[];
  user: AuthUser;
  onRefresh?: () => void;
}

// Variables disponibles para las plantillas de WhatsApp
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

export function PromocionesSection({ promociones, clientes, user, onRefresh }: PromocionesSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [selectedPromocion, setSelectedPromocion] = useState<Promocion | null>(null);
  const [selectedClientes, setSelectedClientes] = useState<Set<string>>(new Set());
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [sending, setSending] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [form, setForm] = useState({
    titulo: "",
    tipo: "especial",
    descuento: "",
    validoDesde: new Date().toISOString().split("T")[0],
    validoHasta: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    plantillaWhatsApp: "",
  });

  // Verificar permisos
  const canCreate = user.rol === 'SUPER_USUARIO' || user.rol === 'ADMINISTRADOR';
  const canEdit = user.rol === 'SUPER_USUARIO' || user.rol === 'ADMINISTRADOR';
  const canDelete = user.rol === 'SUPER_USUARIO' || user.rol === 'ADMINISTRADOR';

  const handleSave = async () => {
    if (!form.titulo || !form.descuento) {
      toast({ title: "Error", description: "Complete todos los campos obligatorios", variant: "destructive" });
      return;
    }

    try {
      const data = {
        titulo: form.titulo,
        tipo: form.tipo,
        descuento: parseFloat(form.descuento),
        validoDesde: new Date(form.validoDesde),
        validoHasta: new Date(form.validoHasta),
        plantillaWhatsApp: form.plantillaWhatsApp || null,
      };

      let res;
      if (selectedPromocion) {
        res = await fetch(`/api/promociones/${selectedPromocion.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } else {
        res = await fetch("/api/promociones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }

      if (res.ok) {
        toast({ title: "Éxito", description: selectedPromocion ? "Promoción actualizada" : "Promoción creada" });
        setShowDialog(false);
        resetForm();
        onRefresh?.();
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.error || "No se pudo guardar", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Error al guardar promoción", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar esta promoción?")) return;

    try {
      const res = await fetch(`/api/promociones/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Éxito", description: "Promoción eliminada" });
        onRefresh?.();
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.error || "No se pudo eliminar", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Error al eliminar promoción", variant: "destructive" });
    }
  };

  const openSendDialog = (promo: Promocion) => {
    setSelectedPromocion(promo);
    setSelectedClientes(new Set());
    setShowSendDialog(true);
  };

  // Filtrar clientes según el tipo de promoción
  const getClientesFiltrados = (tipoPromocion: string) => {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    switch (tipoPromocion) {
      case "bienvenida":
        // Clientes registrados que NO tienen membresía activa
        return clientes.filter(c => {
          if (!c.telefono) return false;
          const tieneMembresiaActiva = c.membresias?.some(m => m.estado === "ACTIVA");
          return !tieneMembresiaActiva;
        });

      case "vencimiento_proximo":
        // Clientes con membresía que vence en los próximos 7 días
        return clientes.filter(c => {
          if (!c.telefono) return false;
          return c.membresias?.some(m => {
            if (m.estado !== "ACTIVA") return false;
            const fechaFin = new Date(m.fechaFin);
            return fechaFin <= sevenDaysFromNow && fechaFin >= now;
          });
        });

      case "membresia_expirada":
        // Clientes con membresía expirada
        return clientes.filter(c => {
          if (!c.telefono) return false;
          return c.membresias?.some(m => {
            const fechaFin = new Date(m.fechaFin);
            return fechaFin < now;
          });
        });

      case "especial":
      default:
        // Todos los clientes con teléfono
        return clientes.filter(c => c.telefono);
    }
  };

  const toggleCliente = (clienteId: string) => {
    const newSelected = new Set(selectedClientes);
    if (newSelected.has(clienteId)) {
      newSelected.delete(clienteId);
    } else {
      newSelected.add(clienteId);
    }
    setSelectedClientes(newSelected);
  };

  const selectAllClientes = () => {
    const clientesFiltrados = getClientesFiltrados(selectedPromocion?.tipo || "especial");
    if (selectedClientes.size === clientesFiltrados.length) {
      setSelectedClientes(new Set());
    } else {
      setSelectedClientes(new Set(clientesFiltrados.map(c => c.id)));
    }
  };

  const handleSendPromotion = async () => {
    if (!selectedPromocion) return;
    
    if (selectedClientes.size === 0) {
      toast({ title: "Error", description: "Selecciona al menos un cliente", variant: "destructive" });
      return;
    }

    if (!whatsappConnected) {
      toast({ title: "Error", description: "WhatsApp no está conectado", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "promotion",
          promocionId: selectedPromocion.id,
          clienteIds: Array.from(selectedClientes)
        })
      });

      const result = await res.json();

      if (result.success) {
        toast({ 
          title: "Éxito", 
          description: `Promoción enviada a ${result.sent} clientes${result.failed > 0 ? ` (${result.failed} fallidos)` : ''}` 
        });
        setShowSendDialog(false);
        onRefresh?.();
      } else {
        toast({ title: "Error", description: result.error || "No se pudo enviar la promoción", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Error al enviar promoción", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const openCreateDialog = () => {
    if (!canCreate) {
      toast({ title: "Sin permisos", description: "No tiene permisos para crear promociones", variant: "destructive" });
      return;
    }
    resetForm();
    setSelectedPromocion(null);
    setShowDialog(true);
  };

  const openEditDialog = (promo: Promocion) => {
    if (!canEdit) {
      toast({ title: "Sin permisos", description: "No tiene permisos para editar promociones", variant: "destructive" });
      return;
    }
    setSelectedPromocion(promo);
    setForm({
      titulo: promo.titulo,
      tipo: promo.tipo,
      descuento: promo.descuento.toString(),
      validoDesde: new Date(promo.validoDesde).toISOString().split("T")[0],
      validoHasta: new Date(promo.validoHasta).toISOString().split("T")[0],
      plantillaWhatsApp: promo.plantillaWhatsApp || "",
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setForm({
      titulo: "",
      tipo: "especial",
      descuento: "",
      validoDesde: new Date().toISOString().split("T")[0],
      validoHasta: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      plantillaWhatsApp: "",
    });
  };

  const generateTemplate = () => {
    if (!form.titulo) {
      toast({ title: "Completa el título primero", description: "Escribe el título de la promoción para generar la plantilla", variant: "destructive" });
      return;
    }

    const descuento = form.descuento || "0";
    const fechaHasta = form.validoHasta 
      ? new Date(form.validoHasta).toLocaleDateString("es-ES", { day: "numeric", month: "long" })
      : "";

    // Emojis base
    const emojis = ["🎉", "🔥", "💪", "⭐", "🎁", "✨", "🏋️", "⚡"];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    
    const templates: Record<string, string> = {
      vencimiento_proximo: `¡Hola {nombre}! ${emoji}\n\n⏰ ¡Tu membresía está por vencer!\n\n📌 ${form.titulo}\n💰 ${descuento}% de descuento${fechaHasta ? `\n📅 Válido hasta el ${fechaHasta}` : ''}\n\n🏃 ¡No dejes pasar esta oportunidad! Renueva ahora y sigue entrenando al máximo. 🔥\n\nTe esperamos 💪`,
      
      membresia_expirada: `¡Hola {nombre}! ${emoji}\n\n😢 ¡Te extrañamos en el gym! Pero tenemos una sorpresa...\n\n📌 ${form.titulo}\n💰 ${descuento}% de descuento${fechaHasta ? `\n📅 Válido hasta el ${fechaHasta}` : ''}\n\n🏋️ ¡Regresa con más fuerza que nunca! Tu lugar te espera. 🔥\n\nTe esperamos 💪`,
      
      bienvenida: `¡Hola {nombre}! ${emoji}\n\n👋 ¡Bienvenido a la familia del gym!\n\n📌 ${form.titulo}\n💰 ${descuento}% de descuento${fechaHasta ? `\n📅 Válido hasta el ${fechaHasta}` : ''}\n\n💪 ¡Empieza hoy tu transformación! Estamos aquí para ayudarte a alcanzar tus metas. 🔥\n\nTe esperamos 🏋️`,
      
      especial: `¡Hola {nombre}! ${emoji}\n\n🎊 ¡Tenemos una oferta especial para ti!\n\n📌 ${form.titulo}\n💰 ${descuento}% de descuento${fechaHasta ? `\n📅 Válido hasta el ${fechaHasta}` : ''}\n\n✨ No dejes pasar esta promoción exclusiva. ¡Aprovecha ahora! 🔥\n\nTe esperamos 💪`,
    };

    const plantilla = templates[form.tipo] || templates.especial;
    setForm(prev => ({ ...prev, plantillaWhatsApp: plantilla }));
    toast({ title: "✨ Plantilla generada", description: "Puedes personalizarla antes de enviar" });
  };

  const generateWithAI = async () => {
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
      setForm(prev => ({
        ...prev,
        titulo: data.titulo,
        plantillaWhatsApp: data.plantillaWhatsApp,
      }));
      toast({ title: "🤖 IA: Contenido generado", description: "Título y plantilla creados automáticamente" });
    } catch {
      toast({ title: "Error", description: "No se pudo generar con IA", variant: "destructive" });
    } finally {
      setAiGenerating(false);
    }
  };

  const insertVariable = (variable: string) => {
    setForm(prev => ({
      ...prev,
      plantillaWhatsApp: prev.plantillaWhatsApp + variable
    }));
  };

  const filteredPromociones = promociones.filter(
    (p) =>
      p.titulo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTipoBadge = (tipo: string) => {
    const tipos: Record<string, { color: string; label: string }> = {
      vencimiento_proximo: { color: "bg-amber-500/20 text-amber-600", label: "Vencimiento Próximo" },
      membresia_expirada: { color: "bg-red-500/20 text-red-600", label: "Membresía Expirada" },
      especial: { color: "bg-purple-500/20 text-purple-600", label: "Especial" },
      bienvenida: { color: "bg-emerald-500/20 text-emerald-600", label: "Bienvenida" },
    };
    const config = tipos[tipo] || tipos.especial;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const isActive = (promo: Promocion) => {
    const now = new Date();
    return new Date(promo.validoDesde) <= now && new Date(promo.validoHasta) >= now && promo.activo;
  };

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
            <Megaphone className="w-5 h-5" />
            Promociones
          </h2>
          <p className="text-muted-foreground text-sm">
            Gestiona y envía promociones por WhatsApp
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar promociones..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {canCreate && (
            <Button
              className="bg-emerald-500 hover:bg-emerald-600"
              onClick={openCreateDialog}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva
            </Button>
          )}
        </div>
      </div>

      {/* WhatsApp Connection Card */}
      <WhatsAppConnection onConnectionChange={setWhatsappConnected} />

      {/* Promociones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="promociones-list">
        {filteredPromociones.map((promo) => (
          <Card key={promo.id} className={`relative ${!isActive(promo) ? "opacity-60" : ""}`}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{promo.titulo}</CardTitle>
                  <div className="mt-1">{getTipoBadge(promo.tipo)}</div>
                </div>
                <Badge variant={isActive(promo) ? "default" : "secondary"} className={isActive(promo) ? "bg-emerald-500" : ""}>
                  {isActive(promo) ? "Activa" : "Inactiva"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-emerald-600">
                  <Percent className="w-4 h-4" />
                  <span className="font-semibold">{promo.descuento}%</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(promo.validoHasta).toLocaleDateString("es-ES")}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Smartphone className="w-3 h-3" />
                  {promo._count?.envios || 0} envíos
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openSendDialog(promo)}
                    disabled={!isActive(promo)}
                    title={whatsappConnected ? "Enviar por WhatsApp" : "Conecta WhatsApp primero"}
                  >
                    <Send className={`w-4 h-4 ${whatsappConnected ? 'text-green-500' : 'text-muted-foreground'}`} />
                  </Button>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(promo)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500"
                      onClick={() => handleDelete(promo.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredPromociones.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No hay promociones</h3>
            <p className="text-muted-foreground">Crea tu primera promoción para enviar a los clientes</p>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg flex flex-col max-h-[90vh]">
          <DialogHeader className="shrink-0">
            <DialogTitle>{selectedPromocion ? "Editar Promoción" : "Nueva Promoción"}</DialogTitle>
            <DialogDescription>
              {selectedPromocion ? "Modifica los datos de la promoción" : "Crea una nueva promoción para enviar a clientes"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto min-h-0 space-y-5 px-1 py-1">
            <div>
              <Label htmlFor="titulo" className="mb-1.5 block">Título</Label>
              <Input
                id="titulo"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ej: Descuento de Verano"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo" className="mb-1.5 block">Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
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
                  onChange={(e) => setForm({ ...form, descuento: e.target.value })}
                  placeholder="15"
                />
              </div>
            </div>
            <Button
              type="button"
              variant="default"
              size="sm"
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white gap-2 h-9"
              onClick={generateWithAI}
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
                  onChange={(e) => setForm({ ...form, validoDesde: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="validoHasta" className="mb-1.5 block">Válido hasta</Label>
                <Input
                  id="validoHasta"
                  type="date"
                  value={form.validoHasta}
                  onChange={(e) => setForm({ ...form, validoHasta: e.target.value })}
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
                  onClick={generateTemplate}
                  title="Genera automáticamente una plantilla con emojis basada en los datos de la promoción"
                >
                  ✨ Generar plantilla
                </Button>
              </div>
              <Textarea
                id="plantilla"
                value={form.plantillaWhatsApp}
                onChange={(e) => setForm({ ...form, plantillaWhatsApp: e.target.value })}
                placeholder="¡Hola {nombre}! Tenemos una oferta especial para ti..."
                rows={3}
                className="min-h-[72px] resize-none"
              />
              
              {/* Variables disponibles */}
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
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-emerald-500 hover:bg-emerald-600">
              {selectedPromocion ? "Guardar Cambios" : "Crear Promoción"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-green-500" />
              Enviar Promoción por WhatsApp
            </DialogTitle>
            <DialogDescription>
              Selecciona los clientes a quienes enviar "{selectedPromocion?.titulo}"
            </DialogDescription>
          </DialogHeader>
          
          {!whatsappConnected && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800">
              <XCircle className="w-5 h-5 text-amber-500" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                WhatsApp no está conectado. Conéctalo primero arriba.
              </p>
            </div>
          )}

          <div className="py-4">
            {/* Info del tipo de promoción */}
            {selectedPromocion && (
              <div className="mb-3 p-2 rounded-lg bg-muted/50 border">
                <p className="text-xs text-muted-foreground">
                  {selectedPromocion.tipo === "bienvenida" && "📋 Clientes sin membresía activa"}
                  {selectedPromocion.tipo === "vencimiento_proximo" && "⏰ Clientes con membresía por vencer (7 días)"}
                  {selectedPromocion.tipo === "membresia_expirada" && "❌ Clientes con membresía expirada"}
                  {selectedPromocion.tipo === "especial" && "✨ Todos los clientes con teléfono"}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">
                {selectedClientes.size} de {getClientesFiltrados(selectedPromocion?.tipo || "especial").length} clientes seleccionados
              </p>
              <Button variant="outline" size="sm" onClick={selectAllClientes}>
                {selectedClientes.size === getClientesFiltrados(selectedPromocion?.tipo || "especial").length ? "Deseleccionar todos" : "Seleccionar todos"}
              </Button>
            </div>
            
            <ScrollArea className="h-64 border rounded-lg">
              <div className="p-2 space-y-1">
                {getClientesFiltrados(selectedPromocion?.tipo || "especial").map((cliente) => (
                  <label
                    key={cliente.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedClientes.has(cliente.id)}
                      onCheckedChange={() => toggleCliente(cliente.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{cliente.nombre} {cliente.apellido}</p>
                      <p className="text-xs text-muted-foreground">{cliente.telefono}</p>
                    </div>
                  </label>
                ))}
                
                {getClientesFiltrados(selectedPromocion?.tipo || "especial").length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No hay clientes que cumplan los criterios para esta promoción</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSendPromotion}
              disabled={sending || !whatsappConnected || selectedClientes.size === 0}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar ({selectedClientes.size})
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}