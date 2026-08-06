"use client";

import * as React from "react";
import { Paintbrush } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean; // ✅ 1. Added optional disabled type definition
  className?: string;
}

const PRESET_COLORS = [
  "#1e3a8a", "#2563eb", "#3b82f6", "#10b981", 
  "#ef4444", "#f59e0b", "#6366f1", "#000000"
];

export function ColorPicker({ value, onChange, disabled, className }: ColorPickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    // 2. Prevent the popover framework from expanding if disabled is true
    <Popover open={disabled ? false : open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled} // ✅ 3. Native disabled state passed directly to the trigger button
          className={cn(
            "w-full h-10 justify-start text-left font-medium border-slate-200 focus:ring-blue-800 disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed",
            className
          )}
        >
          <div className="flex items-center gap-2 w-full">
            <div
              className="h-4 w-4 rounded-md border border-slate-300 shadow-sm shrink-0"
              style={{ backgroundColor: value || "#ffffff" }}
            />
            <span className="truncate text-xs font-semibold text-slate-700 uppercase">
              {value || "Pick a color"}
            </span>
            <Paintbrush className="ml-auto h-3.5 w-3.5 text-slate-400 shrink-0" />
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-64 p-3 space-y-3 border-slate-100 shadow-md">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Custom Color</label>
          <div className="flex items-center gap-2">
            <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200 shadow-sm cursor-pointer shrink-0">
              <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
              />
            </div>
            <Input
              type="text"
              maxLength={7}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="h-10 text-sm font-medium uppercase border-slate-200 focus-visible:ring-blue-800"
            />
          </div>
        </div>

        <div className="space-y-2 pt-1 border-t border-slate-100">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Swatches</label>
          <div className="grid grid-cols-4 gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={cn(
                  "h-8 w-full rounded-md border border-slate-200 shadow-sm hover:scale-105 active:scale-95 transition-transform",
                  value.toLowerCase() === color.toLowerCase() && "ring-2 ring-blue-800 ring-offset-1"
                )}
                style={{ backgroundColor: color }}
                onClick={() => onChange(color)}
              />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
