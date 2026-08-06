"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search, Users, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { RolesWithRelations } from "@/types/auth/role.type";

interface RolesListProps {
  roles: RolesWithRelations[];
  selectedRole: RolesWithRelations | null;
  onRoleSelect: (role: RolesWithRelations) => void;
}

export default function RolesList({ roles, selectedRole, onRoleSelect }: RolesListProps) {
  // ── 1. STATE FILTERS ───────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // ── 2. FILTERING ENGINE (COMPUTED MEMO RE-EVALUATION) ──────────────────
  const filteredRoles = useMemo(() => {
    return roles.filter((role) => {
      // A. Match against selected dropdown type
      const matchesType = 
        typeFilter === "all" || 
        role.type.toLowerCase() === typeFilter.toLowerCase();

      // B. Match against name or description text query string
      const normalizedQuery = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !normalizedQuery ||
        role.name.toLowerCase().includes(normalizedQuery) ||
        (role.description && role.description.toLowerCase().includes(normalizedQuery));

      return matchesType && matchesSearch;
    });
  }, [roles, searchQuery, typeFilter]);

  return (
    <div className="bg-white rounded-lg border shadow-sm h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm mb-3">
          Roles ({filteredRoles.length === roles.length ? roles.length : `${filteredRoles.length} of ${roles.length}`})
        </h3>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search roles or descriptions..." 
            className="pl-9 h-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Selection Dropdown */}
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="system">System Defaults</SelectItem>
            <SelectItem value="custom">Custom Configurations</SelectItem>
            {/* Fixed the value from "custom" to "temporary" */}
            <SelectItem value="temporary">Temporary Profiles</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Roles Card List Feed */}
      <div className="flex-1 overflow-auto p-2">
        <div className="space-y-1">
          {filteredRoles.length > 0 ? (
            filteredRoles.map((role) => (
              <Card
                key={role.id}
                onClick={() => onRoleSelect(role)}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-all cursor-pointer hover:border-primary/50 my-1.5",
                  selectedRole?.id === role.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-gray-100 hover:bg-gray-50"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                    role.type === "SYSTEM" 
                      ? "bg-green-100 text-green-700" 
                      : role.type === "CUSTOM" 
                        ? "bg-orange-100 text-orange-700" 
                        : "bg-blue-100 text-blue-700"
                  )}>
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="font-medium text-sm truncate text-gray-900">{role.name}</h4>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-tight",
                        role.type === "SYSTEM" && "bg-green-50 text-green-700 border border-green-200",
                        role.type === "CUSTOM" && "bg-orange-50 text-orange-700 border border-orange-200",
                        role.type === "TEMPORARY" && "bg-blue-50 text-blue-700 border border-blue-200"
                      )}>
                        {role.type.toLowerCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2 line-clamp-2 min-h-4">
                      {role.description || "No parameter description available."}
                    </p>
                    <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                      <Users className="h-3 w-3" />
                      <span>
                        {role._count.employee} employee{role._count.employee !== 1 ? 's' : ''} assigned
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-xs text-muted-foreground italic border border-dashed rounded-lg m-2">
              No security profiles found matching criteria.
            </div>
          )}
        </div>
      </div>

      {/* Footer Meta Details */}
      <div className="p-3 border-t text-xs text-gray-400 font-medium bg-gray-50/50 rounded-b-lg">
        {filteredRoles.length === 0 
          ? "No visible parameters" 
          : `Showing ${filteredRoles.length} total active role configuration rows`}
      </div>
    </div>
  );
}