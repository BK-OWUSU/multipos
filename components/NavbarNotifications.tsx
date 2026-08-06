import { Bell, CheckCheck, Trash2, ArrowRight, Store, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotificationStore } from "@/store/notification.store";
import { useEffect, useState } from "react";
import { AppSheet } from "./reusables/AppSheet";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";

export function NavbarNotifications() {
  const { notifications, fetchNotifications } = useNotificationStore();
  const {user} = useAuthStore();
  const [isNotificationDetailsOpen, setIsNotificationDetailsOpen] = useState<boolean>(false);
  const businessSlug = user?.business.slug;
  const notificationPath = `/${businessSlug}/notifications`

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  return (
    <div className="relative group">
      <button
        onClick={() => setIsNotificationDetailsOpen(true)} 
        // variant="ghost" 
        // size="icon" 
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
       >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 animate-pulse">
            {unreadCount}
          </span>
          )}
      </button>

      <AppSheet
        isOpen={isNotificationDetailsOpen}
        onClose={() => setIsNotificationDetailsOpen(false)}
        title="Notifications"
        description="Quick preview of your recent system alerts and updates."
        maxWidth="md"
      >
        <div className="flex flex-col h-full space-y-4">
          
          {/* Action Header inside Sheet */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
            <span className="font-semibold text-slate-700">
              Recent Alerts ({notifications?.length || 0})
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {}} 
                className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            </div>
          </div>

          {/* Scrollable Notification List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[calc(100vh-220px)]">
            {notifications && notifications.length > 0 ? (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`group relative p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 hover:border-blue-300 hover:shadow-sm ${
                    !notif.isRead ? "border-slate-300 bg-blue-50/20" : "border-slate-200/80 bg-white"
                  }`}
                >
                  {!notif.isRead && (
                    <span className="absolute left-1.5 top-4 w-2 h-2 rounded-full bg-[#1D4ED8]" />
                  )}

                  <div className="flex-1 min-w-0 pl-2">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className={`text-xs truncate ${!notif.isRead ? "font-bold text-slate-900" : "font-semibold text-slate-700"}`}>
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed mb-2">
                      {notif.message}
                    </p>

                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Store className="w-3 h-3 text-slate-400" /> 
                        {notif.shop?.name ?? "Global"}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" /> 
                        {notif.employee ? `${notif.employee.firstName}` : "System"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-[#1D4ED8] flex items-center justify-center mx-auto">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-800">No notifications found</p>
                <p className="text-[11px] text-slate-400">You are completely caught up!</p>
              </div>
            )}
          </div>

          {/* Footer View All Link */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Showing recent activity</span>
            <Link
              href={notificationPath}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1D4ED8] hover:text-blue-700 transition-colors"
            >
              Open Full Center
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div> 
      </AppSheet>
    </div>
  );
}