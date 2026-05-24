"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { logout } from "@/actions/auth";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Box,
  BookOpen,
  ClipboardList,
  Settings,
  LogOut,
  Menu,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "仪表盘", href: "/teacher/dashboard", icon: LayoutDashboard },
  { label: "模型管理", href: "/teacher/models", icon: Box },
  { label: "课程管理", href: "/teacher/courses", icon: BookOpen },
  { label: "作业管理", href: "/teacher/assignments", icon: ClipboardList },
  { label: "系统设置", href: "/teacher/settings", icon: Settings },
];

function NavLinks({
  pathname,
  onLinkClick,
}: {
  pathname: string;
  onLinkClick?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onLinkClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <>
      {/* Mobile header bar */}
      <header className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center border-b bg-background px-4 lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">打开菜单</span>
              </Button>
            }
          />
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="border-b px-6 py-4">
              <SheetTitle className="text-lg font-bold">AI 批改助手</SheetTitle>
              <p className="text-sm text-muted-foreground">教师端</p>
            </SheetHeader>
            <div className="flex flex-1 flex-col justify-between py-4">
              <NavLinks pathname={pathname} onLinkClick={() => setOpen(false)} />
              <div className="border-t px-3 pt-4">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  退出登录
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <span className="ml-3 text-lg font-bold">AI 批改助手</span>
      </header>

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r bg-background lg:flex">
        <div className="border-b px-6 py-4">
          <h1 className="text-lg font-bold">AI 批改助手</h1>
          <p className="text-sm text-muted-foreground">教师端</p>
        </div>
        <div className="flex flex-1 flex-col justify-between py-4">
          <NavLinks pathname={pathname} />
          <div className="border-t px-3 pt-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              退出登录
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
