/** Convert hex color (#rrggbb) to HSL string "H S% L%" used in CSS variables */
export function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** Convert HSL string "H S% L%" to hex color */
export function hslStringToHex(hsl: string): string {
  const parts = hsl.trim().split(/[\s,]+/);
  if (parts.length < 3) return "#ffffff";
  const h = parseFloat(parts[0]) / 360;
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const isValidHex = (v: unknown): v is string =>
  typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v);

/** Load a Google Font dynamically if not already loaded */
export function loadGoogleFont(family: string) {
  const id = `gfont-${family.replace(/\s+/g, "-").toLowerCase()}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

/** Apply theme settings (from /api/settings) to CSS custom properties on :root */
export function applyThemeSettings(settings: Record<string, unknown>) {
  const root = document.documentElement;
  const body = document.body;

  const apply = (varName: string, value: unknown) => {
    if (isValidHex(value)) {
      root.style.setProperty(varName, hexToHsl(value));
    } else {
      root.style.removeProperty(varName);
    }
  };

  apply("--primary", settings.themePrimaryColor);
  apply("--secondary", settings.themeSecondaryColor);
  apply("--accent", settings.themeSecondaryColor);
  apply("--footer-bg", settings.themeFooterBg);
  apply("--footer-text", settings.themeFooterText);

  // ── Background pattern ────────────────────────────────────────────────────
  const bgType = (settings.bgPatternType as string) || "pattern";

  if (bgType === "pattern") {
    // Restore the geometric tile pattern with blended body bg
    apply("--background", settings.themeBodyBg);
    body.style.backgroundImage = "url('/images/pattern-bg.png')";
    body.style.backgroundRepeat = "repeat";
    body.style.backgroundSize = "400px";
    body.style.backgroundBlendMode = "multiply";
  } else if (bgType === "color") {
    // Solid color chosen by admin; override --background directly
    const col = settings.bgPatternColor as string;
    if (isValidHex(col)) {
      root.style.setProperty("--background", hexToHsl(col));
    } else {
      apply("--background", settings.themeBodyBg);
    }
    body.style.backgroundImage = "none";
    body.style.backgroundRepeat = "";
    body.style.backgroundSize = "";
    body.style.backgroundBlendMode = "";
  } else {
    // "none" — plain body bg, no pattern
    apply("--background", settings.themeBodyBg);
    body.style.backgroundImage = "none";
    body.style.backgroundRepeat = "";
    body.style.backgroundSize = "";
    body.style.backgroundBlendMode = "";
  }
  // ─────────────────────────────────────────────────────────────────────────

  if (settings.themeBodyFont && typeof settings.themeBodyFont === "string") {
    loadGoogleFont(settings.themeBodyFont);
    root.style.setProperty("--font-sans", `'${settings.themeBodyFont}', sans-serif`);
  } else {
    root.style.removeProperty("--font-sans");
  }

  if (settings.themeHeadingFont && typeof settings.themeHeadingFont === "string") {
    loadGoogleFont(settings.themeHeadingFont);
    root.style.setProperty("--font-display", `'${settings.themeHeadingFont}', serif`);
  } else {
    root.style.removeProperty("--font-display");
  }
}
