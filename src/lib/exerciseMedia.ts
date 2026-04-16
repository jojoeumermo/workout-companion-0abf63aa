import datasetRaw from '@/data/exerciseDataset.json';

const GITHUB_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

type DatasetEntry = { slug: string; names: string[]; freeExerciseDbId?: string };
type Dataset = { version: number; baseUrl: string; exercises: Record<string, DatasetEntry> };

const dataset = datasetRaw as Dataset;

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const nameIndex = new Map<string, string>();
for (const [id, entry] of Object.entries(dataset.exercises)) {
  for (const name of entry.names) {
    nameIndex.set(normalize(name), id);
  }
}

function resolveDatasetId(exerciseId: string, exerciseName?: string): string | null {
  const byId = dataset.exercises[exerciseId];
  if (byId) return exerciseId;

  if (exerciseName) {
    const norm = normalize(exerciseName);
    const matchedId = nameIndex.get(norm);
    if (matchedId) return matchedId;

    for (const [key, id] of nameIndex.entries()) {
      if (norm.includes(key) || key.includes(norm)) return id;
    }
  }

  return null;
}

export interface ExerciseMediaUrls {
  gif: string;
  image: string;
  slug: string;
}

export function getExerciseMediaUrls(exerciseId: string, exerciseName?: string): ExerciseMediaUrls | null {
  const resolvedId = resolveDatasetId(exerciseId, exerciseName);
  if (!resolvedId) return null;

  const entry = dataset.exercises[resolvedId];
  if (!entry?.freeExerciseDbId) return null;

  const dbId = entry.freeExerciseDbId;
  return {
    slug: entry.slug,
    gif:   `${GITHUB_BASE}/${dbId}/0.jpg`,
    image: `${GITHUB_BASE}/${dbId}/1.jpg`,
  };
}

export function getExerciseSlug(exerciseId: string, exerciseName?: string): string | null {
  const resolvedId = resolveDatasetId(exerciseId, exerciseName);
  return resolvedId ? dataset.exercises[resolvedId].slug : null;
}

export function getAllDatasetEntries(): Array<{ id: string; slug: string; names: string[]; freeExerciseDbId?: string }> {
  return Object.entries(dataset.exercises).map(([id, entry]) => ({
    id,
    slug: entry.slug,
    names: entry.names,
    freeExerciseDbId: entry.freeExerciseDbId,
  }));
}

export function getMatchStats(): { matched: number; unmatched: string[] } {
  const entries = Object.entries(dataset.exercises);
  const matched = entries.filter(([, e]) => !!e.freeExerciseDbId).length;
  const unmatched = entries.filter(([, e]) => !e.freeExerciseDbId).map(([, e]) => e.names[0]);
  return { matched, unmatched };
}
