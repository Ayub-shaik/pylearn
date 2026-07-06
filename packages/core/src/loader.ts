import { promises as fs } from 'fs';
import path from 'node:path';

import type { Lesson, Module, Track } from './types';

interface TrackModuleReference {
  id: string;
  title: string;
  path: string;
}

interface ModuleLessonReference {
  id: string;
  title: string;
  path: string;
}

interface RawTrack {
  id: string;
  title: string;
  summary: string;
  description?: string;
  modules: TrackModuleReference[];
}

interface RawModule {
  id: string;
  trackId: string;
  title: string;
  summary: string;
  description?: string;
  lessons: ModuleLessonReference[];
  difficulty?: Module['difficulty'];
  tags?: string[];
  prerequisites?: string[];
}

/**
 * Load a track, its modules, and lessons from a directory on disk.
 * The directory must contain a `track.json` file with module references.
 * @todo TODO(impl): Add caching and validation against the JSON schema.
 */
export async function loadTrack(dir: string): Promise<Track> {
  const trackPath = path.resolve(dir, 'track.json');
  const trackRaw = await readJson<RawTrack>(trackPath);
  const modules: Module[] = [];

  for (const moduleRef of trackRaw.modules) {
    const modulePath = path.resolve(dir, moduleRef.path);
    const moduleRaw = await readJson<RawModule>(modulePath);
    const lessons: Lesson[] = [];
    for (const lessonRef of moduleRaw.lessons) {
      const lessonPath = path.resolve(path.dirname(modulePath), lessonRef.path);
      const lessonRaw = await readJson<Lesson>(lessonPath);
      lessons.push(lessonRaw);
    }
    modules.push({
      id: moduleRaw.id,
      trackId: moduleRaw.trackId,
      title: moduleRaw.title,
      summary: moduleRaw.summary,
      description: moduleRaw.description,
      lessons,
      difficulty: moduleRaw.difficulty,
      tags: moduleRaw.tags,
      prerequisites: moduleRaw.prerequisites,
    });
  }

  return {
    id: trackRaw.id,
    title: trackRaw.title,
    summary: trackRaw.summary,
    description: trackRaw.description,
    modules,
  };
}

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw) as T;
}
