"use client"

import React, { useState } from "react"
import { Calendar as CalendarIcon, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuditLogStore } from "@/store/auditLogStore"

export function AuditLogDateFilter() {
  const { setDateRange, filters } = useAuditLogStore()
  
  // Initialize state directly from the store values on mount
  const [start, setStart] = useState(filters.startDate || "")
  const [end, setEnd] = useState(filters.endDate || "")

  const handleSearch = () => {
    setDateRange(start || null, end || null)
  }

  const handleClear = () => {
    setStart("")
    setEnd("")
    setDateRange(null, null)
  }

  // We check if either the store filters OR the local input buffers have text in them
  const isDirty = Boolean(filters.startDate || filters.endDate || start || end)

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Giving this wrapper a dynamic key based on the store filters ensures that 
        if the store is cleared elsewhere, React completely recreates this DOM node, 
        natively resetting our local useState hooks without using an effect!
      */}
      <div 
        key={`${filters.startDate}-${filters.endDate}`} 
        className="flex items-center gap-2 bg-white p-1.5 px-2 rounded-lg border border-slate-200 shadow-sm"
      >
        <div className="flex items-center gap-1 text-slate-400 text-xs font-semibold pr-1 border-r border-slate-100">
          <CalendarIcon size={14} className="text-slate-500" />
        </div>
        
        <Input
          type="date"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="h-7 text-xs w-32.5 border-none bg-transparent p-0 focus-visible:ring-0 shadow-none text-slate-700 font-medium"
        />
        
        <span className="text-slate-300 text-xs font-bold px-1">/</span>
        
        <Input
          type="date"
          value={end}
          min={start}
          onChange={(e) => setEnd(e.target.value)}
          className="h-7 text-xs w-32.5 border-none bg-transparent p-0 focus-visible:ring-0 shadow-none text-slate-700 font-medium"
        />

        {isDirty && (
          <button 
            type="button"
            onClick={handleClear}
            className="text-slate-400 hover:text-rose-500 p-0.5 rounded-full hover:bg-slate-50 transition-colors"
            title="Clear Dates"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <Button 
        size="sm" 
        onClick={handleSearch}
        disabled={!start && !end}
        className="flex items-center gap-2 bg-blue-800 hover:bg-blue-700 active:bg-blue-950 text-white h-10 px-4 transition-colors font-medium shadow-sm"
      >
        <Search size={14} />
        <span>Search</span>
      </Button>
    </div>
  )
}