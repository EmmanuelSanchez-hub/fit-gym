"use client";

import { Separator } from "@/components/ui/separator";
import { Dumbbell, Flame } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border px-6 py-4 mt-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Dumbbell className="w-4 h-4 text-emerald-500" />
          <span>FitGym Pro © {new Date().getFullYear()}</span>
          <Separator orientation="vertical" className="h-4" />
          <span>Sistema de Gestión de Gimnasio</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
  <span>Solución optimizada</span>
  <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
  <span>CaboFit</span>
</div>
      </div>
    </footer>
  );
}
