"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Pin, PinOff } from "lucide-react"
import { Table } from "@tanstack/react-table"
import { cn } from "@/lib/utils"

// Generic type parameter for table data
interface PinActionsContextValue<TData> {
  table: Table<TData>;
}

// Context with generic type
const PinActionsContext = React.createContext<PinActionsContextValue<unknown> | null>(null);

// HELPER: Checks if actions are pinned right 
export const checkIsActionsPinned = (columnPinning: { right?: string[] }): boolean => {
    return columnPinning.right?.includes('actions') ?? false;
};

// HELPER CSS
const getPinningStyles = (isActionsPinned: boolean, context: 'header' | 'filter' | 'body'): React.CSSProperties => {
    if (!isActionsPinned) return {};
    const baseSticky: React.CSSProperties = {
        position: 'sticky',
        right: 0,
        boxShadow: '-4px 0 6px -2px rgba(0, 0, 0, 0.1)',
    };

    switch(context) {
        case 'header': return { ...baseSticky, zIndex: 20, backgroundColor: "#172554" };
        case 'filter': return { ...baseSticky, zIndex: 15, backgroundColor: "white" }; 
        case 'body': return { ...baseSticky, zIndex: 10 };
        default: return {};
    }
};

export const getDynamicPinningStyles = (
  columnId: string, 
  isPinned: boolean, 
  context: 'header' | 'filter' | 'body'
): React.CSSProperties => {
    if (columnId === 'actions') {
        return getPinningStyles(isPinned, context);
    }
    return {};
};

interface HeaderIconButtonProps {
  className?: string;
}

const HeaderIconButton = <TData,>({ className }: HeaderIconButtonProps) => {
    const context = React.useContext(PinActionsContext) as PinActionsContextValue<TData> | null;
    if (!context) {
      throw new Error("HeaderIconButton must be used within TablePinActionsProvider");
    }
    const { table } = context;
    const { columnPinning } = table.getState();
    const isActionsPinned = checkIsActionsPinned(columnPinning);
  
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          if (isActionsPinned) {
            table.setColumnPinning(prev => ({
              ...prev,
              right: prev.right?.filter(id => id !== 'actions') ?? []
            }));
          } else {
            table.setColumnPinning(prev => ({
              ...prev,
              right: [...(prev.right ?? []), 'actions']
            }));
          }
        }}
        className={cn(
            "h-7 w-7 p-0 text-blue-950 bg-white hover:bg-amber-100 hover:text-blue-700 focus-visible:ring-blue-300 cursor-pointer",
            className
        )}
        title={isActionsPinned ? "Unpin this column" : "Pin this column to the right"}
      >
        {isActionsPinned ? (
            <PinOff className="h-4 w-4" /> 
        ) : (
            <Pin className="h-4 w-4 transform -rotate-45" /> 
        )}
        <span className="sr-only">Toggle Pin Column</span>
      </Button>
    );
};

const PinActionsButton = <TData,>() => {
  const context = React.useContext(PinActionsContext) as PinActionsContextValue<TData> | null;
  if (!context) {
    throw new Error("PinActionsButton must be used within TablePinActionsProvider");
  }
  const { table } = context;
  const { columnPinning } = table.getState();
 
  const isActionsPinned = checkIsActionsPinned(columnPinning);

  return (
    <Button
      variant={isActionsPinned ? "default" : "outline"}
      size="sm"
      onClick={() => {
        if (isActionsPinned) {
          table.setColumnPinning(prev => ({
            ...prev,
            right: prev.right?.filter(id => id !== 'actions') ?? []
          }));
        } else {
          table.setColumnPinning(prev => ({
            ...prev,
            right: [...(prev.right ?? []), 'actions']
          }));
        }
      }}
      className="flex items-center p-4 gap-2 border-blue-900 text-blue-900 hover:bg-blue-50"
      title={isActionsPinned ? "Unpin actions column" : "Pin actions column"}
    >
      {isActionsPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
      {isActionsPinned ? "Unpin" : "Pin Actions"}
    </Button>
  );
};

interface TablePinActionsProviderProps<TData> {
  table: Table<TData>;
  children: React.ReactNode;
}

const TablePinActionsProvider = <TData,>({ table, children }: TablePinActionsProviderProps<TData>) => {
  return (
    <PinActionsContext.Provider value={{ table } as PinActionsContextValue<unknown>}>
      {children}
    </PinActionsContext.Provider>
  );
};

export const TablePinActions = {
  Provider: TablePinActionsProvider,
  Button: PinActionsButton,
  HeaderIcon: HeaderIconButton, 
  // Helpers
  getDynamicPinningStyles,
  checkIsActionsPinned
};