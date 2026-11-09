// Fails when a component uses a Tailwind palette colour (bg-red-500, text-slate-600 …) or a
// hex colour class (bg-[#0b8363]) instead of a design-system token. See docs/design-system.md.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const PALETTE =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white';
const PROPS =
  'bg|text|border(?:-[xytrbl])?|ring(?:-offset)?|outline|divide|placeholder|fill|stroke|decoration|caret|from|to|via|shadow|accent';
const PATTERN = new RegExp(
  `(?<![\\w/-])(?:[\\w\\[\\]&.>~*()=-]+:)*(?:${PROPS})-(?:(?:${PALETTE})(?:-\\d{2,3})?|\\[#[0-9a-fA-F]{3,8}\\])(?![\\w-])`,
  'g',
);

// Files allowed to keep palette classes, mapped to the reason. Keep this list empty if you can.
const EXCEPTIONS = new Map();

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : /\.(tsx?|css)$/.test(name) ? [path] : [];
  });

const findings = [];
for (const file of walk('src')) {
  if (EXCEPTIONS.has(file) || file.endsWith('.test.ts')) continue;
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      for (const m of line.matchAll(PATTERN)) findings.push(`${file}:${i + 1}  ${m[0]}`);
    });
}

if (findings.length) {
  console.error(`Palette colours found; use design-system tokens instead:\n${findings.join('\n')}`);
  process.exit(1);
}
console.log('check-colors: no palette colours outside tokens');
