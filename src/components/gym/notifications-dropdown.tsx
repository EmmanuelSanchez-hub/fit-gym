"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bell,
  AlertTriangle,
  XCircle,
  Info,
  CheckCircle,
  X,
} from "lucide-react";

interface Notification {
  id: string;
  tipo: 'warning' | 'error' | 'info' | 'success';
  titulo: string;
  mensaje: string;
  fecha: string;
  leida: boolean;
  clienteId?: string;
}

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notificaciones?limit=10");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setNotifications(data.notifications);
            setNoLeidas(data.noLeidas);
          }
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchNotifications();
    // Refresh cada 5 minutos
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getBgColor = (tipo: string) => {
    switch (tipo) {
      case 'error':
        return 'bg-red-500/10';
      case 'warning':
        return 'bg-amber-500/10';
      case 'success':
        return 'bg-emerald-500/10';
      default:
        return 'bg-blue-500/10';
    }
  };

  const handleDismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setNoLeidas(prev => Math.max(0, prev - 1));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {noLeidas > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold"
            >
              {noLeidas > 9 ? '9+' : noLeidas}
            </motion.span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notificaciones</h3>
            {noLeidas > 0 && (
              <Badge variant="secondary" className="text-xs">
                {noLeidas} sin leer
              </Badge>
            )}
          </div>
        </div>
        <ScrollArea className="h-80">
          <AnimatePresence>
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className={`p-3 ${getBgColor(notification.tipo)} relative group`}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDismiss(notification.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getIcon(notification.tipo)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{notification.titulo}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.mensaje}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notification.fecha).toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </ScrollArea>
        {notifications.length > 0 && (
          <div className="p-2 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                setNotifications([]);
                setNoLeidas(0);
              }}
            >
              Marcar todas como leídas
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
