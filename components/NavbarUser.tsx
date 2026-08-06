"use client"
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, User, LogOut, Settings } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

export function NavbarUser() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem("sessionNotify")
    // router.push("/login");
    window.location.href = '/login';
  };

  console.log(user.imageUrl)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-3 outline-none hover:opacity-80 transition-opacity">
        <Avatar className="h-9 w-9 border-2 border-slate-100">
          <AvatarImage src={user?.imageUrl || ""} alt={user.fullName} />
          <AvatarFallback>{user.firstName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="hidden md:flex flex-col text-left">
          <span className="text-sm font-bold text-slate-900 leading-none">
            {user.fullName}
          </span>
          <span className="text-xs font-medium text-slate-500 mt-1">
            {/* Display Role instead of Email for a cleaner look */}
            {user.role?.name || "Admin"}
          </span>
        </div>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56 mt-2" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-bold leading-none">{user.fullName}</p>
            <p className="text-xs leading-none text-muted-foreground italic">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push(`/${user.business.slug}/profile`)}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        {/* <DropdownMenuItem onClick={() => router.push(`/${user.business.slug}/settings`)}> */}
        <DropdownMenuItem onClick={() => router.push(`/${user.business.slug}/access_controls`)}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="text-red-600 focus:bg-red-50 focus:text-red-600" 
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}