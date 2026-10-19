# Core user flows

The three flows below make up most of the MVP's "definition of a working first release" (blueprint §11).
Onboarding (Workflow A) is covered separately at `/onboarding`.

## 1. Plan the week — blueprint Workflow B

`/app/plan`

| Step | Screen | Blueprint rule it shows |
| --- | --- | --- |
| See the week | 7-column grid on desktop; day strip + one day on phones | Editable weekly plan |
| Add a meal | Empty slot → recipe picker sheet (search, filters) → servings → Add | Recipes that conflict with known allergies can't be chosen |
| Ask for suggestions | **Suggest meals** sheet (which meals, max time, reuse ingredients) | AI uses only preferences and schedule |
| Review proposals | Hatched "proposed" slots + review banner; flagged slots in amber | A generated plan stays a proposal until approved; unresolved allergen data is flagged |
| Accept / reject | Banner accepts only unflagged items; flagged ones need **I've checked — accept** | Must fail closed on critical safety checks |
| Save | **Save plan** (disabled while proposals are pending) → validation checklist → toast to update the grocery list | Validate before saving; missing nutrition is a warning, not a blocker |

## 2. Grocery list and shopping — Workflows C and D

`/app/groceries`

| Step | Screen | Blueprint rule it shows |
| --- | --- | --- |
| Review the list | Items grouped by aisle, quantities combined, "N recipes" reveals sources | Group by ingredient and compatible unit |
| Resolve conflicts | "Needs a quantity" card: **Keep both** or **Enter total** | Don't add incompatible units without a valid conversion |
| Add your own | Add-item field; manual items marked "Added by you" | Manual items survive plan changes |
| Update from plan | Confirmation sheet listing what is kept | Merge without deleting manual items |
| Shop | **Shopping** mode: bigger checkboxes, checked items move to "In your cart" | Shopping progress state |
| Send to store | Handoff sheet: matched / need a choice / unavailable, estimated price → **Continue to store** → status banner "not ordered yet" | Never imply an order was placed when only a retailer page was opened |

## 3. Log meals and activity — Workflow E

`/app` (dashboard) → sheets

| Step | Screen | Blueprint rule it shows |
| --- | --- | --- |
| Start | **Log a meal**, or **Log** on a planned meal | A planned meal is never treated as eaten automatically |
| Choose what | Tabs: Today's plan · Recipes · Quick add | Planned meal, recipe or manual entry |
| How much | Portion tiles (¼–2 servings), time, live nutrition estimate | Record the amount actually eaten; household servings ≠ your share |
| Missing data | "Incomplete" estimate; logs without totals | Missing data is not zero |
| Log activity | Type, duration, optional intensity, start time | Manual activity logging; intensity optional |
| Result | Dashboard totals, meal list and 7-day activity update; days without logs stay as gaps | Dashboard reflects available records only |
