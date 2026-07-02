"use client";

import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";

// Components
import LoginPage from "@/components/auth/LoginPage";
import {
  Sidebar,
  Header,
  Footer,
  TourOverlay,
  DashboardSection,
  ClientesSection,
  AccesosSection,
  MembresiasSection,
  UsuariosSection,
  PromocionesSection,
  ReservasSection,
  ConfiguracionSection,
  ClienteDialog,
  ClienteDetailDialog,
  AccesoResultadoDialog,
} from "@/components/gym";

// Hooks
import { useAuth } from "@/hooks/use-auth";
import { useDataFetching } from "@/hooks/use-data-fetching";
import { useClientes } from "@/hooks/use-clientes";
import { useAccesos } from "@/hooks/use-accesos";
import { useTour } from "@/hooks/use-tour";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/hooks/use-toast";

// Types
import type { Cliente, ClienteForm, MembresiaForm, Reserva } from "@/components/gym/types";

export default function GymApp() {
  // Auth
  const { user, loading: authLoading, login, logout } = useAuth();
  const isMobile = useIsMobile();

  // Navigation state
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data fetching
  const {
    loading: dataLoading,
    dashboardData,
    clientes,
    membresias,
    clases,
    promociones,
    accesos,
    hasDemoData,
    fetchData,
    fetchAccesos,
    seedDatabase,
    clearDatabase,
  } = useDataFetching({ user });

  // Tour
  const {
    showTour,
    tourStep,
    currentSteps,
    closeTour,
    nextStep,
    prevStep,
    startSectionGuide,
    startWelcomeGuide,
  } = useTour({ activeSection });

  // Clientes
  const {
    showCreateDialog: showClienteDialog,
    showEditDialog: showEditClienteDialog,
    showDetailDialog: showClienteDetailDialog,
    selectedCliente,
    searchQuery: searchCliente,
    form: clienteForm,
    filteredClientes,
    setShowCreateDialog: setShowClienteDialog,
    setShowEditDialog: setShowEditClienteDialog,
    setShowDetailDialog: setShowClienteDetailDialog,
    setSearchQuery: setSearchCliente,
    setForm: setClienteForm,
    createCliente,
    updateCliente,
    openCreateDialog,
    openEditDialog,
    openDetailDialog,
  } = useClientes({ user, clientes, onRefresh: fetchData });

  // Accesos
  const {
    showResultadoDialog,
    resultado: accesoResultado,
    codigoAcceso,
    huellaAcceso,
    tipoAcceso,
    isCapturing,
    setShowResultadoDialog,
    setCodigoAcceso,
    setHuellaAcceso,
    setTipoAcceso,
    verificarAcceso,
    setupAccessFromCliente,
    captureFromLector,
  } = useAccesos({ user, onRefreshAccesos: () => fetchAccesos() });

  // Membresias state
  const [showMembresiaDialog, setShowMembresiaDialog] = useState(false);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<typeof membresias[0] | null>(null);
  const [busquedaHuella, setBusquedaHuella] = useState("");
  const [clienteEncontrado, setClienteEncontrado] = useState<Cliente | null>(null);
  const [membresiaForm, setMembresiaForm] = useState<MembresiaForm>({
    clienteId: "",
    membresiaId: "",
    metodoPago: "Efectivo",
    fechaInicio: new Date().toISOString().split('T')[0],
  });
  const [planForm, setPlanForm] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    duracionDias: "30",
  });

  // Reservas state
  const [reservas, setReservas] = useState<Reserva[]>([]);

  // Promoción activation from dashboard
  const [promoActivation, setPromoActivation] = useState<{
    clienteId: string;
    tipo: "membresia_expirada" | "vencimiento_proximo";
  } | null>(null);

  // Fetch reservas on section change
  const fetchReservas = async () => {
    try {
      const res = await fetch("/api/reservas");
      if (res.ok) {
        setReservas(await res.json());
      }
    } catch (error) {
      console.error("Error fetching reservas:", error);
    }
  };

  // Handle section changes to trigger data fetching
  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    if (section === "reservas") {
      fetchReservas();
    }
  };
  // Fetch accesos when the section is active
  React.useEffect(() => {
    if (activeSection === "accesos") {
      fetchAccesos();
    }
  }, [activeSection]);

  // Handlers
  const handleLogout = async () => {
    await logout();
    setActiveSection("dashboard");
  };

  const handleLoadDemo = async () => {
    await seedDatabase();
  };

  const handleClearDemo = async () => {
    await clearDatabase();
  };

  // Handle biometric search for membresias
  const handleBusquedaHuella = (huella: string) => {
    setBusquedaHuella(huella);
    const cliente = clientes.find(c =>
      c.huellaBiometrica?.toLowerCase().includes(huella.toLowerCase())
    );
    setClienteEncontrado(cliente || null);
    if (cliente) {
      // Revisar si el cliente tiene una membresía activa
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const membresiaActiva = cliente.membresias?.find(m => {
        const fechaFin = new Date(m.fechaFin);
        return m.estado === "activa" && fechaFin >= hoy;
      });

      let fechaInicio = new Date().toISOString().split('T')[0];
      if (membresiaActiva) {
        // Si tiene membresía activa, la fecha de inicio debe ser justo después del término
        const fechaFinActiva = new Date(membresiaActiva.fechaFin);
        fechaFinActiva.setDate(fechaFinActiva.getDate() + 1);
        fechaInicio = fechaFinActiva.toISOString().split('T')[0];
      }

      setMembresiaForm(prev => ({
        ...prev,
        clienteId: cliente.id,
        fechaInicio,
      }));
    }
  };

  // Handle clear cliente search
  const handleClearCliente = () => {
    setBusquedaHuella("");
    setClienteEncontrado(null);
    setMembresiaForm(prev => ({ ...prev, clienteId: "" }));
  };

  // Handle assign membresia
  const handleAssignMembresia = async () => {
    try {
      const res = await fetch("/api/membresias-cliente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(membresiaForm),
      });
      if (res.ok) {
        toast({ title: "Membresía asignada exitosamente" });
        setShowMembresiaDialog(false);
        setMembresiaForm({ clienteId: "", membresiaId: "", metodoPago: "Efectivo", fechaInicio: new Date().toISOString().split('T')[0] });
        fetchData();
      }
    } catch {
      toast({ title: "Error al asignar membresía", variant: "destructive" });
    }
  };

  // Handle plan save
  const handleSavePlan = async () => {
    try {
      const data = {
        nombre: planForm.nombre,
        descripcion: planForm.descripcion,
        precio: parseFloat(planForm.precio),
        duracionDias: parseInt(planForm.duracionDias),
      };

      let res;
      if (selectedPlan) {
        res = await fetch(`/api/membresias/${selectedPlan.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } else {
        res = await fetch("/api/membresias", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }

      if (res.ok) {
        toast({ title: selectedPlan ? "Plan actualizado" : "Plan creado" });
        setShowPlanDialog(false);
        setSelectedPlan(null);
        setPlanForm({ nombre: "", descripcion: "", precio: "", duracionDias: "30" });
        fetchData();
      }
    } catch {
      toast({ title: "Error al guardar el plan", variant: "destructive" });
    }
  };

  // Handle delete plan
  const handleDeletePlan = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este plan?")) return;
    try {
      const res = await fetch(`/api/membresias/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Plan eliminado" });
        fetchData();
      }
    } catch {
      toast({ title: "Error al eliminar el plan", variant: "destructive" });
    }
  };

  // Handle edit plan
  const handleEditPlan = (plan: typeof membresias[0]) => {
    setSelectedPlan(plan);
    setPlanForm({
      nombre: plan.nombre,
      descripcion: plan.descripcion || "",
      precio: plan.precio.toString(),
      duracionDias: plan.duracionDias.toString(),
    });
    setShowPlanDialog(true);
  };

  // Handle register access from cliente detail
  const handleRegisterAccess = (cliente: Cliente) => {
    setupAccessFromCliente(cliente);
    setShowClienteDetailDialog(false);
    setActiveSection("accesos");
  };

  // Handle assign membership from cliente detail
  const handleAssignMembership = (cliente: Cliente) => {
    setMembresiaForm({ ...membresiaForm, clienteId: cliente.id });
    setShowClienteDetailDialog(false);
    setActiveSection("membresias");
  };

  // Handle go to membresias from acceso resultado
  const handleRenovarMembresia = () => {
    setShowResultadoDialog(false);
    setActiveSection("membresias");
  };

  // Handle send promotion from dashboard alerts
  const handleSendPromotionFromDashboard = (clienteId: string, tipoAlerta: "vencer" | "expirado") => {
    const tipo = tipoAlerta === "vencer" ? "vencimiento_proximo" : "membresia_expirada";
    setPromoActivation({ clienteId, tipo });
    setActiveSection("promociones");
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) {
    return <LoginPage onLogin={login} />;
  }

  // Show loading while fetching data
  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <Sidebar
        user={user}
        activeSection={activeSection}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onSectionChange={handleSectionChange}
        onShowGuide={() => startSectionGuide(activeSection)}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <Header
          activeSection={activeSection}
          hasDemoData={hasDemoData}
          onLoadDemo={handleLoadDemo}
          onClearDemo={handleClearDemo}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          isMobile={isMobile}
        />

        {/* Content */}
        <div className="flex-1 p-2 sm:p-4 md:p-6 overflow-x-hidden overflow-y-auto" id="dashboard-section">
          <AnimatePresence mode="wait">
            {/* Dashboard Section */}
            {activeSection === "dashboard" && dashboardData && (
              <DashboardSection data={dashboardData} userRol={user.rol} onSendPromotion={handleSendPromotionFromDashboard} />
            )}

            {/* Clientes Section */}
            {activeSection === "clientes" && (
              <ClientesSection
                clientes={clientes}
                searchQuery={searchCliente}
                onSearchChange={setSearchCliente}
                onNewCliente={openCreateDialog}
                onEditCliente={openEditDialog}
                onSelectCliente={openDetailDialog}
              />
            )}

            {/* Membresias Section */}
            {activeSection === "membresias" && (
              <MembresiasSection
                membresias={membresias}
                clientes={clientes}
                busquedaHuella={busquedaHuella}
                clienteEncontrado={clienteEncontrado}
                membresiaForm={membresiaForm}
                showPlanDialog={showPlanDialog}
                showAssignDialog={showMembresiaDialog}
                selectedPlan={selectedPlan}
                planForm={planForm}
                user={user}
                onBusquedaHuellaChange={handleBusquedaHuella}
                onClearCliente={handleClearCliente}
                onMembresiaFormChange={setMembresiaForm}
                onShowPlanDialog={setShowPlanDialog}
                onShowAssignDialog={setShowMembresiaDialog}
                onSelectedPlanChange={setSelectedPlan}
                onPlanFormChange={setPlanForm}
                onAssignMembresia={handleAssignMembresia}
                onSavePlan={handleSavePlan}
                onDeletePlan={handleDeletePlan}
                onEditPlan={handleEditPlan}
              />
            )}

            {/* Reservas Section */}
            {activeSection === "reservas" && (
              <ReservasSection
                reservas={reservas}
                clases={clases}
                clientes={clientes}
                user={user}
                onRefresh={fetchData}
              />
            )}

            {/* Accesos Section */}
            {activeSection === "accesos" && (
              <AccesosSection
                accesos={accesos}
                clientes={clientes}
                codigoAcceso={codigoAcceso}
                huellaAcceso={huellaAcceso}
                tipoAcceso={tipoAcceso}
                onCodigoChange={setCodigoAcceso}
                onHuellaChange={setHuellaAcceso}
                onTipoChange={setTipoAcceso}
                onVerify={verificarAcceso}
                onCaptureFingerprint={captureFromLector}
                isCapturing={isCapturing}
              />
            )}

            {/* Promociones Section */}
            {activeSection === "promociones" && (
              <PromocionesSection
                promociones={promociones}
                clientes={clientes}
                user={user}
                onRefresh={fetchData}
                activation={promoActivation}
                onActivationHandled={() => setPromoActivation(null)}
              />
            )}

            {/* Usuarios Section */}
            {activeSection === "usuarios" && (
              <UsuariosSection user={user} />
            )}

            {/* Configuracion Section */}
            {activeSection === "configuracion" && (
              <ConfiguracionSection userRol={user?.rol || ""} onRefresh={fetchData} />
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <Footer />
      </main>

      {/* Tour Overlay */}
      <TourOverlay
        show={showTour}
        steps={currentSteps}
        currentStep={tourStep}
        onNext={nextStep}
        onPrev={prevStep}
        onClose={closeTour}
      />

      {/* Cliente Create Dialog */}
      <ClienteDialog
        open={showClienteDialog}
        isEditing={false}
        form={clienteForm}
        onOpenChange={setShowClienteDialog}
        onFormChange={setClienteForm}
        onSubmit={createCliente}
      />

      {/* Cliente Edit Dialog */}
      <ClienteDialog
        open={showEditClienteDialog}
        isEditing={true}
        form={clienteForm}
        onOpenChange={setShowEditClienteDialog}
        onFormChange={setClienteForm}
        onSubmit={updateCliente}
        selectedCliente={selectedCliente}
      />

      {/* Cliente Detail Dialog */}
      <ClienteDetailDialog
        open={showClienteDetailDialog}
        cliente={selectedCliente}
        onOpenChange={setShowClienteDetailDialog}
        onRegisterAccess={handleRegisterAccess}
        onAssignMembership={handleAssignMembership}
      />

      {/* Acceso Resultado Dialog */}
      <AccesoResultadoDialog
        open={showResultadoDialog}
        resultado={accesoResultado}
        onOpenChange={setShowResultadoDialog}
        onRenovar={handleRenovarMembresia}
      />
    </div>
  );
}