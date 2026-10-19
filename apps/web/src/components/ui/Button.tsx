import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";
import { Icon, type IconName } from "./Icon";
import "./ui.css";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface BaseProps {
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconRight?: IconName;
  block?: boolean;
  children?: ReactNode;
  className?: string;
}

type ButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { to?: undefined };
type LinkProps = BaseProps & { to: string; onClick?: () => void };

function classes({ variant = "primary", size = "md", block, className }: BaseProps) {
  return ["btn", `btn--${variant}`, `btn--${size}`, block && "btn--block", className]
    .filter(Boolean)
    .join(" ");
}

export function Button(props: ButtonProps | LinkProps) {
  const { icon, iconRight, children, variant, size, block, className, ...rest } = props;
  const iconSize = size === "sm" ? 16 : 18;
  const content = (
    <>
      {icon && <Icon name={icon} size={iconSize} />}
      {children && <span>{children}</span>}
      {iconRight && <Icon name={iconRight} size={iconSize} />}
    </>
  );
  const cls = classes({ variant, size, block, className });

  if ("to" in rest && rest.to !== undefined) {
    return (
      <Link to={rest.to} onClick={rest.onClick} className={cls}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {content}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  label: string;
}

export function IconButton({ icon, label, className, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={["icon-btn", className].filter(Boolean).join(" ")}
      {...rest}
    >
      <Icon name={icon} />
    </button>
  );
}
