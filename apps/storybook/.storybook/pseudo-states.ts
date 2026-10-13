/*
 * Lets a story show hover, focus and active states without real interaction,
 * so every state can sit side by side as on the design board and be checked
 * by axe. Each rule that uses one of these pseudo classes is copied with the
 * pseudo class swapped for an attribute:
 *
 *   .button:hover  →  .button[data-sb-pseudo~="hover"]
 *
 * Canvas only. Nothing here reaches the published package.
 */
const pseudo = /:(hover|focus-visible|focus|active)(?![\w-])/;
const everyPseudo = new RegExp(pseudo.source, "g");
const done = new WeakSet<CSSRule>();

function copyRules(parent: CSSStyleSheet | CSSGroupingRule) {
  let rules: CSSRuleList;
  try {
    rules = parent.cssRules;
  } catch {
    return; // A stylesheet from another origin
  }
  for (let index = 0; index < rules.length; index++) {
    const rule = rules[index];
    if (!rule || done.has(rule)) continue;
    done.add(rule);

    if (rule instanceof CSSStyleRule) {
      if (
        !pseudo.test(rule.selectorText) ||
        rule.selectorText.includes("data-sb-pseudo")
      ) {
        continue;
      }
      const selector = rule.selectorText.replace(
        everyPseudo,
        '[data-sb-pseudo~="$1"]',
      );
      try {
        parent.insertRule(`${selector}{${rule.style.cssText}}`, index + 1);
      } catch {
        // A selector this browser cannot parse once rewritten
      }
    } else if (rule instanceof CSSGroupingRule) {
      copyRules(rule);
    }
  }
}

export function forcePseudoStates() {
  for (const sheet of Array.from(document.styleSheets)) {
    copyRules(sheet);
  }
}
