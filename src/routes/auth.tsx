import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, LayoutDashboard, ShieldCheck } from "lucide-react";
import dashboardLogo from "@/assets/gm7-dashboard-logo.png.asset.json";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "GM7 Access — الدخول" },
      { name: "description", content: "بوابة الدخول لمنصة GM7 SNNSEI." },
      { property: "og:title", content: "GM7 Access" },
      { property: "og:description", content: "بوابة الدخول لمنصة GM7 SNNSEI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card/80 p-8 text-center backdrop-blur">
        <img src={dashboardLogo.url} alt="GM7 Access" className="mx-auto h-40 object-contain" />
        <h1 className="mt-4 font-display text-2xl font-black text-foreground">GM7 ACCESS</h1>
        <p className="mt-2 text-sm text-muted-foreground">بوابة الدخول لمنصة المجتمع</p>
        <div className="mt-6 space-y-3">
          <Button asChild size="lg" className="h-12 w-full">
            <Link to="/home">
              دخول المنصة
              <ArrowLeft aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12 w-full">
            <Link to="/gm7-dashboard">
              <LayoutDashboard aria-hidden="true" />
              لوحة القيادة
            </Link>
          </Button>
        </div>
        <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          المنطقة الإدارية محمية بكود دخول
        </p>
      </div>
    </div>
  );
}
