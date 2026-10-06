import { useState } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { getNotificationsAPI, getToken } from "@/utils/api";
import { useEffect } from "react";

type NotificationType = "critical" | "intervention" | "alert" | "info" | "success";

interface Notification {
  id: number;
  type: NotificationType;
  message: string;
  time: string;
  read: boolean;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 1, type: "critical", message: "Meera J. attendance dropped below 65%", time: "2 min ago", read: false },
  { id: 2, type: "intervention", message: "Peer Bridge activated for Arun Kumar ↔ Karthik S.", time: "15 min ago", read: false },
  { id: 3, type: "alert", message: "Parent alert sent for Vignesh P.", time: "1 hour ago", read: true },
  { id: 4, type: "info", message: "Week 6 Sentinel scan complete — 3 new flags", time: "2 hours ago", read: true },
  { id: 5, type: "success", message: "Sanjay R. intervention marked Resolved", time: "Yesterday", read: true },
];

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const data = await getNotificationsAPI(getToken());
        if (Array.isArray(data) && data.length > 0) {
          setNotifications(data);
        }
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    };
    fetchNotifs();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const toggleRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const markResolved = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, type: "success", message: `Resolved: ${n.message}`, read: true } : n))
    );
    toast.success("Issue marked as resolved!");
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative rounded-full p-2.5 text-muted-foreground hover:text-foreground hover:bg-surface-warm transition-all outline-none">
          <Bell className={`h-5 w-5 ${unreadCount > 0 ? "animate-pulse text-accent" : ""}`} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 notif-dot ring-2 ring-background border border-background"></span>
          )}
        </button>
      </PopoverTrigger>
      
      <PopoverContent align="end" className="w-80 p-0 border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-surface/50">
          <p className="font-semibold text-sm text-foreground">Notifications</p>
          {unreadCount > 0 && (
            <button 
              onClick={markAllRead}
              className="text-xs text-muted-foreground hover:text-accent flex items-center gap-1 transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>
        
        <div className="max-h-[350px] overflow-y-auto hide-scrollbar flex flex-col">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              <Check className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>You're all caught up!</p>
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => toggleRead(n.id)}
                className={`w-full flex flex-col gap-1 p-4 border-b border-border transition-colors text-left relative ${
                  !n.read ? "bg-surface-hover" : "hover:bg-surface"
                }`}
              >
                {!n.read && (
                  <span className="absolute top-4 right-4 h-2 w-2 rounded-full bg-accent"></span>
                )}
                
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 h-full w-1 absolute left-0 top-0 bottom-0 ${
                    n.type === "critical" ? "bg-red-500" :
                    n.type === "intervention" ? "bg-orange-500" :
                    n.type === "alert" ? "bg-purple-500" :
                    n.type === "success" ? "bg-green-500" :
                    "bg-blue-500"
                  }`} />
                  <div className="flex flex-col flex-1 pl-2 text-left w-full">
                    <p className={`text-sm leading-snug ${!n.read ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                      {n.message}
                    </p>
                    <div className="flex items-center justify-between mt-1.5 gap-2 w-full">
                      <p className="text-xs text-muted-foreground font-mono">
                        {n.time}
                      </p>
                      {(n.type === "critical" || n.type === "intervention") && (
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            markResolved(n.id); 
                          }}
                          className="text-[10px] font-bold text-accent hover:text-white bg-accent/10 hover:bg-accent/40 px-2 py-0.5 rounded transition-colors whitespace-nowrap"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
        
        <div className="p-2 border-t border-border bg-surface/50 text-center">
          <button className="text-xs text-muted-foreground hover:text-foreground w-full py-1.5 rounded-md hover:bg-surface transition-colors">
            View Intervention Log
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
