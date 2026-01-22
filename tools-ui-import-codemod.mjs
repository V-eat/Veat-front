import fs from "node:fs";
import path from "node:path";

const root = path.resolve("src");

const map = {
  "button": "forms",
  "checkbox": "forms",
  "form": "forms",
  "input": "forms",
  "input-otp": "forms",
  "label": "forms",
  "radio-group": "forms",
  "select": "forms",
  "slider": "forms",
  "switch": "forms",
  "textarea": "forms",
  "toggle": "forms",
  "toggle-group": "forms",
  "calendar": "forms",

  "breadcrumb": "navigation",
  "menubar": "navigation",
  "navigation-menu": "navigation",
  "pagination": "navigation",

  "alert-dialog": "overlays",
  "context-menu": "overlays",
  "dialog": "overlays",
  "drawer": "overlays",
  "dropdown-menu": "overlays",
  "hover-card": "overlays",
  "popover": "overlays",
  "sheet": "overlays",
  "tooltip": "overlays",
  "command": "overlays",

  "alert": "feedback",
  "progress": "feedback",
  "skeleton": "feedback",
  "sonner": "feedback",
  "toast": "feedback",
  "toaster": "feedback",
  "use-toast": "feedback",

  "avatar": "data-display",
  "badge": "data-display",
  "card": "data-display",
  "chart": "data-display",
  "table": "data-display",
  "tabs": "data-display",

  "accordion": "layout",
  "aspect-ratio": "layout",
  "carousel": "layout",
  "collapsible": "layout",
  "scroll-area": "layout",
  "separator": "layout",
  "sidebar": "layout",
  "resizable": "layout",
};

function walk(dir, out) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.isFile() && /\.(ts|tsx)$/.test(ent.name)) out.push(p);
  }
}

const files = [];
walk(root, files);

let changedFiles = 0;
let changedImports = 0;

for (const file of files) {
  let src = fs.readFileSync(file, "utf8");
  const original = src;

  src = src.replace(/from\s+(["'])@\/components\/ui\/([^"']+)\1/g, (m, q, name) => {
    const base = name.replace(/\.(ts|tsx)$/, "");
    const cat = map[base];
    if (!cat) return m;
    changedImports++;
    return `from ${q}@/components/ui/${cat}${q}`;
  });

  if (src !== original) {
    fs.writeFileSync(file, src, "utf8");
    changedFiles++;
  }
}

console.log(`Codemod terminÃ©: ${changedImports} imports ajustÃ©s dans ${changedFiles} fichiers.`);
