import { ColumnDef, Row, Table } from '@tanstack/react-table';
import { NormalizedLogEntry } from '@/types/auth/auditLogs';
import { 
  Calendar, 
  User, 
  Activity, 
  Layers, 
  FileText, 
  Monitor, 
  GitBranch, 
  MoreHorizontal, 
  Terminal, 
  ShieldAlert,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const formatStandardDateTime = (date: Date | string) => {
  if (!date) return '—';
  return new Date(date).toISOString().replace('T', ' ').substring(0, 19);
};

export const auditLogColumnDef: ColumnDef<NormalizedLogEntry>[] = [
  {
    accessorKey: 'createdAt',
    header: () => (
      <span className="flex items-center gap-2 font-semibold">
        <Calendar size={16} /> Date & Time
      </span>
    ),
    cell: ({ row }) => {
      const dateStr = row.getValue('createdAt') as string;
      if (!dateStr) return '—';
      return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    },
    meta: {
      exportValue: (log) => formatStandardDateTime(log.createdAt)
    }
  },
  {
    accessorKey: 'user',
    header: () => (
      <span className="flex items-center gap-2 font-semibold">
        <User size={16} /> User
      </span>
    ),
    filterFn: (row, filterValue) => {
      const search = String(filterValue).toLowerCase();
      const userName = row.original.user?.toLowerCase() || '';
      const userRole = row.original.role?.toLowerCase() || '';
      return userName.includes(search) || userRole.includes(search);
    },
    cell: ({ row }) => {
      const user = row.original.user;
      const role = row.original.role;
      return (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900">{user}</span>
          <span className="text-xs text-gray-500 capitalize">{role?.toLowerCase()}</span>
        </div>
      );
    },
    meta: {
      exportValue: (log) => `${log.user} (${log.role})`
    }
  },
  {
    accessorKey: 'action',
    header: () => (
      <span className="flex items-center gap-2 font-semibold">
        <Activity size={16} /> Action
      </span>
    ),
    filterFn: 'equals',
    meta: {
      filterVariant: 'selectArray',
      options: [
        { value: 'CREATE', label: 'Create' },
        { value: 'UPDATE', label: 'Update' },
        { value: 'DELETE', label: 'Delete' },
        { value: 'LOGIN', label: 'Login' }
      ],
      exportValue: (log) => log.action
    },
    cell: ({ getValue }) => {
      const action = getValue<string>() || '';
      const actionUpper = action.toUpperCase();
      
      let badgeStyle = "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50";
      if (actionUpper.includes('CREATE')) {
        badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50";
      } else if (actionUpper.includes('DELETE')) {
        badgeStyle = "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50";
      } else if (actionUpper.includes('LOGIN')) {
        badgeStyle = "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-50";
      }

      return (
        <Badge variant="outline" className={`font-bold uppercase tracking-wide px-2 py-0.5 ${badgeStyle}`}>
          {action}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'module',
    header: () => (
      <span className="flex items-center gap-2 font-semibold">
        <Layers size={16} /> Module
      </span>
    ),
    cell: ({ getValue }) => <span className="font-medium text-gray-800">{getValue<string>()}</span>,
    meta: {
      exportValue: (log) => log.module
    }
  },
  {
    accessorKey: 'logType',
    header: () => (
      <span className="flex items-center gap-2 font-semibold">
        <ShieldAlert size={16} /> Log Type
      </span>
    ),
    filterFn: 'equals',
    meta: {
      filterVariant: 'selectArray',
      options: [
        { value: 'SECURITY', label: 'Security' },
        { value: 'DATA_CHANGE', label: 'Data Change' },
        { value: 'STOCK_INVENTORY', label: 'Stock Inventory' },
        { value: 'SYSTEM_AUDIT', label: 'System Audit' }
      ],
      exportValue: (log) => log.logType
    },
    cell: ({ getValue }) => {
      const logType = getValue<string>() || '';
      
      let typeStyle = "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-50"; 
      if (logType === 'SECURITY') typeStyle = "bg-red-50 text-red-700 border-red-200 hover:bg-red-50";
      if (logType === 'DATA_CHANGE' || logType === 'DATA CHANGE') typeStyle = "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50";
      if (logType === 'STOCK_INVENTORY' || logType === 'STOCK LOG') typeStyle = "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50";

      return (
        <Badge variant="outline" className={`font-medium tracking-normal rounded-md px-2 py-0.5 ${typeStyle}`}>
          {logType}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'description',
    header: () => (
      <span className="flex items-center gap-2 font-semibold">
        <FileText size={16} /> Description
      </span>
    ),
    cell: ({ getValue }) => (
      <span className="text-gray-600 max-w-xs block truncate" title={getValue<string>()}>
        {getValue<string>()}
      </span>
    ),
    meta: {
      exportValue: (log) => log.description
    }
  },
  {
    accessorKey: 'ipAddress',
    header: () => (
      <span className="flex items-center gap-2 font-semibold">
        <Monitor size={16} /> IP Address
      </span>
    ),
    cell: ({ getValue }) => <span className="text-gray-500 font-mono text-xs">{getValue<string>()}</span>,
    meta: {
      exportValue: (log) => log.ipAddress
    }
  },
  {
    accessorKey: 'branch',
    header: () => (
      <span className="flex items-center gap-2 font-semibold">
        <GitBranch size={16} /> Branch
      </span>
    ),
    cell: ({ getValue }) => <span className="font-medium text-gray-800">{getValue<string>() || 'Main Branch'}</span>,
    meta: {
      exportValue: (log) => log.branch || 'Main Branch'
    }
  },
  {
    accessorKey: 'Actions',
    id: 'actions',
    header: () => (
      <div className="flex items-center justify-end w-full gap-2 px-1 font-semibold">
        <span>Actions</span>
      </div>
    ),
    cell: ({ row, table }) => <ActionCell row={row} table={table} />,
    enableHiding: false, 
    enableSorting: false,
    enableResizing: false,
    enableColumnFilter: false
  },
];


interface ActionCellProps {
  row: Row<NormalizedLogEntry>;
  table: Table<NormalizedLogEntry>;
}

const ActionCell = ({ row, table }: ActionCellProps) => {
  const log = row.original;

  return (
    <div className="flex items-center justify-end w-full">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 border border-transparent hover:border-slate-100">
            <span className="sr-only">Open Menu</span>
            <MoreHorizontal className="h-4 w-4 text-slate-500" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuLabel className="text-slate-400 font-medium text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <Terminal size={12} /> Log Actions
          </DropdownMenuLabel>
          
          <DropdownMenuItem
            className="cursor-pointer flex items-center gap-2 text-xs font-medium text-blue-700 hover:text-blue-800 focus:text-blue-800 focus:bg-blue-50/50"
            onClick={() => {
              const meta = table.options.meta as { onViewLogDetails?: (log: NormalizedLogEntry) => void } | undefined;
              if (meta?.onViewLogDetails) {
                meta.onViewLogDetails(log);
              } else {
                console.log("Viewing detailed payload:", log);
                toast.info(`Viewing trace metrics for log: ${log.id.slice(0, 8)}`);
              }
            }}
          >
            <Eye size={13} /> View Details
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};