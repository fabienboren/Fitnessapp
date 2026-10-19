import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "../ui/Icon";
import { user } from "../../data/mock";
import "./layout.css";

export function AccountMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="account" ref={ref}>
      <button
        type="button"
        className="account__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="avatar">{user.initials}</span>
      </button>
      {open && (
        <div className="account__menu" role="menu">
          <div className="account__who">
            <span className="avatar avatar--lg">{user.initials}</span>
            <div className="stack">
              <strong>{user.firstName}</strong>
              <span className="subtle" style={{ fontSize: "var(--text-sm)" }}>
                {user.email}
              </span>
            </div>
          </div>
          <Link role="menuitem" to="/app/settings" className="account__item" onClick={() => setOpen(false)}>
            <Icon name="user" size={18} /> Profile & settings
          </Link>
          <Link role="menuitem" to="/app/settings#privacy" className="account__item" onClick={() => setOpen(false)}>
            <Icon name="shield" size={18} /> Privacy & data
          </Link>
          <hr className="account__sep" />
          <button role="menuitem" type="button" className="account__item" onClick={() => navigate("/")}>
            <Icon name="logout" size={18} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
