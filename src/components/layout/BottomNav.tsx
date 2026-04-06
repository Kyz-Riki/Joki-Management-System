"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Container } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Workers", href: "/dashboard/workers", icon: Users },
  { title: "Containers", href: "/dashboard/containers", icon: Container },
];

export function BottomNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <div className={cn("fixed bottom-0 left-0 right-0 border-t bg-white dark:bg-slate-900 pb-safe md:hidden z-50", className)}>
      <nav className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                isActive ? "text-primary" : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
