import { useState } from 'react';

import {
  Accordion,
  ActivityCardSkeleton,
  Button,
  Chip,
  Skeleton,
  Slider,
  toast,
  Toggle,
  type ButtonVariant,
} from '@/features/ui';

import { StyleguideSection } from './StyleguideSection';

const BUTTON_VARIANTS: readonly ButtonVariant[] = [
  'primary',
  'secondary',
  'ghost',
  'glass',
  'danger',
];

/**
 * Live gallery of every interactive primitive.
 *
 * Stateful on purpose — these are the real components wired to real state, not
 * screenshots. If the slider stops responding here, it has stopped responding
 * in the planner too.
 */
export function PrimitiveGallery(): React.ReactElement {
  const [budget, setBudget] = useState(180);
  const [notify, setNotify] = useState(true);
  const [selectedChips, setSelectedChips] = useState<string[]>(['food']);

  return (
    <StyleguideSection
      id="primitives"
      title="Primitives"
      description="Every interactive element in the product is one of these. All are keyboard operable, all take their focus ring from one global rule, and all announce their state."
    >
      <div className="space-y-10">
        <div>
          <p className="eyebrow">Button</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {BUTTON_VARIANTS.map((variant) => (
              <Button key={variant} variant={variant}>
                {variant}
              </Button>
            ))}
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
          </div>
        </div>

        <div>
          <p className="eyebrow">Chip</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {['relax', 'food', 'culture', 'nightlife'].map((mood) => (
              <Chip
                key={mood}
                selected={selectedChips.includes(mood)}
                onToggle={(next) => {
                  setSelectedChips((current) =>
                    next ? [...current, mood] : current.filter((m) => m !== mood),
                  );
                }}
              >
                {mood}
              </Chip>
            ))}
            <Chip size="sm">static tag</Chip>
          </div>
        </div>

        <div className="max-w-md">
          <p className="eyebrow">Slider</p>
          <div className="mt-3">
            <Slider
              label="Daily budget"
              min={40}
              max={400}
              step={10}
              value={budget}
              onChange={setBudget}
              displayValue={`€${String(budget)}`}
              scale={['€40', '€220', '€400']}
            />
          </div>
        </div>

        <div>
          <p className="eyebrow">Toggle</p>
          <div className="mt-3">
            <Toggle
              checked={notify}
              onChange={setNotify}
              label="Warn about closures"
              description="Flags Monday closures and market days on affected activities."
            />
          </div>
        </div>

        <div>
          <p className="eyebrow">Skeleton</p>
          <div className="mt-3 max-w-lg space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <ActivityCardSkeleton />
          </div>
        </div>

        <div>
          <p className="eyebrow">Toast</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                toast.success('Saved', 'Find it under Saved trips.');
              }}
            >
              Success
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                toast.error('Generation failed', 'The planner did not respond.');
              }}
            >
              Error (pinned)
            </Button>
          </div>
        </div>

        <div className="max-w-2xl">
          <p className="eyebrow">Accordion</p>
          <div className="mt-3">
            <Accordion
              items={[
                {
                  id: 'a',
                  question: 'Arrow keys move between headers',
                  answer: <p>Home and End jump to the first and last. Panels animate height.</p>,
                },
                {
                  id: 'b',
                  question: 'aria-expanded and aria-controls are wired',
                  answer: <p>Headers are real buttons inside real headings.</p>,
                },
              ]}
            />
          </div>
        </div>
      </div>
    </StyleguideSection>
  );
}
