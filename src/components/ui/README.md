# `components/ui` — composants UI (shadcn/ui)

Ce dossier contient les composants UI “atomiques” (principalement basés sur Radix + Tailwind).

## Catégories (barrel exports + fichiers rangés)

Les composants sont rangés physiquement dans des sous-dossiers **catégories**.  
Des fichiers “ponts” au niveau racine conservent la compatibilité des imports existants.

- `forms/` : inputs, labels, selects, sliders, toggles, calendar…
- `navigation/` : breadcrumb, menubar, navigation-menu, pagination.
- `overlays/` : dialogs, drawers, popovers, sheets, tooltips, command palette.
- `feedback/` : alertes, toasts/sonner, progress, skeleton, use-toast.
- `data-display/` : card, table, badge, avatar, chart, tabs.
- `layout/` : accordion, carousel, scroll-area, separator, sidebar, resizable, aspect-ratio.

### Exemples d’imports

Vous pouvez continuer à faire :

```ts
import { Button } from "@/components/ui/button";
```

Ou migrer progressivement vers :

```ts
import { Button, Input, Label } from "@/components/ui/forms";
```


