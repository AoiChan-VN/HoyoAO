/**
 * OS Storage Migrations (§59, §60)
 *
 * Versioned migrations for OS-scoped persistent storage. New migrations are
 * APPENDED with incrementing versions; existing migrations are never edited,
 * preserving backward compatibility (§60).
 */

export const OS_STORAGE_VERSION = 1;

export const OS_STORAGE_MIGRATIONS = [
  {
    version: 1,
    description: 'Baseline OS storage schema.',
    async up(partition) {
      await partition.set('schema', {
        version: 1,
        owner: 'os',
        createdAt: Date.now(),
      });
    },
  },
]; 
