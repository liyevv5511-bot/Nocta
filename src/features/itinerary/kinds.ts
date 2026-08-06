import type { ActivityKind, Mood } from '@/types/itinerary';

/**
 * Presentation metadata for the activity taxonomy.
 *
 * Colours are token classes, never hex — an activity kind that needs a new
 * colour needs a new token, which is a deliberate decision rather than an
 * ad-hoc one made inside a component.
 */
export interface KindMeta {
  /** Dictionary key; the label itself is translated at render time. */
  labelKey: `kinds.${ActivityKind}`;
  textClass: string;
  dotClass: string;
}

export const KIND_META: Record<ActivityKind, KindMeta> = {
  landmark: { labelKey: 'kinds.landmark', textClass: 'text-accent', dotClass: 'bg-accent' },
  museum: { labelKey: 'kinds.museum', textClass: 'text-accent-alt', dotClass: 'bg-accent-alt' },
  food: { labelKey: 'kinds.food', textClass: 'text-accent-warm', dotClass: 'bg-accent-warm' },
  cafe: { labelKey: 'kinds.cafe', textClass: 'text-accent-warm', dotClass: 'bg-accent-warm' },
  nightlife: {
    labelKey: 'kinds.nightlife',
    textClass: 'text-accent-alt',
    dotClass: 'bg-accent-alt',
  },
  nature: { labelKey: 'kinds.nature', textClass: 'text-success', dotClass: 'bg-success' },
  shopping: { labelKey: 'kinds.shopping', textClass: 'text-secondary', dotClass: 'bg-secondary' },
  transit: { labelKey: 'kinds.transit', textClass: 'text-tertiary', dotClass: 'bg-tertiary' },
  stay: { labelKey: 'kinds.stay', textClass: 'text-secondary', dotClass: 'bg-secondary' },
  experience: { labelKey: 'kinds.experience', textClass: 'text-accent', dotClass: 'bg-accent' },
};

export interface MoodMeta {
  labelKey: `moods.${Mood}`;
  descriptionKey: `moods.${Mood}Detail`;
  icon: string;
}

/** The atmosphere chips on the planning form. Copy lives in the dictionary. */
export const MOOD_META: Record<Mood, MoodMeta> = {
  relax: {
    labelKey: 'moods.relax',
    descriptionKey: 'moods.relaxDetail',
    icon: '◐',
  },
  adventure: {
    labelKey: 'moods.adventure',
    descriptionKey: 'moods.adventureDetail',
    icon: '▲',
  },
  food: {
    labelKey: 'moods.food',
    descriptionKey: 'moods.foodDetail',
    icon: '●',
  },
  culture: {
    labelKey: 'moods.culture',
    descriptionKey: 'moods.cultureDetail',
    icon: '◼',
  },
  nightlife: {
    labelKey: 'moods.nightlife',
    descriptionKey: 'moods.nightlifeDetail',
    icon: '◆',
  },
  nature: {
    labelKey: 'moods.nature',
    descriptionKey: 'moods.natureDetail',
    icon: '❋',
  },
};

export const MOOD_ORDER: Mood[] = ['relax', 'adventure', 'food', 'culture', 'nightlife', 'nature'];
