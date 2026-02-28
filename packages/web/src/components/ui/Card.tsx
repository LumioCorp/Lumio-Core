import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#2E2832] bg-[#1E1820] shadow-[0_4px_20px_rgba(0,0,0,0.2)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("px-6 pt-5 pb-0", className)}>{children}</div>
  );
}

export function CardTitle({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <h3
      className={cn(
        "font-[family-name:var(--font-space-grotesk,var(--font-dm-sans))] text-base font-semibold tracking-[-0.02em] text-[#FBFBFC]",
        className
      )}
    >
      {children}
    </h3>
  );
}

export function CardContent({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return <div className={cn("px-6 py-5", className)}>{children}</div>;
}

export function CardFooter({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("px-6 pb-5 pt-0", className)}>{children}</div>
  );
}
