import Link from "next/link";
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/* ---------------------------------------------------------------- button */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const buttonBase =
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-ctl font-semibold transition " +
  "active:translate-y-px disabled:pointer-events-none disabled:opacity-55";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-campus-brand text-white shadow-sm hover:bg-campus-brandHover active:bg-campus-brandActive",
  secondary:
    "border border-campus-borderStrong bg-campus-card text-campus-ink hover:border-campus-brand/40 hover:bg-campus-soft",
  ghost: "text-campus-brand hover:bg-campus-soft",
  danger: "border border-campus-danger/30 bg-campus-dangerBg text-campus-danger hover:bg-campus-danger hover:text-white"
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 text-sm",
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-12 px-6 text-[15px]"
};

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  extra?: string
) {
  return cx(buttonBase, buttonVariants[variant], buttonSizes[size], extra);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentPropsWithoutRef<"button"> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentPropsWithoutRef<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

/* ----------------------------------------------------------------- badge */

type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger" | "solid";

const badgeTones: Record<BadgeTone, string> = {
  neutral: "border border-campus-border bg-campus-card text-campus-muted",
  brand: "border border-campus-softBorder bg-campus-soft text-campus-brand",
  success: "border border-campus-success/20 bg-campus-successBg text-campus-success",
  warning: "border border-campus-warning/20 bg-campus-warningBg text-campus-warning",
  danger: "border border-campus-danger/20 bg-campus-dangerBg text-campus-danger",
  // Readable over any photo, bright or dark.
  solid: "bg-campus-ink/85 text-white backdrop-blur-sm"
};

export function Badge({
  tone = "neutral",
  className,
  children
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold leading-none",
        badgeTones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ card */

export function Card({
  as: Tag = "section",
  className,
  children
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag className={cx("rounded-card border border-campus-border bg-campus-card shadow-card", className)}>
      {children}
    </Tag>
  );
}

/* ----------------------------------------------------------------- forms */

const controlBase =
  "w-full rounded-ctl border border-campus-borderStrong bg-campus-card px-3.5 text-[15px] text-campus-ink " +
  "outline-none transition placeholder:text-campus-subtle " +
  "focus:border-campus-brand focus:shadow-focus disabled:bg-campus-surface disabled:text-campus-muted";

export const inputClass = cx(controlBase, "min-h-11");
export const textareaClass = cx(controlBase, "min-h-28 py-3 leading-relaxed");
export const selectClass = cx(controlBase, "min-h-11 appearance-none bg-[right_0.9rem_center] bg-no-repeat pr-10");

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  children: ReactNode;
}) {
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;

  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-baseline gap-1.5 text-sm font-semibold text-campus-ink" htmlFor={htmlFor}>
        {label}
        {required ? (
          <span className="text-xs font-medium text-campus-muted">Required</span>
        ) : (
          <span className="text-xs font-medium text-campus-subtle">Optional</span>
        )}
      </label>
      {hint ? (
        <p className="text-xs leading-5 text-campus-muted" id={hintId}>
          {hint}
        </p>
      ) : null}
      {children}
      {error ? (
        <p className="text-xs font-medium text-campus-danger" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/* ----------------------------------------------------------- page header */

export function PageHeader({
  title,
  lead,
  actions
}: {
  title: string;
  lead?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-campus-ink sm:text-3xl">{title}</h1>
        {lead ? <p className="max-w-prose text-[15px] leading-relaxed text-campus-muted">{lead}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

/* ----------------------------------------------------------- empty state */

export function EmptyState({
  title,
  body,
  action,
  icon
}: {
  title: string;
  body: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      {icon ? <div className="text-campus-subtle">{icon}</div> : null}
      <h2 className="text-lg font-semibold text-campus-ink">{title}</h2>
      <p className="max-w-prose text-sm leading-relaxed text-campus-muted">{body}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </Card>
  );
}

/* --------------------------------------------------------------- notices */

export function Notice({
  tone = "danger",
  title,
  children
}: {
  tone?: "danger" | "success" | "warning" | "brand";
  title?: string;
  children: ReactNode;
}) {
  const tones = {
    danger: "border-campus-danger/25 bg-campus-dangerBg text-campus-ink",
    success: "border-campus-success/25 bg-campus-successBg text-campus-ink",
    warning: "border-campus-warning/25 bg-campus-warningBg text-campus-ink",
    brand: "border-campus-softBorder bg-campus-soft text-campus-ink"
  } as const;

  return (
    <div
      className={cx("rounded-ctl border px-4 py-3 text-sm leading-relaxed", tones[tone])}
      role={tone === "danger" ? "alert" : "status"}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      <div className={title ? "mt-1" : undefined}>{children}</div>
    </div>
  );
}

/* -------------------------------------------------------------- skeleton */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-ctl bg-campus-surface", className)} />;
}
