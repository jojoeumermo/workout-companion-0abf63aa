import datasetRaw from '@/data/exerciseDataset.json';

type DatasetEntry = { slug: string; names: string[] };
type Dataset = { version: number; exercises: Record<string, DatasetEntry> };

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

export function getExerciseSlug(exerciseId: string, exerciseName?: string): string | null {
  const byId = dataset.exercises[exerciseId];
  if (byId) return byId.slug;

  if (exerciseName) {
    const normalizedName = normalize(exerciseName);
    const matchedId = nameIndex.get(normalizedName);
    if (matchedId) return dataset.exercises[matchedId].slug;

    for (const [key, id] of nameIndex.entries()) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        return dataset.exercises[id].slug;
      }
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
  const slug = getExerciseSlug(exerciseId, exerciseName);
  if (!slug) return null;
  return {
    slug,
    gif: `/exercise-media/${slug}.gif`,
    image: `/exercise-media/${slug}.jpg`,
  };
}

export function resolveExerciseMedia(
  customImage: string | undefined,
  exerciseId: string,
  exerciseName?: string
): { url: string; type: 'custom' | 'gif' | 'image' } | null {
  if (customImage) return { url: customImage, type: 'custom' };
  const urls = getExerciseMediaUrls(exerciseId, exerciseName);
  if (!urls) return null;
  return { url: urls.gif, type: 'gif' };
}

export function getAllDatasetEntries(): Array<{ id: string; slug: string; names: string[] }> {
  return Object.entries(dataset.exercises).map(([id, entry]) => ({
    id,
    slug: entry.slug,
    names: entry.names,
  }));
}
