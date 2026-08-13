import Link from "next/link";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/sign-out";

export async function AppHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" aria-label="Início">
          <Logo />
        </Link>
        <div className="flex items-center gap-3">
          {user && (
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm">
                <LogOut className="text-grey" />
                Sair
              </Button>
            </form>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
