import { useId, type ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
import "./ui.css";

/* ---------- Card ---------- */

interface CardProps {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  as?: "section" | "article" | "div";
  id?: string;
  "aria-labelledby"?: string;
}

export function Card({ children, className, padded = true, as: Tag = "section", ...rest }: CardProps) {
  return (
    <Tag className={["card", padded && "card--padded", className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </Tag>
  );
}

interface CardHeaderProps {
  title: string;
  id?: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}

export function CardHeader({ title, id, subtitle, action }: CardHeaderProps) {
  return (
    <header className="card__header">
      <div className="stack gap-1">
        <h2 id={id} className="card__title">
          {title}
        </h2>
        {subtitle && <p className="card__subtitle">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

/* ---------- Badge ---------- */

export type Tone = "neutral" | "accent" | "warning" | "danger" | "info";

export function Badge({ tone = "neutral", icon, children }: { tone?: Tone; icon?: IconName; children: ReactNode }) {
  return (
    <span className={`badge badge--${tone}`}>
      {icon && <Icon name={icon} size={12} />}
      {children}
    </span>
  );
}

/* ---------- Progress ---------- */

interface ProgressRingProps {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  label: string;
  children?: ReactNode;
}

export function ProgressRing({ value, max, size = 132, stroke = 10, label, children }: ProgressRingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  return (
    <div
      className="ring"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label}: ${Math.round(pct * 100)}%`}
    >
      <svg width={size} height={size} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="ring__track" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          className="ring__value"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <div className="ring__center">{children}</div>
    </div>
  );
}

export function ProgressBar({ value, max, color, label }: { value: number; max: number; color?: string; label: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div
      className="bar"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <div className="bar__fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

/* ---------- Toggle (switch) ---------- */

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: ReactNode;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, description, disabled }: ToggleProps) {
  const id = useId();
  return (
    <div className="toggle-row">
      <div className="stack gap-1">
        <label htmlFor={id} className="toggle-row__label">
          {label}
        </label>
        {description && (
          <p id={`${id}-desc`} className="toggle-row__desc">
            {description}
          </p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? `${id}-desc` : undefined}
        disabled={disabled}
        className="switch"
        onClick={() => onChange(!checked)}
      >
        <span className="switch__thumb" />
      </button>
    </div>
  );
}

/* ---------- Chip (multi-select pill) ---------- */

export function Chip({
  selected,
  onToggle,
  children,
  tone = "accent",
}: {
  selected: boolean;
  onToggle: () => void;
  children: ReactNode;
  tone?: "accent" | "danger";
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`chip chip--${tone}`}
      onClick={onToggle}
    >
      {selected && <Icon name="check" size={14} />}
      {children}
    </button>
  );
}

/* ---------- Form fields ---------- */

interface FieldProps {
  label: string;
  hint?: string;
  children: (id: string, describedBy?: string) => ReactNode;
}

export function Field({ label, hint, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className="field">
      <label htmlFor={id} className="field__label">
        {label}
      </label>
      {children(id, hintId)}
      {hint && (
        <p id={hintId} className="field__hint">
          {hint}
        </p>
      )}
    </div>
  );
}

/* ---------- Segmented control ---------- */

interface SegmentedProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
}

export function Segmented<T extends string>({ value, options, onChange, label }: SegmentedProps<T>) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className="segmented__item"
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Choice card (single-select, larger target) ---------- */

interface ChoiceCardProps {
  selected: boolean;
  onSelect: () => void;
  icon?: IconName;
  title: string;
  description?: string;
}

export function ChoiceCard({ selected, onSelect, icon, title, description }: ChoiceCardProps) {
  return (
    <button type="button" aria-pressed={selected} className="choice" onClick={onSelect}>
      {icon && (
        <span className="choice__icon">
          <Icon name={icon} />
        </span>
      )}
      <span className="stack gap-1">
        <span className="choice__title">{title}</span>
        {description && <span className="choice__desc">{description}</span>}
      </span>
      <span className="choice__check" aria-hidden="true">
        {selected && <Icon name="check" size={14} />}
      </span>
    </button>
  );
}
