"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Dumbbell,
  ChevronLeft,
  ChevronRight,
  Shield,
  LogOut,
  HelpCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import type { AuthUser } from "./types";
import { NAV_ITEMS, ADMIN_NAV_ITEM, CONFIG_NAV_ITEM } from "./constants";

interface SidebarProps {
  user: AuthUser;
  activeSection: string;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onSectionChange: (section: string) => void;
  onShowGuide: () => void;
  onLogout: () => void;
}

export function Sidebar({
  user,
  activeSection,
  sidebarOpen,
  onToggleSidebar,
  onSectionChange,
  onShowGuide,
  onLogout,
}: SidebarProps) {
  const isMobile = useIsMobile();

  // Build navigation items based on user role
  const navItems = user.rol === "SUPER_USUARIO" || user.rol === "ADMINISTRADOR"
    ? [...NAV_ITEMS, ADMIN_NAV_ITEM, CONFIG_NAV_ITEM]
    : [...NAV_ITEMS, CONFIG_NAV_ITEM];

  // En móvil (< md) el sidebar nunca se "colapsa", siempre se muestra completo
  // cuando está abierto y se oculta cuando está cerrado.
  const expanded = isMobile ? true : sidebarOpen;

  // Al elegir una sección en móvil, cerramos el menú para liberar la pantalla.
  const handleSectionChange = (section: string) => {
    onSectionChange(section);
    if (isMobile) onToggleSidebar();
  };

  // Cálculo del ancho según el dispositivo.
  const desktopWidth = sidebarOpen ? 280 : 80;
  const mobileWidth = 280;

  return (
    <>
      {/* Backdrop oscuro detrás del menú en móvil (< md) */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggleSidebar}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{
          width: isMobile ? mobileWidth : desktopWidth,
          x: isMobile ? (sidebarOpen ? 0 : -mobileWidth) : 0,
        }}
        className={`bg-card border-r border-border flex flex-col h-screen overflow-hidden
          ${isMobile ? "fixed top-0 left-0 z-50 shadow-xl" : "sticky top-0"}`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
          <AnimatePresence mode="wait">
            {expanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <Dumbbell className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-lg">FitGym Pro</span>
              </motion.div>
            )}
          </AnimatePresence>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="ml-auto"
          >
            {isMobile ? (
              <X className="w-5 h-5" />
            ) : sidebarOpen ? (
              <ChevronLeft className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto min-h-0">
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => handleSectionChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeSection === item.id
                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <AnimatePresence mode="wait">
                {expanded && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </nav>

        {/* User info & Help - Fixed at bottom */}
        <div className="p-4 border-t border-border space-y-2 flex-shrink-0 bg-card">
          {/* User info */}
          <div className={`flex items-center ${expanded ? 'gap-3' : 'justify-center'}`}>
            <Avatar className="w-9 h-9">
              <AvatarFallback className="bg-emerald-500/20 text-emerald-600">
                {user.nombre.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            {expanded && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.nombre}</p>
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground capitalize">{user.rol.toLowerCase()}</span>
                </div>
              </div>
            )}
          </div>

          <Separator className="my-2" />

          {/* Help button */}
          {expanded && (
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={onShowGuide}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Guía de sección</span>
            </Button>
          )}

          {/* Logout button */}
          <Button
            variant="ghost"
            size="sm"
            className={`w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 ${!expanded ? 'justify-center' : ''}`}
            onClick={onLogout}
          >
            <LogOut className="w-4 h-4" />
            {expanded && <span>Cerrar sesión</span>}
          </Button>
        </div>
      </motion.aside>
    </>
  );
}
