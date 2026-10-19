import { Button } from "../components/ui/Button";
import { Icon, type IconName } from "../components/ui/Icon";
import { Card } from "../components/ui/primitives";
import "./dashboard.css";

/** Stand-in for screens outside this design pass (Plan, Recipes, Groceries, Progress). */
export function PlaceholderPage({ title, icon, description }: { title: string; icon: IconName; description: string }) {
  return (
    <div>
      <header className="page-head">
        <h1 className="page-title">{title}</h1>
      </header>
      <Card>
        <div className="empty">
          <span className="empty__icon">
            <Icon name={icon} size={24} />
          </span>
          <p className="muted">{description}</p>
          <Button to="/app" variant="secondary" size="sm" icon="chevronLeft">
            Back to home
          </Button>
        </div>
      </Card>
    </div>
  );
}
