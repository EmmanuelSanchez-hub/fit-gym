"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { PlanCard } from "./membresias/plan-card";
import { PlanDialog } from "./membresias/plan-dialog";
import { AssignForm } from "./membresias/assign-form";
import type { Membresia, Cliente, MembresiaForm, AuthUser } from "../types";

interface MembresiasSectionProps {
  membresias: Membresia[];
  clientes: Cliente[];
  busquedaHuella: string;
  clienteEncontrado: Cliente | null;
  membresiaForm: MembresiaForm;
  showPlanDialog: boolean;
  showAssignDialog: boolean;
  selectedPlan: Membresia | null;
  planForm: { nombre: string; descripcion: string; precio: string; duracionDias: string };
  user: AuthUser;
  onBusquedaHuellaChange: (huella: string) => void;
  onClearCliente: () => void;
  onMembresiaFormChange: (form: MembresiaForm) => void;
  onShowPlanDialog: (show: boolean) => void;
  onShowAssignDialog: (show: boolean) => void;
  onSelectedPlanChange: (plan: Membresia | null) => void;
  onPlanFormChange: (form: { nombre: string; descripcion: string; precio: string; duracionDias: string }) => void;
  onAssignMembresia: () => void;
  onSavePlan: () => void;
  onDeletePlan: (id: string) => void;
  onEditPlan: (plan: Membresia) => void;
}

export function MembresiasSection({
  membresias, clientes, busquedaHuella, clienteEncontrado, membresiaForm,
  showPlanDialog, selectedPlan, planForm, user,
  onBusquedaHuellaChange, onClearCliente, onMembresiaFormChange,
  onShowPlanDialog, onSelectedPlanChange, onPlanFormChange,
  onAssignMembresia, onSavePlan, onDeletePlan, onEditPlan,
}: MembresiasSectionProps) {

  const canCreatePlan = user.rol === 'SUPER_USUARIO' || user.rol === 'ADMINISTRADOR';
  const canEditPlan = canCreatePlan;
  const canDeletePlan = canCreatePlan;

  const handleNewPlan = () => {
    if (!canCreatePlan) { toast({ title: "Sin permisos", description: "No tiene permisos para crear planes", variant: "destructive" }); return; }
    onSelectedPlanChange(null);
    onPlanFormChange({ nombre: "", descripcion: "", precio: "", duracionDias: "30" });
    onShowPlanDialog(true);
  };

  const handleEditPlan = (plan: Membresia) => {
    if (!canEditPlan) { toast({ title: "Sin permisos", description: "No tiene permisos para editar planes", variant: "destructive" }); return; }
    onEditPlan(plan);
  };

  const handleDeletePlan = (id: string) => {
    if (!canDeletePlan) { toast({ title: "Sin permisos", description: "No tiene permisos para eliminar planes", variant: "destructive" }); return; }
    onDeletePlan(id);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4 sm:space-y-6">

      {/* Plans Section */}
      <div id="planes-section">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold">Planes de Membresía</h2>
          {canCreatePlan && (
            <Button onClick={handleNewPlan} size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-xs sm:text-sm h-8 sm:h-9">
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />Nuevo Plan
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
          {membresias.map((plan) => (
            <PlanCard key={plan.id} plan={plan} canEdit={canEditPlan} canDelete={canDeletePlan} onEdit={handleEditPlan} onDelete={handleDeletePlan} />
          ))}
        </div>
      </div>

      {/* Biometric Search & Assign */}
      <AssignForm
        membresias={membresias}
        clientes={clientes}
        busquedaHuella={busquedaHuella}
        clienteEncontrado={clienteEncontrado}
        membresiaForm={membresiaForm}
        onBusquedaHuellaChange={onBusquedaHuellaChange}
        onClearCliente={onClearCliente}
        onMembresiaFormChange={onMembresiaFormChange}
        onAssign={onAssignMembresia}
      />

      {/* Plan Dialog */}
      <PlanDialog open={showPlanDialog} editing={selectedPlan} form={planForm} onOpenChange={onShowPlanDialog} onFormChange={onPlanFormChange} onSave={onSavePlan} />
    </motion.div>
  );
}