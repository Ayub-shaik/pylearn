import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import postgres from 'postgres';

import { config } from '../config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  const sql = postgres(config.databaseUrl, { max: 1 });
  const migrationsDir = path.resolve(__dirname, 'migrations');
  const files = (await fs.readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort();

  for (const file of files) {
    const contents = await fs.readFile(path.join(migrationsDir, file), 'utf8');
    console.log(`Applying migration ${file}...`);
    await sql.unsafe(contents);
  }

  console.log('Migrations complete.');
  await sql.end();
}

main().catch((error) => {
  console.error('Migration failed', error);
  process.exit(1);
});
