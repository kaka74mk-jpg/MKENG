import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required GitHub Actions secret: ${key}`);
}

if (!/^https:\/\/[^\s]+\.supabase\.co$/.test(process.env.SUPABASE_URL)) {
  throw new Error('SUPABASE_URL does not look like a Supabase project URL');
}

const forbiddenNames = new Set(['.env', '.env.local', '.env.production', 'service_role.key']);
const secretPatterns = [
  /service_role/i,
  /SUPABASE_SERVICE_ROLE_KEY\s*=/i,
  /sbp_[A-Za-z0-9_-]{20,}/,
  /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules', '.next', 'dist'].includes(entry.name)) continue;
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const files = walk(process.cwd());
for (const file of files) {
  const base = file.split('/').pop();
  if (forbiddenNames.has(base)) throw new Error(`Forbidden secret-like file found: ${file}`);
  const st = statSync(file);
  if (st.size > 2_000_000) continue;
  let text;
  try { text = readFileSync(file, 'utf8'); } catch { continue; }
  for (const pattern of secretPatterns) {
    if (pattern.test(text)) throw new Error(`Potential secret material detected in tracked/workspace file: ${file}`);
  }
}

const packagePath = join(process.cwd(), 'course-package');
try {
  const st = statSync(packagePath);
  if (!st.isDirectory()) throw new Error('course-package is not a directory');
} catch {
  throw new Error('Approved course-package directory is missing from the repository');
}

console.log('PASS: GitHub Actions secret variables are present and not printed.');
console.log('PASS: repository preflight found no obvious secret material.');
console.log('PASS: course-package directory exists.');
