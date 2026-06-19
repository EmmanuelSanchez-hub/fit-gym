"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, Lock, User, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LoginPageProps {
  onLogin: (user: { id: string; email: string; nombre: string; rol: string; empleadoId?: string }) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [hasSuperUser, setHasSuperUser] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupCredentials, setSetupCredentials] = useState<{ email: string; password: string } | null>(null);

  // Check if super user exists
  useEffect(() => {
    const checkSetup = async () => {
      try {
        const res = await fetch("/api/setup");
        const data = await res.json();
        setHasSuperUser(data.hasSuperUser);
      } catch {
        console.error("Error checking setup");
      } finally {
        setCheckingSetup(false);
      }
    };
    checkSetup();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al iniciar sesión");
        return;
      }

      onLogin(data.user);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    setSetupLoading(true);
    setError("");

    try {
      const res = await fetch("/api/setup", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al crear super usuario");
        return;
      }

      setSetupCredentials(data.credentials);
      setHasSuperUser(true);
    } catch {
      setError("Error de conexión");
    } finally {
      setSetupLoading(false);
    }
  };

  // Loading state while checking setup
  if (checkingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
              <Dumbbell className="w-10 h-10 text-white" />
            </div>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando configuración...</p>
        </div>
      </div>
    );
  }

  // Setup screen if no super user exists
  if (!hasSuperUser && !setupCredentials) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-2xl border-0 dark:border dark:border-gray-700">
            <CardHeader className="text-center pb-2">
              <div className="relative mx-auto mb-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                  <Dumbbell className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">Pro</span>
                </div>
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Bienvenido a FitGym Pro
              </CardTitle>
              <CardDescription className="text-base">Configuración inicial del sistema</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-center space-y-4">
                <div className="p-4 rounded-lg bg-muted/50 dark:bg-muted/20">
                  <p className="text-muted-foreground text-sm">
                    No existe un Super Usuario en el sistema. Necesitas crear uno para comenzar.
                  </p>
                </div>
                
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleSetup}
                  disabled={setupLoading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 dark:from-emerald-600 dark:to-teal-700 dark:hover:from-emerald-700 dark:hover:to-teal-800 shadow-lg shadow-emerald-500/25"
                  size="lg"
                >
                  {setupLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creando Super Usuario...
                    </>
                  ) : (
                    "Crear Super Usuario"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Show credentials after setup
  if (setupCredentials) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-2xl border-2 border-emerald-500 dark:border-emerald-600">
            <CardHeader className="text-center pb-2">
              <div className="relative mx-auto mb-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center animate-pulse">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                ¡Super Usuario Creado!
              </CardTitle>
              <CardDescription className="text-base">Guarda estas credenciales para acceder al sistema</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl p-5 space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Email:</p>
                  <div className="flex items-center gap-2 p-2 bg-white/50 dark:bg-black/20 rounded-lg">
                    <User className="w-4 h-4 text-emerald-500" />
                    <p className="font-mono font-semibold text-emerald-700 dark:text-emerald-300">{setupCredentials.email}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Contraseña:</p>
                  <div className="flex items-center gap-2 p-2 bg-white/50 dark:bg-black/20 rounded-lg">
                    <Lock className="w-4 h-4 text-emerald-500" />
                    <p className="font-mono font-semibold text-emerald-700 dark:text-emerald-300">{setupCredentials.password}</p>
                  </div>
                </div>
              </div>
              
              <Alert className="mt-4 border-amber-400 dark:border-amber-600 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-amber-700 dark:text-amber-300">
                  <strong>Importante:</strong> Cambia la contraseña después de iniciar sesión.
                </AlertDescription>
              </Alert>

              <Button
                onClick={() => {
                  setEmail(setupCredentials.email);
                  setPassword(setupCredentials.password);
                  setSetupCredentials(null);
                }}
                className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 dark:from-emerald-600 dark:to-teal-700 dark:hover:from-emerald-700 dark:hover:to-teal-800 shadow-lg shadow-emerald-500/25"
                size="lg"
              >
                Continuar al Login
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Normal login form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-0 dark:border dark:border-gray-700">
          <CardHeader className="text-center pb-2">
            <div className="relative mx-auto mb-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                <Dumbbell className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">Pro</span>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              FitGym Pro
            </CardTitle>
            <CardDescription className="text-base">Sistema de Gestión de Gimnasio</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="super@gym.com"
                    className="pl-10 h-11"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••"
                    className="pl-10 h-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 dark:from-emerald-600 dark:to-teal-700 dark:hover:from-emerald-700 dark:hover:to-teal-800 shadow-lg shadow-emerald-500/25"
                size="lg"
                disabled={loading}
              >
                {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
