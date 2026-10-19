import { useEffect, useState } from "react";
import { Button } from "../ui/Button";
import { Field, Segmented } from "../ui/primitives";
import { Sheet } from "../ui/Sheet";
import { activityTypes } from "../../data/catalog";
import { ServingsStepper } from "./ServingsStepper";
import "./flows.css";

export interface ActivityLog {
  type: string;
  minutes: number;
  intensity: "unset" | "light" | "moderate" | "hard";
  time: string;
}

export function LogActivitySheet({ open, onClose, onLog }: { open: boolean; onClose: () => void; onLog: (a: ActivityLog) => void }) {
  const [type, setType] = useState<string | null>(null);
  const [minutes, setMinutes] = useState(30);
  const [intensity, setIntensity] = useState<ActivityLog["intensity"]>("unset");
  const [time, setTime] = useState("");

  useEffect(() => {
    if (!open) return;
    const d = new Date();
    setType(null);
    setMinutes(30);
    setIntensity("unset");
    setTime(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
  }, [open]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Log activity"
      description="Add a workout or any movement you want to track."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button icon="check" disabled={!type} onClick={() => type && onLog({ type, minutes, intensity, time })}>
            Log activity
          </Button>
        </>
      }
    >
      <div className="stack gap-6">
        <div className="stack gap-3">
          <span className="toggle-row__label">Activity</span>
          <div className="tiles" role="group" aria-label="Activity type">
            {activityTypes.map((a) => (
              <button key={a.id} type="button" className="tile" aria-pressed={type === a.id} onClick={() => setType(a.id)}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
        <div className="row spread gap-4" style={{ flexWrap: "wrap" }}>
          <span className="toggle-row__label">Duration</span>
          <ServingsStepper value={minutes} onChange={setMinutes} min={5} max={300} step={5} unit={["min", "min"]} />
        </div>
        <div className="stack gap-3">
          <span className="toggle-row__label">
            Intensity <span className="subtle" style={{ fontWeight: 400 }}>· optional</span>
          </span>
          <Segmented
            label="Intensity"
            value={intensity}
            onChange={setIntensity}
            options={[
              { value: "unset", label: "Skip" },
              { value: "light", label: "Light" },
              { value: "moderate", label: "Moderate" },
              { value: "hard", label: "Hard" },
            ]}
          />
        </div>
        <Field label="Started at">
          {(id) => <input id={id} type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />}
        </Field>
      </div>
    </Sheet>
  );
}
