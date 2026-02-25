"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  List,
  Calendar,
  MapPin,
  Headphones,
  AlertTriangle,
  BarChart2,
  Trophy,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/layout/ThemeProvider";
import { Button } from "@/components/ui/button";
import { useTransition } from "react";

const MANAGER_NAV = [
  { href: "/", label: "Visao Geral", icon: LayoutDashboard },
  { href: "/parametros", label: "Parametros", icon: Settings },
  { href: "/listas", label: "Listas", icon: List },
  { href: "/cronograma", label: "Cronograma", icon: Calendar },
  { href: "/visitas", label: "Visitas", icon: MapPin },
  { href: "/atendimento", label: "Atendimento", icon: Headphones },
  { href: "/erros", label: "Erros", icon: AlertTriangle },
  { href: "/score", label: "Score Mensal", icon: BarChart2 },
  { href: "/ranking", label: "Ranking", icon: Trophy },
];

const COORD_NAV = [
  { href: "/cronograma", label: "Cronograma", icon: Calendar },
  { href: "/visitas", label: "Visitas", icon: MapPin },
];

interface SidebarProps {
  role: "manager" | "coord";
  coordDeptName?: string | null;
}

export function Sidebar({ role, coordDeptName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();

  const navItems = role === "manager" ? MANAGER_NAV : COORD_NAV;

  function handleLogout() {
    startTransition(async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/entrar");
      router.refresh();
    });
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r bg-background">
      <div className="flex h-16 items-center border-b px-6">
        <Link href={role === "manager" ? "/" : "/cronograma"} className="flex items-center gap-2">
          <Image src="/logo.png" alt="Metriq" width={32} height={32} className="object-contain invert dark:invert-0" unoptimized />
          <span className="text-xl font-bold text-primary">Metriq</span>
        </Link>
      </div>

      <nav className="flex flex-col gap-1 flex-1 overflow-y-auto p-4">
        {role === "coord" && (
          <p className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Coordenacao
          </p>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4 space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-muted-foreground truncate max-w-[120px]">
            {role === "manager"
              ? "Gerente"
              : coordDeptName
              ? `Coord. ${coordDeptName}`
              : "Coordenacao"}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
            title="Alternar tema"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
          disabled={isPending}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </aside>
  );
}
