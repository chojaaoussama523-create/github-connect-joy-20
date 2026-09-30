import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type BrandPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  logo: string;
  logoAlt: string;
  background?: string;
  accent: "snnsei" | "market" | "tournaments";
  children?: React.ReactNode;
};

export function BrandPage({
  eyebrow,
  title,
  description,
  logo,
  logoAlt,
  background,
  accent,
  children,
}: BrandPageProps) {
  return (
    <section className={`brand-page brand-page-${accent}`}>
      {background ? (
        <img src={background} alt="" className="brand-page-background" aria-hidden="true" />
      ) : null}
      <div className="brand-page-shade" aria-hidden="true" />
      <div className="relative mx-auto grid min-h-[72vh] w-full max-w-7xl items-center gap-10 px-5 py-16 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)] lg:px-8">
        <div className="max-w-2xl text-right">
          <p className="brand-eyebrow">{eyebrow}</p>
          <h1 className="mt-4 text-4xl font-black text-foreground sm:text-6xl lg:text-7xl">{title}</h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">{description}</p>
          {children}
          <Button asChild size="lg" className="mt-8 h-12 px-6">
            <Link to="/home">
              العودة إلى الرئيسية
              <ArrowLeft aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <div className="flex min-h-72 items-center justify-center lg:min-h-[30rem]">
          <img src={logo} alt={logoAlt} className="brand-page-logo" />
        </div>
      </div>
    </section>
  );
}