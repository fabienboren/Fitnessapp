import { Link } from "react-router-dom";
import { Icon } from "../ui/Icon";
import "./layout.css";

export function Logo({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="logo" aria-label="NutriFit Companion home">
      <span className="logo__mark">
        <Icon name="leaf" size={18} />
      </span>
      <span className="logo__text">NutriFit</span>
    </Link>
  );
}
