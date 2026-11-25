"use client"

import {
  BookOpen,
  Buildings,
  ChartLineUp,
  GraduationCap,
  Lightbulb,
  List,
  ListChecks,
  ShieldCheck,
  SidebarSimple,
  SquaresFour,
  Users,
  X,
} from "@phosphor-icons/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"
import { useWorkspace } from "@/lib/fica/workspace"
import { cn } from "@/lib/utils"
import { Logo } from "./logo"
import { ThemeToggle } from "./theme-toggle"

const sections = [
  { label: "Visão Geral", icon: SquaresFour, href: "/" },
  { label: "Permanência no Emprego", icon: ChartLineUp, href: "/permanencia" },
  {
    label: "Entidades e Empresas",
    icon: Buildings,
    href: "/entidades-empresas",
    also: ["/empresas", "/ouvir", "/consulta", "/custos"],
  },
  {
    label: "Participantes e Barreiras",
    icon: Users,
    href: "/participantes",
    also: ["/percursos"],
  },
  {
    label: "Formação e Desenvolvimento",
    icon: GraduationCap,
    href: "/formacao",
  },
  {
    label: "Acompanhamento e Planos de Ação",
    icon: ListChecks,
    href: "/acompanhamento",
    also: ["/radar", "/tarefas"],
  },
  { label: "Qualidade dos Dados", icon: ShieldCheck, href: "/qualidade" },
  {
    label: "Recomendações e Intervenções",
    icon: Lightbulb,
    href: "/recomendacoes",
    also: ["/simulador"],
  },
  { label: "Conheça o Estudo", icon: BookOpen, href: "/estudo" },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const collapsed = useWorkspace((s) => s.menuCollapsed)
  const setCollapsed = useWorkspace((s) => s.setMenuCollapsed)
  const drawer = useRef<HTMLDialogElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    drawer.current?.close()
  }, [pathname])

  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Saltar para o conteúdo
      </a>
      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-30 hidden flex-col border-e bg-card p-3 transition-[width] duration-200 motion-reduce:transition-none lg:flex print:hidden",
          collapsed ? "w-20" : "w-68"
        )}
      >
        <div
          className={cn(
            "flex items-center justify-between gap-2 py-2",
            collapsed ? "flex-col" : "ps-2"
          )}
        >
          <Link href="/" aria-label="RJ.connect, Visão Geral">
            <Logo compact={collapsed} />
          </Link>
          <button
            type="button"
            aria-label={collapsed ? "Abrir o menu" : "Recolher o menu"}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed(!collapsed)}
            className="inline-flex size-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <SidebarSimple className="size-5" aria-hidden="true" />
          </button>
        </div>
        <Menu collapsed={collapsed} className="mt-4" />
        <ThemeToggle
          compact={collapsed}
          className={cn("mt-auto", collapsed && "justify-center")}
        />
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4 lg:hidden print:hidden">
        <Link href="/" aria-label="RJ.connect, Visão Geral">
          <Logo />
        </Link>
        <button
          type="button"
          aria-label="Abrir o menu"
          onClick={() => drawer.current?.showModal()}
          className="inline-flex size-11 items-center justify-center rounded-xl hover:bg-accent"
        >
          <List className="size-6" aria-hidden="true" />
        </button>
      </header>
      <dialog
        ref={drawer}
        aria-label="Menu"
        onClick={(event) => {
          if (event.target === drawer.current) drawer.current?.close()
        }}
        className="m-0 h-dvh max-h-none w-80 max-w-[85vw] bg-card p-4 text-foreground backdrop:bg-black/50"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between">
            <Logo />
            <button
              type="button"
              aria-label="Fechar o menu"
              onClick={() => drawer.current?.close()}
              className="inline-flex size-11 items-center justify-center rounded-xl hover:bg-accent"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          <Menu collapsed={false} className="mt-4" />
          <ThemeToggle className="mt-auto" />
        </div>
      </dialog>

      <div
        className={cn(
          "transition-[padding] duration-200 motion-reduce:transition-none print:ps-0",
          collapsed ? "lg:ps-20" : "lg:ps-68"
        )}
      >
        <main
          id="conteudo"
          className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10"
        >
          {children}
        </main>
      </div>
    </>
  )
}

function Menu({
  collapsed,
  className,
}: {
  collapsed: boolean
  className?: string
}) {
  const pathname = usePathname()
  return (
    <nav aria-label="Secções" className={className}>
      <ul className="flex flex-col gap-1">
        {sections.map(({ label, icon: Icon, href, also = [] }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : [href, ...also].some(
                  (p) => pathname === p || pathname.startsWith(`${p}/`)
                )
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                title={collapsed ? label : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm",
                  collapsed && "justify-center px-0",
                  active
                    ? "bg-primary font-medium text-primary-foreground"
                    : "hover:bg-accent"
                )}
              >
                <Icon
                  weight={active ? "fill" : "regular"}
                  className="size-5 shrink-0"
                  aria-hidden="true"
                />
                <span className={cn(collapsed && "sr-only")}>{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
