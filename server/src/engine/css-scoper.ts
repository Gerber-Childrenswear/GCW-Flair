export interface LintResult {
  errors: string[];
  warnings: string[];
}

const BLOCKED_IN_STRICT = [
  /^html\b/i,
  /^body\b/i,
  /^:root\b/i,
  /^\*/,
];

const RISKY_PROPS = [
  { pattern: /position\s*:\s*fixed/i, msg: "position: fixed may break page layout." },
  { pattern: /position\s*:\s*sticky/i, msg: "position: sticky may overlap other elements." },
  { pattern: /z-index\s*:\s*[0-9]{5,}/i, msg: "z-index over 9999 may overlap Shopify UI chrome." },
  { pattern: /!important/gi, msg: "!important overrides reduce predictability." },
  { pattern: /overflow\s*:\s*hidden/i, msg: "overflow: hidden may clip content unexpectedly." },
];

// Simple scope-prefixer using regex (PostCSS would be used in production)
export function scopeCSS(css: string, scopeId: string): { scoped: string; lint: LintResult } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const scopeClass = `.cmp-${scopeId}`;

  // Strip comments
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");

  // Lint for risky props
  for (const { pattern, msg } of RISKY_PROPS) {
    if (pattern.test(stripped)) {
      warnings.push(msg);
    }
  }

  // Split into rule blocks
  const result = stripped.replace(
    /([^{}]+)\{([^{}]*)\}/g,
    (_, selectorRaw: string, declarations: string) => {
      const selector = selectorRaw.trim();
      if (!selector) return "";

      // Handle @media and @keyframes as pass-through
      if (selector.startsWith("@")) {
        return `${selector} {${declarations}}`;
      }

      // Lint for blocked global selectors
      for (const blocked of BLOCKED_IN_STRICT) {
        if (blocked.test(selector)) {
          errors.push(`Selector "${selector}" targets global elements and is blocked.`);
          return ""; // Remove from output
        }
      }

      // Scope each comma-separated selector part
      const scoped = selector
        .split(",")
        .map((part) => {
          const p = part.trim();
          if (!p) return "";
          // Already scoped
          if (p.startsWith(scopeClass)) return p;
          return `${scopeClass} ${p}`;
        })
        .filter(Boolean)
        .join(", ");

      return `${scoped} {${declarations}}`;
    }
  );

  return {
    scoped: result.trim(),
    lint: { errors, warnings },
  };
}

export function lintCSS(css: string): LintResult {
  const { lint } = scopeCSS(css, "lint-preview");
  return lint;
}
