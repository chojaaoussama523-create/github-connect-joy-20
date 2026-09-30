import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import snnseiAsset from "@/assets/snnsei-logo.png.asset.json";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { to: "/home", label: "الرئيسية" },
  { to: "/snnsei", label: "SNNSEI" },
  { to: "/market", label: "GM7 MARKET" },
  { to: "/tournaments", label: "البطولات" },
] as const;

export function BrandShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="relative z-40">
        <header className="site-header">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:flex sm:justify-between sm:px-6 lg:px-8">
            <Link to="/home" className="flex min-w-0 items-center gap-3" aria-label="GM7 الرئيسية">
              <img src={snnseiAsset.url} alt="SNNSEI" className="h-12 w-12 shrink-0 object-contain" />
              <span className="min-w-0">
                <span className="block truncate font-display text-lg font-black text-foreground">GM7 SNNSEI</span>
                <span className="block truncate text-[0.65rem] font-bold text-muted-foreground">L&apos;GAMERS LMLA7</span>
              </span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex" aria-label="التنقل الرئيسي">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  activeProps={{ className: "nav-link-active" }}
                  className="nav-link"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setOpen((value) => !value)}
              aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
              aria-expanded={open}
            >
              {open ? <X /> : <Menu />}
            </Button>
          </div>

          {open ? (
            <nav className="mobile-nav md:hidden" aria-label="التنقل على الهاتف">
              {NAV_ITEMS.map((item) => (
                <Link key={item.to} to={item.to} className="mobile-nav-link" onClick={() => setOpen(false)}>
                  {item.label}
                </Link>
              ))}
            </nav>
          ) : null}
        </header>
      </div>

      <main>{children}</main>
      <footer className="border-t border-border px-4 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} GM7 SNNSEI — L&apos;GAMERS LMLA7
      </footer>
    </div>
  );
}