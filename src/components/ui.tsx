import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";
import Link from "next/link";

/* ────────────────────────────────────────────────────────────────────────
 * Buttons
 * ──────────────────────────────────────────────────────────────────────── */

type ButtonVariant = "primary" | "ghost" | "signal";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingLabel?: string;
  trailingIcon?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  loadingLabel,
  trailingIcon,
  children,
  className = "",
  disabled,
  ...rest
}: ButtonProps) {
  const variantCls =
    variant === "primary"
      ? "btn-primary"
      : variant === "signal"
        ? "btn-signal"
        : "btn-ghost";
  const sizeCls = size === "sm" ? "btn-sm" : size === "lg" ? "btn-lg" : "";
  return (
    <button
      className={`btn ${variantCls} ${sizeCls} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      <span>{loading && loadingLabel ? loadingLabel : children}</span>
      {!loading && trailingIcon ? trailingIcon : null}
    </button>
  );
}

interface LinkButtonProps {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  className?: string;
  trailingIcon?: ReactNode;
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  children,
  className = "",
  trailingIcon,
}: LinkButtonProps) {
  const variantCls =
    variant === "primary"
      ? "btn-primary"
      : variant === "signal"
        ? "btn-signal"
        : "btn-ghost";
  const sizeCls = size === "sm" ? "btn-sm" : size === "lg" ? "btn-lg" : "";
  return (
    <Link href={href} className={`btn ${variantCls} ${sizeCls} ${className}`}>
      <span>{children}</span>
      {trailingIcon}
    </Link>
  );
}

/* ────────────────────────────────────────────────────────────────────────
 * Inputs
 * ──────────────────────────────────────────────────────────────────────── */

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
}

export function Field({
  label,
  hint,
  error,
  optional,
  id,
  className = "",
  ...rest
}: FieldProps) {
  const fieldId = id || rest.name || undefined;
  return (
    <label className="block">
      <span className="field-label">
        {label}
        {optional ? (
          <span className="text-ink-muted font-body normal-case tracking-normal ml-2">
            (optional)
          </span>
        ) : null}
      </span>
      <input id={fieldId} className={`field ${className}`} {...rest} />
      {hint && !error ? (
        <span className="mt-2 block text-sm text-ink-muted">{hint}</span>
      ) : null}
      {error ? (
        <span className="mt-2 block text-sm" style={{ color: "var(--color-signal)" }}>
          {error}
        </span>
      ) : null}
    </label>
  );
}

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  optional?: boolean;
  error?: string;
}

export function TextareaField({
  label,
  optional,
  error,
  id,
  className = "",
  ...rest
}: TextareaFieldProps) {
  const fieldId = id || rest.name || undefined;
  return (
    <label className="block">
      <span className="field-label">
        {label}
        {optional ? (
          <span className="text-ink-muted font-body normal-case tracking-normal ml-2">
            (optional)
          </span>
        ) : null}
      </span>
      <textarea id={fieldId} className={`field ${className}`} {...rest} />
      {error ? (
        <span className="mt-2 block text-sm" style={{ color: "var(--color-signal)" }}>
          {error}
        </span>
      ) : null}
    </label>
  );
}

interface SelectFieldProps {
  label: string;
  optional?: boolean;
  name: string;
  id?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (v: string) => void;
  children: ReactNode;
  error?: string;
}

export function SelectField({
  label,
  optional,
  name,
  id,
  value,
  defaultValue,
  onChange,
  children,
  error,
}: SelectFieldProps) {
  const fieldId = id || name;
  return (
    <label className="block">
      <span className="field-label">
        {label}
        {optional ? (
          <span className="text-ink-muted font-body normal-case tracking-normal ml-2">
            (optional)
          </span>
        ) : null}
      </span>
      <select
        id={fieldId}
        name={name}
        value={value}
        defaultValue={defaultValue}
        onChange={(e) => onChange?.(e.target.value)}
        className="field"
      >
        {children}
      </select>
      {error ? (
        <span className="mt-2 block text-sm" style={{ color: "var(--color-signal)" }}>
          {error}
        </span>
      ) : null}
    </label>
  );
}

/* ────────────────────────────────────────────────────────────────────────
 * Chips / Badges
 * ──────────────────────────────────────────────────────────────────────── */

type Tone = "ink" | "accent" | "signal" | "success" | "muted";

export function Chip({
  tone = "muted",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  const cls =
    tone === "accent"
      ? "chip chip-accent"
      : tone === "signal"
        ? "chip chip-signal"
        : tone === "success"
          ? "chip chip-success"
          : tone === "ink"
            ? "chip chip-ink"
            : "chip";
  return <span className={cls}>{children}</span>;
}

export function StatusPill({
  dot = true,
  children,
}: {
  dot?: boolean;
  children: ReactNode;
}) {
  return (
    <span className="status-pill">
      {dot ? <span className="status-dot" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

/* ────────────────────────────────────────────────────────────────────────
 * Section head: eyebrow + heading + lede.
 * ──────────────────────────────────────────────────────────────────────── */

export function SectionHead({
  eyebrow,
  title,
  titleItalic,
  lede,
  action,
}: {
  eyebrow: string;
  title: string;
  titleItalic?: string;
  lede?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
      <div className="max-w-2xl">
        <div className="label eyebrow text-accent reveal reveal-1">
          {eyebrow}
        </div>
        <h1
          className="mt-6 text-[clamp(2rem,5vw,3.2rem)] tracking-[-0.03em] leading-[1] reveal reveal-2"
          style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}
        >
          {title}
          {titleItalic ? (
            <>
              {" "}
              <span className="italic-serif text-accent">{titleItalic}</span>.
            </>
          ) : (
            "."
          )}
        </h1>
        {lede ? (
          <p className="mt-5 text-[18px] leading-[1.55] text-ink-muted max-w-[55ch] reveal reveal-3">
            {lede}
          </p>
        ) : null}
      </div>
      {action ? <div className="reveal reveal-4">{action}</div> : null}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
 * Empty state
 * ──────────────────────────────────────────────────────────────────────── */

export function EmptyState({
  eyebrow,
  title,
  titleItalic,
  description,
  primary,
  secondary,
}: {
  eyebrow: string;
  title: string;
  titleItalic?: string;
  description: string;
  primary?: ReactNode;
  secondary?: ReactNode;
}) {
  return (
    <div className="card-quiet py-16 px-8 text-center flex flex-col items-center">
      <span className="label eyebrow text-ink-muted">{eyebrow}</span>
      <h2
        className="mt-6 text-[clamp(1.6rem,3.5vw,2.4rem)] tracking-[-0.025em] leading-[1.05]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}
      >
        {title}
        {titleItalic ? (
          <>
            {" "}
            <span className="italic-serif text-accent">{titleItalic}</span>.
          </>
        ) : (
          "."
        )}
      </h2>
      <p className="mt-4 text-ink-muted max-w-[45ch] text-[16px] leading-[1.55]">
        {description}
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-3 justify-center">
        {primary}
        {secondary}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
 * Skeleton loader
 * ──────────────────────────────────────────────────────────────────────── */

export function Skeleton({
  width = "100%",
  height = 14,
  className = "",
}: {
  width?: string | number;
  height?: number;
  className?: string;
}) {
  return (
    <span
      className={`skeleton inline-block ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="card-quiet space-y-4">
      <Skeleton width={80} height={12} />
      <Skeleton width="70%" height={28} />
      <Skeleton width="50%" height={14} />
      <Skeleton width="40%" height={14} />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
 * Feedback / toasts
 * ──────────────────────────────────────────────────────────────────────── */

export function Feedback({
  tone,
  children,
}: {
  tone: "success" | "error" | "info";
  children: ReactNode;
}) {
  const bg =
    tone === "success"
      ? "rgba(31, 174, 90, 0.18)"
      : tone === "error"
        ? "rgba(255, 77, 46, 0.18)"
        : "rgba(42, 35, 255, 0.12)";
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-lg p-4 text-[15px] leading-[1.5]"
      style={{ background: bg }}
    >
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
 * KPI stat card
 * ──────────────────────────────────────────────────────────────────────── */

export function Stat({
  label,
  value,
  suffix,
  sub,
  index,
}: {
  label: string;
  value: string;
  suffix?: string;
  sub?: string;
  index?: string;
}) {
  return (
    <div className="card-quiet">
      <div className="flex items-center justify-between">
        <span className="label text-ink-muted">{label}</span>
        {index ? <span className="idx">{index}</span> : null}
      </div>
      <div
        className="mt-4 text-[clamp(1.8rem,4vw,2.6rem)] tracking-[-0.03em] leading-[1]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}
      >
        {value}
        {suffix ? (
          <span className="italic-serif text-accent ml-1">{suffix}</span>
        ) : null}
      </div>
      {sub ? (
        <div className="mt-2 text-[14px] text-ink-muted">{sub}</div>
      ) : null}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
 * Small helpers
 * ──────────────────────────────────────────────────────────────────────── */

export function Hairline({ className = "" }: { className?: string }) {
  return <hr className={`hairline ${className}`} />;
}

export function ArrowRight() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export function ArrowUpRight() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}
