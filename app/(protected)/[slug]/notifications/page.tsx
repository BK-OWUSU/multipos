"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Bell,
  Search,
  RefreshCw,
  CheckCheck,
  Settings,
  Package,
  DollarSign,
  ShoppingCart,
  FileText,
  Clock,
  CreditCard,
  Cpu,
  X,
  Trash2,
  Archive,
  Store,
  User,
  Calendar,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { NotificationWithRelations } from "@/types/notification.type";
import { NotificationCategory, NotificationPriority, NotificationChannel } from "@/generated/prisma/browser";
import { useNotificationStore } from "@/store/notification.store";
import { toast } from "sonner";
import { markAllAsReadAction, toggleReadAction } from "@/lib/actions/business/notification-action";

export default function NotificationsCenterPage() {
  const { notifications, fetchNotifications, isLoading } = useNotificationStore();  
  const [searchQuery, setSearchQuery] = useState("");
   const [isPending, startTransition] = React.useTransition();

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
  const [selectedChannel, setSelectedChannel] = useState<string>("ALL");
  const [selectedShop, setSelectedShop] = useState<string>("ALL");

  const [selectedNotification, setSelectedNotification] = useState<NotificationWithRelations | null>(null);

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Client-side filtering using useMemo for performance
  const filteredNotifications = useMemo(() => {
    return notifications?.filter((notif) => {
      // Search query check (checks title and message)
      const matchesSearch =
        searchQuery.trim() === "" ||
        notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notif.message.toLowerCase().includes(searchQuery.toLowerCase());

      // Category check
      const matchesCategory = selectedCategory === "ALL" || notif.category === selectedCategory;

      // Priority check
      const matchesPriority = selectedPriority === "ALL" || notif.priority === selectedPriority;

      // Channel check
      const matchesChannel = selectedChannel === "ALL" || notif.channel === selectedChannel;

      // Shop check
      const matchesShop =
        selectedShop === "ALL" ||
        (selectedShop === "GLOBAL" ? notif.shopId === null : notif.shopId === selectedShop);

      return matchesSearch && matchesCategory && matchesPriority && matchesChannel && matchesShop;
    });
  }, [notifications, searchQuery, selectedCategory, selectedPriority, selectedChannel, selectedShop]);

  const unreadCount = notifications?.filter((n) => !n.isRead).length;
  const highPriorityCount = notifications?.filter((n) => n.priority === "HIGH" || n.priority === "URGENT").length;

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("ALL");
    setSelectedPriority("ALL");
    setSelectedChannel("ALL");
    setSelectedShop("ALL");
    fetchNotifications();
  };

  const handleMarkAllAsRead = () => {
       startTransition(() => {
      toast.promise(
        async () => {
          const res = await markAllAsReadAction();
          if (!res.success) {
            throw new Error(res.error || "Failed to update notification");
          }
          return res;
        },
        {
          loading: "Updating notification...",
          success: (res) => {
            return res.message || "Notifications updated successfully";
          },
          error: (err) => err.message || "Error updating notification",
        }
      );
    });
  };

  const handleToggleRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    startTransition(() => {
      toast.promise(
        async () => {
          const res = await toggleReadAction(id);
          if (!res.success) {
            throw new Error(res.error || "Failed to update notification");
          }
          return res;
        },
        {
          loading: "Updating notification...",
          success: (res) => {
            fetchNotifications()
            return res.message || "Notifications updated successfully";
          },
          error: (err) => err.message || "Error updating notification",
        }
      );
    });
  };


  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedNotification?.id === id) setSelectedNotification(null);
  };

  const getCategoryConfig = (category: NotificationCategory) => {
    switch (category) {
      case "STOCK_ALERT":
        return { icon: <Package className="w-4 h-4 text-amber-600" />, bg: "bg-amber-50 border-amber-200" };
      case "CASH_SESSION":
        return { icon: <DollarSign className="w-4 h-4 text-blue-600" />, bg: "bg-blue-50 border-blue-200" };
      case "SALE_COMPLETED":
        return { icon: <ShoppingCart className="w-4 h-4 text-emerald-600" />, bg: "bg-emerald-50 border-emerald-200" };
      case "PURCHASE_ORDER":
        return { icon: <FileText className="w-4 h-4 text-indigo-600" />, bg: "bg-indigo-50 border-indigo-200" };
      case "TIME_CARD":
        return { icon: <Clock className="w-4 h-4 text-purple-600" />, bg: "bg-purple-50 border-purple-200" };
      case "EXPENSE_ALERT":
        return { icon: <CreditCard className="w-4 h-4 text-rose-600" />, bg: "bg-rose-50 border-rose-200" };
      case "SYSTEM":
        return { icon: <Cpu className="w-4 h-4 text-slate-600" />, bg: "bg-slate-100 border-slate-200" };
      default:
        return { icon: <Bell className="w-4 h-4 text-blue-600" />, bg: "bg-blue-50 border-blue-200" };
    }
  };

  const getPriorityBadge = (priority: NotificationPriority) => {
    switch (priority) {
      case "URGENT":
        return <span className="px-2 py-0.5 text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded-full">Urgent</span>;
      case "HIGH":
        return <span className="px-2 py-0.5 text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200 rounded-full">High</span>;
      case "NORMAL":
        return <span className="px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-full">Normal</span>;
      case "LOW":
        return <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 rounded-full">Low</span>;
    }
  };

  const getChannelBadge = (channel: NotificationChannel) => {
    return <span className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-600 rounded-md border border-slate-200">{channel}</span>;
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 antialiased overflow-hidden">
      
      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Scrollable Notifications Area */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          <div className="mx-auto space-y-6">
            
            {/* Page Header */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Notifications</h1>
                <p className="text-sm text-slate-500 mt-1">
                  View system alerts, stock notifications, sales updates, employee activities, and important business events.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-2 bg-blue-800 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
                >
                  <CheckCheck className="w-4 h-4" />
                  Mark all as read
                </button>
              </div>
            </div>

            {/* Summary Cards (Top Row) */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1D4ED8]">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{notifications?.length}</p>
                  <p className="text-xs font-medium text-slate-500">Total Notifications</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{unreadCount}</p>
                  <p className="text-xs font-medium text-slate-500">Unread</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                  <FlameIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{highPriorityCount}</p>
                  <p className="text-xs font-medium text-slate-500">High Priority</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {notifications?.filter((n) => n.isRead).length}
                  </p>
                  <p className="text-xs font-medium text-slate-500">Read Today</p>
                </div>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-55">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8]"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
              >
                <option value="ALL">Category: All</option>
                <option value="STOCK_ALERT">Stock Alert</option>
                <option value="CASH_SESSION">Cash Session</option>
                <option value="SALE_COMPLETED">Sale Completed</option>
                <option value="PURCHASE_ORDER">Purchase Order</option>
                <option value="TIME_CARD">Time Card</option>
                <option value="EXPENSE_ALERT">Expense Alert</option>
                <option value="SYSTEM">System</option>
              </select>

              {/* Priority Filter */}
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
              >
                <option value="ALL">Priority: All</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="NORMAL">Normal</option>
                <option value="LOW">Low</option>
              </select>

              {/* Channel Filter */}
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
              >
                <option value="ALL">Channel: All</option>
                <option value="IN_APP">In-App</option>
                <option value="EMAIL">Email</option>
                <option value="SMS">SMS</option>
                <option value="WHATSAPP">WhatsApp</option>
              </select>

              {/* Shop Filter */}
              <select
                value={selectedShop}
                onChange={(e) => setSelectedShop(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
              >
                <option value="ALL">Shop: All Branches</option>
                <option value="GLOBAL">Global / All Branches</option>
                {/* Dynamically list available unique shops if desired, or map IDs */}
              </select>

              <button 
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 px-3 py-2 rounded-xl text-xs font-medium transition-colors ml-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                Reset
              </button>
            </div>

            {/* Notification List (Stacked Cards) */}
            <div className="space-y-3">
              {filteredNotifications?.map((notif) => {
                const config = getCategoryConfig(notif.category);
                return (
                  <div
                    key={notif.id}
                    onClick={() => setSelectedNotification(notif)}
                    className={`group relative bg-white rounded-2xl border transition-all cursor-pointer p-4 flex items-start gap-4 hover:border-blue-300 hover:shadow-md ${
                      !notif.isRead ? "border-slate-300 bg-blue-50/10" : "border-slate-200/80"
                    }`}
                  >
                    {!notif.isRead && (
                      <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#1D4ED8] rounded-r-full"></div>
                    )}

                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${config.bg}`}>
                      {config.icon}
                    </div>

                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className={`text-sm tracking-tight truncate ${!notif.isRead ? "font-bold text-slate-900" : "font-semibold text-slate-700"}`}>
                          {notif.title}
                        </h2>
                        {!notif.isRead && <span className="w-2 h-2 rounded-full bg-[#1D4ED8] shrink-0"></span>}
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-2.5">
                        {notif.message}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1"><Store className="w-3 h-3 text-slate-400" /> {notif.shop?.name ?? "Global / All Branches"}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><User className="w-3 h-3 text-slate-400" /> {notif.employee ? `${notif.employee.firstName} ${notif.employee.lastName}` : "System Automation"}</span>
                        <span>•</span>
                        {getChannelBadge(notif.channel)}
                        <span>•</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-400" /> {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {getPriorityBadge(notif.priority)}

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleToggleRead(notif.id, e)}
                          disabled={isPending}
                          title={notif.isRead ? "Mark as unread" : "Mark as read"}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(notif.id, e)}
                          title="Delete notification"
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredNotifications?.length === 0 && (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-[#1D4ED8] flex items-center justify-center mx-auto">
                    <Bell className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">No matching notifications</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">&quot;Try adjusting your search query or filter options.&quot;</p>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>

      {/* RIGHT-SIDE SLIDING DETAILS PANEL */}
      {selectedNotification && (
        <div className="w-96 bg-white border-l border-slate-200 flex flex-col justify-between shrink-0 shadow-2xl z-50 animate-in slide-in-from-right duration-200">
          <div>
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Notification Details</h3>
              <button
                onClick={() => setSelectedNotification(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-130px)]">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${getCategoryConfig(selectedNotification.category).bg}`}>
                  {getCategoryConfig(selectedNotification.category).icon}
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{selectedNotification.category}</span>
                  <h4 className="font-bold text-slate-900 text-sm leading-snug">{selectedNotification.title}</h4>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selectedNotification.message}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <h5 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Metadata</h5>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block mb-1">Priority</span>
                    {getPriorityBadge(selectedNotification.priority)}
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block mb-1">Delivery Channel</span>
                    {getChannelBadge(selectedNotification.channel)}
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-2">
                    <span className="text-slate-400 block mb-1">Contextual Shop</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5"><Store className="w-3.5 h-3.5 text-slate-400" /> {selectedNotification.shop?.name || "Global / All Branches"}</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-2">
                    <span className="text-slate-400 block mb-1">Associated Employee</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400" /> {selectedNotification.employee ? `${selectedNotification.employee.firstName} ${selectedNotification.employee.lastName}` : "System Automation"}</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block mb-1">Time Received</span>
                    <span className="font-medium text-slate-700">{formatDistanceToNow(new Date(selectedNotification.createdAt), { addSuffix: true })}</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block mb-1">Read Status</span>
                    <span className={`font-medium ${selectedNotification.isRead ? "text-emerald-600" : "text-blue-600"}`}>
                      {selectedNotification.isRead ? "Read" : "Unread"}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="p-4 border-t border-slate-100 bg-white flex items-center gap-2">
            <button
              onClick={(e) => {
                handleToggleRead(selectedNotification.id, e);
                setSelectedNotification({ ...selectedNotification, isRead: !selectedNotification.isRead });
              }}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2.5 rounded-xl transition-colors text-center"
            >
              {selectedNotification.isRead ? "Mark as Unread" : "Mark as Read"}
            </button>
            <button className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors" title="Archive">
              <Archive className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setSelectedNotification(null);
              }}
              className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

function FlameIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}