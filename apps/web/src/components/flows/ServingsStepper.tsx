import "./flows.css";

interface ServingsStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: [singular: string, plural: string];
}

export function ServingsStepper({ value, onChange, min = 1, max = 12, step = 1, unit = ["serving", "servings"] }: ServingsStepperProps) {
  const label = `${value} ${value === 1 ? unit[0] : unit[1]}`;
  return (
    <div className="stepper-input" role="group" aria-label={unit[1]}>
      <button type="button" aria-label={`Fewer ${unit[1]}`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))}>
        −
      </button>
      <output aria-live="polite" className="tabular">
        {label}
      </output>
      <button type="button" aria-label={`More ${unit[1]}`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))}>
        +
      </button>
    </div>
  );
}
