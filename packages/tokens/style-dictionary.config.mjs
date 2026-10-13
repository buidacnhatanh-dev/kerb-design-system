// One Style Dictionary build per theme: primitives plus that theme's semantic file.
// build.mjs runs these and assembles dist/.

export const themes = {
  light: { selector: ':root, [data-kerb-theme="light"]', colorScheme: 'light' },
  dark: { selector: '[data-kerb-theme="dark"]', colorScheme: 'dark' },
  comfort: { selector: '[data-kerb-theme="comfort"]', colorScheme: 'light' },
};

const isPrimitive = (token) => token.filePath.endsWith('primitives.json');
// The raw palette never reaches CSS, so components can only use semantic colours
const isPalette = (token) => token.path[0] === 'palette';

const declarations = (tokens) => tokens.map((token) => `  --${token.name}: ${token.$value};`);

const block = (selector, lines) => `${selector} {\n${lines.join('\n')}\n}\n`;

const formats = {
  // Tokens that are the same in every theme (space, radius, sizes, motion, font families)
  'kerb/css-shared': ({ dictionary }) =>
    block(
      ':root',
      declarations(dictionary.allTokens.filter((t) => isPrimitive(t) && !isPalette(t))),
    ),

  // Tokens a theme decides (colour, type scale), plus color-scheme for native UI
  'kerb/css-theme': ({ dictionary, options }) =>
    block(options.selector, [
      `  color-scheme: ${options.colorScheme};`,
      ...declarations(dictionary.allTokens.filter((t) => !isPrimitive(t))),
    ]),

  // Nested object of resolved values, no references
  'kerb/json': ({ dictionary }) => {
    const out = {};
    for (const token of dictionary.allTokens) {
      let node = out;
      for (const key of token.path.slice(0, -1)) node = node[key] ??= {};
      node[token.path.at(-1)] = token.$value;
    }
    return JSON.stringify(out, null, 2);
  },
};

export default Object.entries(themes).map(([theme, { selector, colorScheme }]) => ({
  source: ['src/primitives.json', `src/semantic.${theme}.json`],
  hooks: { formats },
  platforms: {
    css: {
      prefix: 'kerb',
      transforms: ['name/kebab', 'fontFamily/css', 'cubicBezier/css'],
      files: [
        { destination: 'shared.css', format: 'kerb/css-shared' },
        {
          destination: `${theme}.css`,
          format: 'kerb/css-theme',
          options: { selector, colorScheme },
        },
      ],
    },
    json: {
      transforms: ['name/kebab'],
      files: [{ destination: `${theme}.json`, format: 'kerb/json' }],
    },
  },
}));
