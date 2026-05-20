"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  LayoutDashboard,
  Link2,
  PlusCircle,
  Search,
  Settings,
  User,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/dashboard/create", label: "Create Link", icon: PlusCircle },
    { path: "/dashboard/analytics/1", label: "Analytics", icon: BarChart3 },
  ];

  function isActive(path: string) {
    if (path === "/dashboard") return pathname === path;
    return pathname.startsWith(path);
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r border-neutral-800 bg-neutral-950 lg:flex">
        <div className="border-b border-neutral-800 p-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <Link2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">Shortify</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                  active
                    ? "bg-indigo-500/10 text-indigo-400"
                    : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-neutral-800 p-4">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white"
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </Link>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-neutral-800 bg-black/80 backdrop-blur">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="relative w-full max-w-lg">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" />
              <Input
                placeholder="Search links..."
                className="border-neutral-800 bg-neutral-950 pl-10 text-white placeholder:text-neutral-500 focus-visible:ring-indigo-500"
              />
            </div>

            <Avatar>
              <AvatarFallback className="bg-neutral-900 text-neutral-300">
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}