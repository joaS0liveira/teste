"use client"

import { Moon, Sun } from "@phosphor-icons/react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

export function ThemeToggle({
  className,
  compact = false,
}: {
  className?: string
  compact?: boolean
}) {
  const { resolvedTheme, setTheme } = useTheme()
  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm hover:bg-accent",
        className
      )}
    >
      <Moon className="size-5 dark:hidden" aria-hidden="true" />
      <Sun className="hidden size-5 dark:block" aria-hidden="true" />
      <span className={cn("dark:hidden", compact && "sr-only")}>
        Modo escuro
      </span>
      <span className={cn("hidden dark:inline", compact && "sr-only")}>
        Modo claro
      </span>
    </button>
  )
}
