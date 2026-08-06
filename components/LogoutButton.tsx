"use client"
import { useRouter } from "next/navigation"
import AlertWithDialogue from "./reusables/AlertWithDialogue"
import { useAuthStore } from "@/store/useAuthStore"
import { LogOut } from "lucide-react"


export default function LogoutButton() {
  const router = useRouter()
  const logout = useAuthStore((state)=> state.logout)
  const handleLogout = async () => {
    try {
      await logout()
      localStorage.removeItem("sessionNotify")
      localStorage.removeItem("brandTipsDismissed")
      localStorage.removeItem("categoryTipsDismissed")
      router.push("/login")
    } catch (error: unknown ) {
      console.error("Logout failed", error)
    } 

  }

  return (
    <AlertWithDialogue
      buttonText="Logout"
      customVariant="primary"
      icon={<LogOut className="w-4 h-4" />}
      btnClassName="p-4 mr-4"
      confirmText="Yes"
      cancelText="Cancel"
      title="Logout"
      message="Are you sure you want to logout?"
      confirmFunction={handleLogout}
    />
  )
}