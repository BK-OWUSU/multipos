"use client"

import { ColumnDef, Table } from "@tanstack/react-table"
import { Employee } from "@/types/auth/auth"
import { Badge } from "@/components/ui/badge"
import { 
  Users, Mail, Phone, ShieldCheck, 
  Store, MoreHorizontal,
  UserX, UserCheck, Trash2, CheckCircle2, XCircle, 
  Lock, Unlock, ShieldAlert, Shield,
  GitBranch,
  Edit,
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useEmployeeStore } from "@/store/employeeStore"
import { toast } from "sonner"
import AlertWithDialogue from "../../reusables/AlertWithDialogue"
import Image from "next/image"
import { grantEmployeeAccess, revokeEmployeeAccess } from "@/lib/actions/business/employeesActions"
import { TablePinActions } from "../../reusables/table/TablePinActions"


// ── CUSTOM META INTERFACE DEFINITION ──────────────────────────────────
export interface EmployeeTableMeta {
  onManageShops?: (employee: Employee) => void;
  onEditEmployee?:(employee: Employee)=> void;
}

// ── INJECT TABLE INTO ACTION CELL PROPS ──────────────────────────────
const ActionCell = ({ employee, table }: { employee: Employee; table: Table<Employee> }) => {
  const { toggleEmployeeStatus, deleteEmployee, fetchEmployees } = useEmployeeStore()
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
      <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => {
            navigator.clipboard.writeText(employee.email)
            toast.success("Email copied to clipboard")
        }}>
          Copy Email
        </DropdownMenuItem>
        
        {/* 👇 NEW OPTION: MANAGE ASSIGNED WORKSPACES */}
        <DropdownMenuItem onClick={() => {
          const meta = table.options.meta as EmployeeTableMeta | undefined;
          if (meta?.onManageShops) {
            meta.onManageShops(employee);
          }
        }}>
          <span className="flex items-center text-indigo-600 font-medium">
            <GitBranch className="mr-2 h-4 w-4 text-indigo-500" /> Manage Shops
          </span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => {
          const meta = table.options.meta as EmployeeTableMeta | undefined;
          if (meta?.onEditEmployee) {
            meta.onEditEmployee(employee);
          }
        }}>
           <span className="flex items-center text-indigo-600 font-medium">
             <Edit className="mr-2 h-4 w-4" /> Edit
          </span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />

        {!employee.hasSystemAccess ? (
          <DropdownMenuItem onClick={() => {
              toast.promise(grantEmployeeAccess(employee.id),{
                loading: "Granting access...",
                success: (res)=> {
                  if(res.success) {
                    fetchEmployees();
                    return res.message || "Access granted successfully."
                  } else {
                    throw new Error(res.error);
                  }
                },
                error: (err)=> err.message
              })
            }}>
            <span className="flex items-center text-blue-600">
              <Shield className="mr-2 h-4 w-4" /> Grant Access
            </span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => {
            toast.promise(revokeEmployeeAccess(employee.id),{
              loading: "Revoking access...",
              success: (res)=> {
                if(res.success) {
                  fetchEmployees();
                  return res.message || "Access revoked successfully."
                } else {
                  throw new Error(res.error);
                }
              },
              error: "An error occurred while revoking access."
            })
          }}>
            <span className="flex items-center text-orange-600">
              <ShieldAlert className="mr-2 h-4 w-4" /> Revoke Access
            </span>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem onClick={() => toggleEmployeeStatus(employee.id, employee.isActive)}>
          {employee.isActive ? (
            <span className="flex items-center text-yellow-600">
              <UserX className="mr-2 h-4 w-4" /> Deactivate
            </span>
          ) : (
            <span className="flex items-center text-green-600">
              <UserCheck className="mr-2 h-4 w-4" /> Activate
            </span>
          )}
        </DropdownMenuItem>

        <AlertWithDialogue
          button={
            <DropdownMenuItem
              className="text-destructive"
              onSelect={(e) => e.preventDefault()}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          }
          buttonText="Delete"
          customVariant="primary"
          btnClassName="p-4"
          confirmText="Yes, Delete"
          cancelText="Cancel"
          title="Delete Staff Record"
          message={`Are you sure? This will remove ${employee.firstName}'s profile and all system access. This cannot be undone.`}
          confirmFunction={() => deleteEmployee(employee.id)}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const employeeColumns: ColumnDef<Employee>[] = [
  /* 1. COMBINED: ID, IMAGE, NAME, DESIGNATION */
  {
    accessorKey: "firstName",
    header: () => (<span className='flex items-center'><Users className="mr-2" size={16}/>Employee Info</span>),
    enableGlobalFilter: true,
    cell: ({ row }) => {
      const { customId, firstName, lastName, imageUrl, designation, isActive } = row.original;
      return (
        <div className={`flex items-center gap-3 max-w-60 ${!isActive ? 'opacity-50' : ''}`}>
          <div className="h-10 w-10 shrink-0 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-background shadow-sm">
            {imageUrl ? (
              <Image src={imageUrl} alt={firstName} width={40} height={40} className="object-cover h-full w-full" />
            ) : (
              <Users size={18} className="text-muted-foreground" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-mono text-gray-400 leading-none mb-0.5 truncate">{customId}</span>
            <span className="font-semibold text-sm leading-tight text-blue-950 truncate">{`${firstName} ${lastName}`}</span>
            <span className="text-xs text-gray-500 font-medium truncate">
              {designation || "No Designation"}
            </span>
          </div>
        </div>
      );
    }
  },
  /* 2. COMBINED: EMAIL & PHONE CONTACTS */
  {
    accessorKey: "email",
    header: () => (<span className='flex items-center'><Mail className="mr-2" size={16}/>Contact Info</span>),
    enableGlobalFilter: true,
    cell: ({row}) => (
      <div className="flex flex-col max-w-45 text-xs gap-0.5">
        <span className="font-medium text-gray-700 truncate" title={row.original.email}>{row.original.email}</span>
        <span className="text-gray-400 flex items-center gap-1"><Phone size={10} /> {row.original.phone || "—"}</span>
      </div>
    ),
  },
  /* 3. ASSIGNED WORKPLACE OR ROLE SYSTEM */
  {
    accessorKey: "role.name",
    header: () => (<span className='flex items-center'><ShieldCheck className="mr-2" size={16}/>Role</span>),
    cell: ({ row }) => (
      <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
        {row.original.role?.name}
      </Badge>
    )
  },
  {
    accessorKey: "currentShop.name",
    header: () => (<span className='flex items-center'><Store className="mr-2" size={16}/>Assigned Shop</span>),
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="text-xs font-medium">{row.original.currentShop?.name || "Floating"}</span>
      </div>
    )
  },
  /* 4. COMBINED: STATUS & ACCESS SYSTEM FLAG TYPE */
  {
    accessorKey: "isActive",
    header: "Status & Access",
    filterFn: "equals",
    meta: {
      filterVariant: "select", 
      trueLabel: "Active",   
      falseLabel: "Inactive" 
    },
    cell: ({ row }) => {
      const active = row.original.isActive;
      const systemAccess = row.original.hasSystemAccess;
      return (
        <div className="flex flex-col gap-1 items-start min-w-25">
          <div className="flex items-center gap-1.5">
            <div className={`h-2 w-2 rounded-full ${active ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className={`text-xs font-semibold ${active ? 'text-green-700' : 'text-red-700'}`}>
              {active ? "Active" : "Inactive"}
            </span>
          </div>
          <Badge variant={systemAccess ? "default" : "secondary"} className="text-[9px] px-1 py-0 uppercase tracking-tight scale-95 origin-left">
            {systemAccess ? "Software User" : "On-Site Only"}
          </Badge>
        </div>
      )
    }
  },
  /* 5. COMBINED: SECURITY CHECKS & VERIFICATION STATUS */
  {
    accessorKey: "user.isVerified", 
    header: "Security Verification",
    cell: ({ row }) => {
      const user = row.original.user;
      const systemAccess = row.original.hasSystemAccess;

      if (!systemAccess || !user) return (
        <span className="text-xs text-gray-400 flex items-center gap-1 italic"><ShieldAlert size={12}/> Access Blocked</span>
      );

      return (
        <div className="flex flex-col gap-1 items-start">
          <div className="flex items-center gap-1 text-xs">
            {user.isVerified ? (
              <span className="text-green-600 flex items-center gap-1 font-medium text-[11px]"><CheckCircle2 size={12} className="text-green-500"/> Verified Account</span>
            ) : (
              <span className="text-orange-500 flex items-center gap-1 font-medium text-[11px]"><XCircle size={12} className="text-orange-400"/> Pending Email</span>
            )}
          </div>
          {user.needsPasswordChange ? (
            <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 text-[9px] px-1 py-0 gap-0.5">
              <Lock size={8} /> Reset Needed
            </Badge>
          ) : (
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50 text-[9px] px-1 py-0 gap-0.5">
              <Unlock size={8} /> Pass Secure
            </Badge>
          )}
        </div>
      )
    }
  },
  /* 6. JOINED DATE */
  {
    accessorKey: "createdAt",
    header: "Joined",
    cell: ({ row }) => <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(new Date(row.original.createdAt))}</span>
  },
  /* 7. ACTIONS DROPDOWN CONTEXT */
  {
    accessorKey: "Actions",
    id: "actions",
    header: () => (
        <div className="flex items-center justify-end w-full gap-2 px-1 whitespace-nowrap">
          <TablePinActions.HeaderIcon />
          <span className="font-semibold">Actions</span>
        </div>
      ),
    cell: ({ row , table}) => <ActionCell employee={row.original} table={table} />,
    enableHiding: false, 
    enableSorting: false,
    enableResizing: false,
    enableColumnFilter: false
  }
]