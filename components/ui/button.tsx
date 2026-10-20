import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary: "bg-accent text-on-accent font-semibold",
  secondary: "bg-surface-raised text-text border border-border",
  ghost: "bg-transparent text-muted",
  danger: "bg-danger text-on-danger font-semibold",
};
const SIZE: Record<Size, string> = {
  sm: "min-h-9 px-3 text-sm",
  md: "min-h-11 px-4 text-base",
  lg: "min-h-13 px-5 text-base uppercase tracking-wide",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return [
    "inline-flex items-center justify-center gap-2 rounded-md transition-[transform,filter] duration-100",
    "active:scale-[0.97] active:brightness-90 disabled:opacity-40 disabled:active:scale-100 select-none",
    VARIANT[variant],
    SIZE[size],
    extra,
  ].join(" ");
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button type="button" className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
