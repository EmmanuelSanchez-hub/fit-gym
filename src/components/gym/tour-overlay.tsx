"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TourStep } from "./types";

interface TourOverlayProps {
  show: boolean;
  steps: TourStep[];
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

export function TourOverlay({
  show,
  steps,
  currentStep,
  onNext,
  onPrev,
  onClose,
}: TourOverlayProps) {
  if (!show || steps.length === 0) return null;

  const step = steps[currentStep];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="absolute bg-card border border-border rounded-lg shadow-xl p-6 max-w-md"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold">{step.title}</h3>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-muted-foreground mb-6">{step.content}</p>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {currentStep + 1} de {steps.length}
            </div>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="outline" size="sm" onClick={onPrev}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>
              )}
              <Button size="sm" onClick={onNext} className="bg-emerald-500 hover:bg-emerald-600">
                {currentStep < steps.length - 1 ? (
                  <>
                    Siguiente
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                ) : (
                  "Finalizar"
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
