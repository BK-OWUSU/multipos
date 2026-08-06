"use client"

import React, { useEffect, useState } from "react"
import { 
  FileText, 
  ShieldAlert, 
  Package, 
  Laptop, 
  Download, 
  Filter,
  CalendarIcon
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

import { useAuditLogStore } from "@/store/auditLogStore"
import TableMain from "@/components/reusables/table/TableMain"
import { auditLogColumnDef } from "@/components/tablesColumnDef/auth/auditLogColumnDef"
import { NormalizedLogEntry } from "@/types/auth/auditLogs"
import { AppSheet } from "@/components/reusables/AppSheet"
import { LogDetailsView } from "@/components/detials-components/auditLogDetails"
import { AuditLogDateFilter } from "./AuditLogDateFilter"

interface AuditLogsTableMeta {
  onViewLogDetails: (log: NormalizedLogEntry) => void;
}

// ─── EXACT BACKEND ALIGNED TABS ──────────────────────────────────
const TABS_CONFIG = [
  { value: "all", label: "All Logs" },
  { value: "system", label: "System Audits" },
  { value: "security", label: "Security & Sessions" },
  { value: "stock", label: "Stock Inventory" },
]

export default function AuditLogs() {
  const {
    fetchLogs, 
    logData,
    loading,
    filters,
    setTab
  } = useAuditLogStore();

  const [selectedAuditLog, setSelectedAuditLog] = useState<NormalizedLogEntry | null>(null);
  const [isAppDrawerOpen, setIsAppDrawerOpen] = useState(false);
  
  // Rerun aggregation when filters mutate
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs, filters.tab, filters.page, filters.search, filters.shopId, filters.userId, filters.startDate, filters.endDate]);

  // Maps clean server-side count keys to matching view tiles
  const getStatsConfig = (metrics?: {
    allLogs: number;
    systemEvents: number;
    userSessions: number;
    stockLogs: number;
  }) => [
    { id: "all", title: "All Records", count: metrics?.allLogs?.toLocaleString() || "0", icon: FileText, color: "text-blue-800 bg-blue-50 border-blue-100" },
    { id: "system", title: "System Audits", count: metrics?.systemEvents?.toLocaleString() || "0", icon: Laptop, color: "text-purple-600 bg-purple-50 border-purple-100" },
    { id: "security", title: "Security Logs", count: metrics?.userSessions?.toLocaleString() || "0", icon: ShieldAlert, color: "text-rose-600 bg-rose-50 border-rose-100" },
    { id: "stock", title: "Stock Logs", count: metrics?.stockLogs?.toLocaleString() || "0", icon: Package, color: "text-amber-600 bg-amber-50 border-amber-100" },
  ];

  const currentStats = getStatsConfig(logData?.metrics);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 bg-slate-50/50 min-h-screen w-full">
      
      {/* ─── HEADER PANEL ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
        <div>
          <h1 className="text-2xl font-bold text-blue-950 tracking-tight">Audit Logs</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track and monitor all user activities and system changes</p>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
         {/* Combined date inputs + action search trigger */}
         <AuditLogDateFilter />
          <Button size="sm" className="flex items-center gap-2 bg-blue-800 hover:bg-blue-700 active:bg-blue-950 text-white h-9 transition-colors">
            <Filter size={15} />
            <span>Filter</span>
          </Button>
        </div>
      </div>

      {/* ─── METRICS HEADER SUMMARY CARDS ───────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 w-full">
        {currentStats.map((stat) => {
          const IconComponent = stat.icon
          return (
            <button 
              key={stat.id} 
              onClick={() => setTab(stat.id)}
              className="text-left focus:outline-none transition-transform active:scale-[0.99]"
            >
              <Card className={`border shadow-sm overflow-hidden bg-white transition-all duration-200 ${filters.tab === stat.id ? 'ring-2 ring-blue-800 border-transparent shadow-md' : 'border-slate-100 hover:border-slate-300'}`}>
                <CardContent className="p-4 flex flex-col justify-between h-full gap-3">
                  <div className="flex justify-between items-start w-full">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-400 tracking-normal">{stat.title}</span>
                      <span className="text-xl font-bold text-slate-800 mt-1 tracking-tight">
                        {loading ? "..." : stat.count}
                      </span>
                    </div>
                    <div className={`p-2 rounded-lg border ${stat.color}`}>
                      <IconComponent size={16} />
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Total registered metrics</span>
                </CardContent>
              </Card>
            </button>
          )
        })}
      </div>
      {/* ─── WORKSPACE CONTROLLER VIEWPORT ─────────────────────── */}
      <Card className="border border-slate-200/70 shadow-sm rounded-xl overflow-hidden bg-white w-full">
        <Tabs value={filters.tab} onValueChange={setTab} className="w-full">
          
          <div className="px-4 md:px-6 border-b border-slate-100 bg-white">
            <TabsList className="bg-transparent h-auto p-0 gap-1 justify-start overflow-x-auto rounded-none w-full flex scrollbar-none">
              {TABS_CONFIG.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="data-[state=active]:text-blue-800 data-[state=active]:border-b-3 data-[state=active]:border-b-blue-800 rounded-none border-b-2 border-transparent bg-transparent py-3.5 px-3 text-xs font-bold text-slate-400 transition-all whitespace-nowrap"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Render layout with table instance inside shared parent viewport context */}
          <TabsContent value={filters.tab} className="p-0 m-0">
            <div className="w-full overflow-x-auto">
              <TableMain
                columns={auditLogColumnDef}
                data={logData?.logs || []}
                loading={loading}
                checkBoxVisibility={true}
                columnVisibilityFilter={true}
                tableFilterButtonVisible={true}
                tableExportButtonVisible={true}
                searchKey="name"
                placeholder="Search by name"
                meta={{
                  onViewLogDetails: (log: NormalizedLogEntry) => {
                    setSelectedAuditLog(log);
                    setIsAppDrawerOpen(true);
                  }
                } as AuditLogsTableMeta}
              />
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      <AppSheet
        title="Log Details"
        isOpen={isAppDrawerOpen}
        onClose={() => setIsAppDrawerOpen(false)}
      >
        <LogDetailsView log={selectedAuditLog} />
      </AppSheet>
    </div>
  )
}