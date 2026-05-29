"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  BarChart3,
  LayoutDashboard,
  Link2,
  LogOut,
  Map,
  Menu,
  PlusCircle,
  Search,
  Settings,
  User,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (
      status === "authenticated" &&
      session?.user.usernameSetupCompleted === false
    ) {
      router.replace("/onboarding/username");
    }
  }, [status, session, router]);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/dashboard/create", label: "Create Link", icon: PlusCircle },
    { path: "/dashboard/links", label: "Links", icon: Link2 },
    { path: "/dashboard/analytics/1", label: "Analytics", icon: BarChart3 },
    { path: "/dashboard/map", label: "Click Map", icon: Map },
  ];

  function isActive(path: string) {
    if (path === "/dashboard") return pathname === path;
    return pathname.startsWith(path);
  }

  function SidebarContent() {
    return (
      <>
        <div className="border-b p-6">
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
                    ? "bg-indigo-500/10 text-indigo-500"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t p-4">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </Link>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r bg-card lg:flex">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden">
          <button
            type="button"
            aria-label="Close sidebar"
            className="absolute inset-0 h-full w-full cursor-default"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        </div>
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r bg-card transition-transform duration-300 lg:hidden ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b p-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <Link2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">Shortify</span>
          </Link>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
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
                    ? "bg-indigo-500/10 text-indigo-500"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t p-4">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </Link>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="relative w-full max-w-lg">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search links..." className="pl-10" />
            </div>

            <Avatar>
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}