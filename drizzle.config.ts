import type { Config } from 'drizzle-kit';

export default {
  schema: './electron/database/schema.ts',
  out: './electron/database/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: './deckhand.db',
  },
  verbose: true,
  strict: true,
} satisfies Config;
