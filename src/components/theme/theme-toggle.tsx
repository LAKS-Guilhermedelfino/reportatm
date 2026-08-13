"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme/theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={
        theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"
      }
      onClick={toggleTheme}
    >
      {theme === "dark" ? (
        <Sun className="text-grey group-hover/button:text-primary" />
      ) : (
        <Moon className="text-grey group-hover/button:text-primary" />
      )}
    </Button>
  );
}
