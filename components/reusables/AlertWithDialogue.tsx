"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import CustomButton from "./CustomButton"
import React, { ReactNode } from "react"

//Alert interface
export interface AlertWithDiagProps {
    buttonText: string
    buttonVariant?: "default" | "outline" | "destructive" | "ghost" | "link" | "secondary"
    customVariant?: "primary" | "secondary" | "primary-outline" | "secondary-outline"
    title?: string
    message?: string
    cancelText?: string 
    confirmText: string,
    btnClassName ?: string,
    button?: ReactNode,
    icon?: React.ReactNode,
    cancelFunction?: ()=> void;
    confirmFunction?: ()=> void;
}


export default function AlertWithDialogue({
    buttonText,
    title, 
    message,
    cancelText,
    confirmText, 
    cancelFunction, 
    confirmFunction, 
    buttonVariant,
    customVariant,
    btnClassName,
    button,
    icon
}: AlertWithDiagProps) {
  return (
    <div>
        <AlertDialog>
            <AlertDialogTrigger asChild>
                {button ? button : <CustomButton icon={icon} className={btnClassName} customVariant={customVariant} text={buttonText}  variant={buttonVariant ?? "default"}/>}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                {title && <AlertDialogTitle>{title}</AlertDialogTitle>}
                {message && <AlertDialogDescription>{message}</AlertDialogDescription>}
                </AlertDialogHeader>
                <AlertDialogFooter>
                {cancelText && <AlertDialogCancel onClick={cancelFunction}>{cancelText}</AlertDialogCancel>}
                <AlertDialogAction onClick={confirmFunction}>{confirmText}</AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog> 
    </div>
  )
}
