"use client";

import { Bell, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationsDropdown } from "./notifications-dropdown";

interface HeaderProps {
  activeSection: string;
  hasDemoData: boolean;
  onLoadDemo: () => void;
  onClearDemo: () => void;
  onToggleSidebar?: () => void;
  isMobile?: boolean;
}

export function Header({
  activeSection,
  hasDemoData,
  onLoadDemo,
  onClearDemo,
  onToggleSidebar,
  isMobile,
}: HeaderProps) {
  return (
    <header className="bg-card border-b border-border px-4 md:px-6 py-2.5 sticky top-0 z-10">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {isMobile && onToggleSidebar && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="flex-shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
            </Button>
          )}
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold capitalize truncate">{activeSection}</h1>
            <p className="text-muted-foreground text-xs md:text-sm truncate">
              {new Date().toLocaleDateString("es-ES", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
          <ThemeToggle />
          {hasDemoData ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearDemo}
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950 hidden sm:inline-flex"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Quitar Demo
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={onLoadDemo}
              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950 hidden sm:inline-flex"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Cargar Demo
            </Button>
          )}
          <NotificationsDropdown />
        </div>
      </div>
    </header>
  );
}