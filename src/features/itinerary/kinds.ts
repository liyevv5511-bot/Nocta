import type { ActivityKind, Mood } from '@/types/itinerary';

/**
 * Presentation metadata for the activity taxonomy.
 *
 * Colours are token classes, never hex — an activity kind that needs a new
 * colour needs a new token, which is a deliberate decision rather than an
 * ad-hoc one made inside a component.
 */
export interface KindMeta {
  label: string;
  textClass: string;
  dotClass: string;
}

export const KIND_META: Record<ActivityKind, KindMeta> = {
  landmark: { label: 'Landmark', textClass: 'text-accent', dotClass: 'bg-accent' },
  museum: { label: 'Museum', textClass: 'text-accent-alt', dotClass: 'bg-accent-alt' },
  food: { label: 'Meal', textClass: 'text-accent-warm', dotClass: 'bg-accent-warm' },
  cafe: { label: 'Coffee', textClass: 'text-accent-warm', dotClass: 'bg-accent-warm' },
  nightlife: { label: 'Nightlife', textClass: 'text-accent-alt', dotClass: 'bg-accent-alt' },
  nature: { label: 'Outdoors', textClass: 'text-success', dotClass: 'bg-success' },
  shopping: { label: 'Shopping', textClass: 'text-secondary', dotClass: 'bg-secondary' },
  transit: { label: 'Getting there', textClass: 'text-tertiary', dotClass: 'bg-tertiary' },
  stay: { label: 'Stay', textClass: 'text-secondary', dotClass: 'bg-secondary' },
  experience: { label: 'Experience', textClass: 'text-accent', dotClass: 'bg-accent' },
};

export interface MoodMeta {
  label: string;
  description: string;
  icon: string;
}

/** The atmosphere chips on the planning form. */
export const MOOD_META: Record<Mood, MoodMeta> = {
  relax: {
    label: 'Relax',
    description: 'Fewer stops, longer sits, nothing before nine.',
    icon: '◐',
  },
  adventure: {
    label: 'Adventure',
    description: 'Hikes, day trips, and things that need proper shoes.',
    icon: '▲',
  },
  food: {
    label: 'Food',
    description: 'Markets, counters, and dinners worth planning the day around.',
    icon: '●',
  },
  culture: {
    label: 'Culture',
    description: 'Museums, architecture, and the buildings people argue about.',
    icon: '◼',
  },
  nightlife: {
    label: 'Nightlife',
    description: 'Bars, live music, and a finish after midnight.',
    icon: '◆',
  },
  nature: {
    label: 'Nature',
    description: 'Parks, coastline, and somewhere green to stop.',
    icon: '❋',
  },
};

export const MOOD_ORDER: Mood[] = ['relax', 'adventure', 'food', 'culture', 'nightlife', 'nature'];
