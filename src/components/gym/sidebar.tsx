"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Dumbbell, ChevronLeft, ChevronRight,
  Shield, LogOut, HelpCircle, X,
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
  user, activeSection, sidebarOpen,
  onToggleSidebar, onSectionChange, onShowGuide, onLogout,
}: SidebarProps) {
  const isMobile = useIsMobile();
  const navItems = user.rol === "SUPER_USUARIO" || user.rol === "ADMINISTRADOR"
    ? [...NAV_ITEMS, ADMIN_NAV_ITEM, CONFIG_NAV_ITEM]
    : [...NAV_ITEMS, CONFIG_NAV_ITEM];
  const expanded = isMobile ? true : sidebarOpen;

  const handleSectionChange = (section: string) => {
    onSectionChange(section);
    if (isMobile) onToggleSidebar();
  };

  return (
    <>
      {/* Backdrop para móvil */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onToggleSidebar}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isMobile ? 280 : sidebarOpen ? 260 : 72,
          x: isMobile ? (sidebarOpen ? 0 : -280) : 0,
        }}
        className={`flex flex-col h-screen overflow-hidden border-r border-border/40
          bg-background/70 backdrop-blur-xl
          ${isMobile ? "fixed top-0 left-0 z-50 shadow-2xl" : "sticky top-0"}`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border/30 flex-shrink-0">
          <AnimatePresence mode="wait">
            {expanded && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <Dumbbell className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-base tracking-tight">FitGym Pro</span>
              </motion.div>
            )}
          </AnimatePresence>
          <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="hover:bg-muted/50">
            {isMobile ? <X className="w-5 h-5" /> : sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </Button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto min-h-0">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <motion.button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => handleSectionChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                  ${isActive
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-medium shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.97 }}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-emerald-600 dark:text-emerald-400" : ""}`} />
                <AnimatePresence mode="wait">
                  {expanded && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }}
                      className="whitespace-nowrap overflow-hidden text-sm"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-border/30 space-y-2 flex-shrink-0">
          <div className={`flex items-center ${expanded ? 'gap-3' : 'justify-center'}`}>
            <Avatar className="w-8 h-8 ring-2 ring-border/50">
              <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-xs font-medium">
                {user.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {expanded && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.nombre}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Shield className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground capitalize">{user.rol.replace('_', ' ').toLowerCase()}</span>
                </div>
              </div>
            )}
          </div>

          <Separator className="bg-border/40" />

          {expanded && (
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground" onClick={onShowGuide}>
              <HelpCircle className="w-4 h-4" />Guía rápida
            </Button>
          )}

          <Button
            variant="ghost" size="sm"
            className={`w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-500/10 ${!expanded ? 'justify-center' : ''}`}
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