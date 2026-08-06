"use client";

import React from 'react'
import { Button } from '@/components/ui/button';
import { Loader2 } from "lucide-react"; // For loading states

interface CustomButtonProps {
  customVariant?: "primary" | "secondary" | "primary-outline" | "secondary-outline"
  text: string;
  type?: "button" | "submit" | "reset";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string; // To allow small tweaks like margins
  icon?: React.ReactNode;
}

export default function CustomButton({
  text,
  type = "button",
  customVariant,
  variant = "default", // This is your "Primary" by default
  size = "default",
  isLoading = false,
  disabled = false,
  onClick,
  className,
  icon
}: CustomButtonProps) {
  return (
    <Button 
      type={type}
      variant={variant}
      size={size}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`
        ${className}
        ${customVariant === "primary" ? "hover:bg-transparent hover:border-blue-950 hover:text-blue-950 transition-all hover:shadow-lg": ""}
        ${customVariant === "secondary" ? "hover:bg-blue-950! hover:border-blue-400! hover:text-white transition-all hover:shadow-lg": ""}
      `}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {!isLoading && icon && <span className="mr-2">{icon}</span>}
      {text}
    </Button>
  )
}