import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import React from "react";

interface ToolTipProps {
    position?: "left" | "top" | "bottom" | "right"
    trigger: React.ReactNode;
    description: string
}

export default function ToolTip({position, trigger, description}: ToolTipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {trigger}
      </TooltipTrigger>
      <TooltipContent side={position}>
        {description}
      </TooltipContent>
    </Tooltip>
  )
}
