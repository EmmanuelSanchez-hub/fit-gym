"use client";

import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import type { AccesoResultado, Cliente, AuthUser } from "@/components/gym/types";

interface UseAccesosProps {
  user: AuthUser | null;
  onRefreshAccesos: () => void;
}

export function useAccesos({ user, onRefreshAccesos }: UseAccesosProps) {
  const [showResultadoDialog, setShowResultadoDialog] = useState(false);
  const [resultado, setResultado] = useState<AccesoResultado | null>(null);
  const [codigoAcceso, setCodigoAcceso] = useState("");
  const [huellaAcceso, setHuellaAcceso] = useState("");
  const [tipoAcceso, setTipoAcceso] = useState("entrada");
  const [isCapturing, setIsCapturing] = useState(false);

  /**
   * Captura la huella desde el lector biométrico local (Windows App)
   * y la guarda en el estado huellaAcceso para luego verificarla
   */
  const captureFromLector = async (): Promise<boolean> => {
    setIsCapturing(true);
    try {
      // Capturar huella directamente (el proxy se encarga del servicio)
      toast({
        title: "Coloca el dedo en el lector",
        description: "Esperando captura de huella...",
      });

      const captureRes = await fetch('/api/fingerprint/capture', {
        method: "POST",
      });
      if (!captureRes.ok) throw new Error("Error al capturar huella");

      const data = await captureRes.json();

      if (data.success && data.template) {
        setHuellaAcceso(data.template);
        toast({
          title: "Huella capturada",
          description: `Calidad: ${data.quality}%`,
        });
        return true;
      } else {
        toast({
          title: "Error",
          description: data.error || "No se pudo capturar la huella",
          variant: "destructive",
        });
        return false;
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error al comunicarse con el lector";
      toast({
        title: "Error",
        description: `${message}. Usa el campo manual como alternativa.`,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsCapturing(false);
    }
  };

  const verificarAcceso = async () => {
    const huellaValue = huellaAcceso.trim();
    const codigoValue = codigoAcceso.trim();

    if (!huellaValue && !codigoValue) {
      toast({ title: "Error", description: "Ingrese un código de acceso o capture la huella biométrica", variant: "destructive" });
      return;
    }

    try {
      // Si es por huella, buscar cliente primero
      if (huellaValue) {
        const searchRes = await fetch('/api/fingerprint/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ template: huellaValue }),
        });

        if (searchRes.ok) {
          const searchData = await searchRes.json();
          
          if (!searchData.found) {
            // Huella no registrada - mostrar opción de registrar
            toast({
              title: "Huella no registrada",
              description: "Esta huella no está asociada a ningún cliente. Ve a Clientes → Nuevo Cliente para registrarla.",
              variant: "destructive",
            });
            return;
          }
        }
      }

      // Determinar el método basado en qué campo se usó
      const usaHuella = !!huellaValue;
      const metodo = usaHuella ? "biometrico" : "codigo";

      const body: Record<string, unknown> = {
        tipo: tipoAcceso,
        metodo,
        empleadoId: user?.empleadoId,
      };

      // Solo enviar el campo correspondiente al método usado
      if (usaHuella) {
        body.huellaBiometrica = huellaValue;
      } else {
        body.codigoAcceso = codigoValue;
      }

      const res = await fetch("/api/accesos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setResultado(data);
      setShowResultadoDialog(true);
      onRefreshAccesos();

      // Limpiar campos después de verificar
      setCodigoAcceso("");
      setHuellaAcceso("");
    } catch {
      setResultado({ exitoso: false, mensaje: "Error al verificar acceso" });
      setShowResultadoDialog(true);
    }
  };

  const setupAccessFromCliente = (cliente: Cliente) => {
    setCodigoAcceso(cliente.codigoAcceso);
    setHuellaAcceso(cliente.huellaBiometrica || "");
    setTipoAcceso("entrada");
  };

  return {
    // State
    showResultadoDialog,
    resultado,
    codigoAcceso,
    huellaAcceso,
    tipoAcceso,
    isCapturing,
    // Actions
    setShowResultadoDialog,
    setCodigoAcceso,
    setHuellaAcceso,
    setTipoAcceso,
    verificarAcceso,
    setupAccessFromCliente,
    captureFromLector,
  };
}