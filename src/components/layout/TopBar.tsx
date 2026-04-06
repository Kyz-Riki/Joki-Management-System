"use client";

import { useAuth } from "@/hooks/useAuth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User } from "lucide-react";

export function TopBar() {
  const { user, logout } = useAuth();
  
  // Format avatar initials
  const initials = user?.username ? user.username.substring(0, 2).toUpperCase() : "U";

  return (
    <header className="h-16 border-b bg-white dark:bg-slate-900 flex items-center justify-between px-4 md:px-6 z-10 sticky top-0">
      <div className="md:hidden font-bold text-lg tracking-tight text-primary">
        JokiSystem.
      </div>
      <div className="hidden md:block" /> {/* Spacer */}
      
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium hidden sm:block">
          Hi, {user?.username}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none rounded-full ring-offset-2 focus-visible:ring-2 ring-primary">
            <Avatar className="h-9 w-9 cursor-pointer">
              <AvatarFallback className="bg-primary/10 text-primary font-medium">{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
