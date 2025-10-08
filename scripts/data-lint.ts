import { promises as fs } from 'fs';
import path from 'path';
import process from 'process';

import Ajv, { ErrorObject } from 'ajv';
const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.resolve(ROOT, 'packages/data/content');
const SCHEMA_PATH = path.resolve(ROOT, 'packages/data/schema/lesson.schema.json');

interface LintResult {
  file: string;
  status: 'OK' | 'FAIL';
  messages: string[];
}

interface IdUsage {
  file: string;
  pointer: string;
}

async function readJson(filePath: string) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

async function collectJsonFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectJsonFiles(entryPath)));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(entryPath);
    }
  }
  return files.sort();
}

function formatErrors(errors: ErrorObject[] | null | undefined): string[] {
  if (!errors || errors.length === 0) {
    return [];
  }
  return errors.map((err) => {
    const instancePath = err.instancePath
      ? err.instancePath.replace(/^\//, '').replace(/\//g, '.')
      : '(root)';
    return `${instancePath || '(root)'} ${err.message}`;
  });
}

function registerIds(data: unknown, file: string, usage: Map<string, IdUsage[]>) {
  if (!data || typeof data !== 'object') {
    return;
  }
  const root = data as Record<string, unknown>;
  if (typeof root.id === 'string') {
    addUsage(root.id, { file, pointer: 'id' }, usage);
  }
  if (root.kind === 'lesson' && Array.isArray(root.checkpoints)) {
    root.checkpoints.forEach((checkpoint: unknown, index: number) => {
      if (checkpoint && typeof checkpoint === 'object') {
        const cp = checkpoint as Record<string, unknown>;
        if (typeof cp.id === 'string') {
          addUsage(cp.id, { file, pointer: `checkpoints[${index}].id` }, usage);
        }
      }
    });
  }
}

function addUsage(id: string, value: IdUsage, usage: Map<string, IdUsage[]>) {
  const list = usage.get(id) ?? [];
  list.push(value);
  usage.set(id, list);
}

function applyDuplicateFindings(results: Map<string, LintResult>, usage: Map<string, IdUsage[]>) {
  for (const [id, entries] of usage) {
    if (entries.length <= 1) continue;
    const files = new Set(entries.map((entry) => entry.file));
    const details = entries.map((entry) => `${entry.file} (${entry.pointer})`).join(', ');
    for (const file of files) {
      const result = results.get(file);
      if (!result) continue;
      result.status = 'FAIL';
      result.messages.push(`Duplicate id '${id}' seen in ${details}`);
    }
  }
}

async function main() {
  const ajv = new Ajv({ allErrors: true, strict: false });
  const schema = await readJson(SCHEMA_PATH);
  const validate = ajv.compile(schema);
  const files = await collectJsonFiles(CONTENT_DIR);
  const results = new Map<string, LintResult>();
  const idUsage = new Map<string, IdUsage[]>();

  for (const file of files) {
    const relative = path.relative(ROOT, file);
    const lintResult: LintResult = { file: relative, status: 'OK', messages: [] };
    results.set(relative, lintResult);
    try {
      const data = await readJson(file);
      const valid = validate(data);
      if (!valid) {
        lintResult.status = 'FAIL';
        lintResult.messages.push(...formatErrors(validate.errors));
      }
      registerIds(data, relative, idUsage);
    } catch (error) {
      lintResult.status = 'FAIL';
      if (error instanceof SyntaxError) {
        lintResult.messages.push(`Invalid JSON: ${error.message}`);
      } else if (error instanceof Error) {
        lintResult.messages.push(error.message);
      } else {
        lintResult.messages.push('Unknown error while parsing');
      }
    }
  }

  applyDuplicateFindings(results, idUsage);

  const rows = Array.from(results.values()).map((result) => ({
    file: result.file,
    status: result.status,
    messages: result.messages.join(' | '),
  }));

  const fileWidth = Math.max('File'.length, ...rows.map((row) => row.file.length));
  const statusWidth = Math.max('Status'.length, ...rows.map((row) => row.status.length));
  const header = ['Status'.padEnd(statusWidth), 'File'.padEnd(fileWidth), 'Messages'].join('  ');
  const divider = [''.padEnd(statusWidth, '-'), ''.padEnd(fileWidth, '-'), ''.padEnd(8, '-')].join(
    '  ',
  );
  console.log(header);
  console.log(divider);
  rows.forEach((row) => {
    console.log(
      [row.status.padEnd(statusWidth), row.file.padEnd(fileWidth), row.messages].join('  '),
    );
  });
  console.log('');

  const failed = rows.some((row) => row.status === 'FAIL');
  process.exitCode = failed ? 1 : 0;
}

main().catch((error) => {
  console.error('Unexpected error running data lint:', error);
  process.exitCode = 1;
});
