"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import type { Membresia } from "../../types";

interface PlanCardProps {
  plan: Membresia;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (plan: Membresia) => void;
  onDelete: (id: string) => void;
}

export function PlanCard({ plan, canEdit, canDelete, onEdit, onDelete }: PlanCardProps) {
  return (
    <Card className="relative overflow-hidden flex flex-col">
      <CardHeader className="pb-1.5 sm:pb-3 px-3 sm:px-6">
        <CardTitle className="flex items-start justify-between gap-1">
          <span className="text-sm sm:text-lg font-semibold leading-tight line-clamp-2 flex-1 min-w-0">{plan.nombre}</span>
          <div className="flex gap-0.5 shrink-0">
            {canEdit && (
              <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-8 sm:w-8"
                onClick={() => onEdit(plan)}><Edit className="w-3 h-3 sm:w-4 sm:h-4" /></Button>
            )}
            {canDelete && (
              <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-8 sm:w-8 text-red-500"
                onClick={() => onDelete(plan.id)}><Trash2 className="w-3 h-3 sm:w-4 sm:h-4" /></Button>
            )}
          </div>
        </CardTitle>
        {plan.descripcion && <CardDescription className="text-[10px] sm:text-xs mt-1 line-clamp-2">{plan.descripcion}</CardDescription>}
      </CardHeader>
      <CardContent className="pb-3 sm:pb-5 px-3 sm:px-6 mt-auto">
        <div className="flex items-end justify-between gap-1">
          <div className="min-w-0">
            <span className="text-base sm:text-2xl font-bold text-emerald-600 leading-tight">S/ {plan.precio}</span>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
              {plan._count?.clientesMembresia || 0} clientes
            </p>
          </div>
          <Badge variant="outline" className="text-[10px] sm:text-xs shrink-0">{plan.duracionDias}d</Badge>
        </div>
      </CardContent>
    </Card>
  );
}