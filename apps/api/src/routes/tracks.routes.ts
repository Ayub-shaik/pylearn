import path from 'node:path';

import type { FastifyInstance } from 'fastify';

import { config } from '../config';

import type { Track } from '@pylearn/core';
import { loadTrack } from '@pylearn/core/loader';


let cachedTrack: Track | undefined;

export async function getPythonBasicsTrack(): Promise<Track> {
  if (!cachedTrack) {
    cachedTrack = await loadTrack(path.join(config.contentDir, 'python-basics'));
  }
  return cachedTrack;
}

export function registerTrackRoutes(app: FastifyInstance): void {
  app.get('/api/tracks', async () => {
    const track = await getPythonBasicsTrack();
    return { tracks: [{ id: track.id, title: track.title, summary: track.summary }] };
  });

  app.get<{ Params: { trackId: string } }>('/api/tracks/:trackId', async (request, reply) => {
    const track = await getPythonBasicsTrack();
    if (track.id !== request.params.trackId) {
      reply.code(404).send({ error: 'Track not found' });
      return;
    }
    return track;
  });
}
