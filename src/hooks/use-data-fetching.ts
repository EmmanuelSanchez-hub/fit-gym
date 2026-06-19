"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import type { 
  DashboardData, 
  Empleado, 
  Cliente, 
  Membresia, 
  Clase, 
  Promocion,
  Acceso,
  SystemUser,
  AuthUser 
} from "@/components/gym/types";

interface UseDataFetchingProps {
  user: AuthUser | null;
}

export function useDataFetching({ user }: UseDataFetchingProps) {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [membresias, setMembresias] = useState<Membresia[]>([]);
  const [clases, setClases] = useState<Clase[]>([]);
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [accesos, setAccesos] = useState<Acceso[]>([]);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [hasDemoData, setHasDemoData] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [dashRes, empRes, cliRes, memRes, clasRes, promRes] = await Promise.all([
        fetch("/api/dashboard"),
        fetch("/api/empleados"),
        fetch("/api/clientes"),
        fetch("/api/membresias"),
        fetch("/api/clases"),
        fetch("/api/promociones"),
      ]);

      if (dashRes.ok) setDashboardData(await dashRes.json());
      if (empRes.ok) setEmpleados(await empRes.json());
      if (cliRes.ok) setClientes(await cliRes.json());
      if (memRes.ok) setMembresias(await memRes.json());
      if (clasRes.ok) setClases(await clasRes.json());
      if (promRes.ok) setPromociones(await promRes.json());
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ title: "Error", description: "No se pudieron cargar los datos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user?.rol, user?.empleadoId]);

  const fetchAccesos = async (limit = 20) => {
    try {
      const res = await fetch(`/api/accesos?limite=${limit}`);
      if (res.ok) {
        const data = await res.json();
        setAccesos(data);
      }
    } catch (error) {
      console.error("Error fetching accesos:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) setSystemUsers(await res.json());
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // Check demo data
  // Solo considerar que hay datos demo si existen empleados demo ADICIONALES al super usuario
  // El super@gym.com se crea durante el setup inicial, no durante la carga de demo
  useEffect(() => {
    const checkDemoData = () => {
      // Excluir super@gym.com porque ese se crea en el setup inicial
      const demoEmailsExcludingSuper = ['maria@gym.com', 'carlos@gym.com', 'ana@gym.com', 'pedro@gym.com'];
      const hasDemo = empleados.some(e =>
        e.email.includes('@gym.com') &&
        demoEmailsExcludingSuper.includes(e.email)
      );
      setHasDemoData(hasDemo);
    };
    checkDemoData();
  }, [empleados]);

  // Initial data fetch - solo si hay usuario autenticado
  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Data fetching in useEffect is a standard React pattern
      fetchData();
    }
  }, [fetchData, user]);

  // Fetch accesos on mount - solo si hay usuario
  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Data fetching in useEffect is a standard React pattern
      fetchAccesos();
    }
  }, [user]);

  const seedDatabase = async () => {
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      if (res.ok) {
        toast({ title: "Éxito", description: "Datos de demostración cargados" });
        setHasDemoData(true);
        fetchData();
      }
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar los datos de demostración", variant: "destructive" });
    }
  };

  const clearDatabase = async () => {
    try {
      const res = await fetch("/api/seed/clear", { method: "POST" });
      if (res.ok) {
        toast({ title: "Éxito", description: "Todos los datos han sido eliminados" });
        setHasDemoData(false);
        fetchData();
      }
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron eliminar los datos", variant: "destructive" });
    }
  };

  return {
    loading,
    dashboardData,
    empleados,
    clientes,
    membresias,
    clases,
    promociones,
    accesos,
    systemUsers,
    hasDemoData,
    fetchData,
    fetchAccesos,
    fetchUsers,
    seedDatabase,
    clearDatabase,
    setClientes,
    setAccesos,
    setSystemUsers,
  };
}
