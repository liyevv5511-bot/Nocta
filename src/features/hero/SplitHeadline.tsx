import { motion } from 'framer-motion';
import { useMemo } from 'react';

import { cn } from '@/lib/cn';
import { charReveal, stagger } from '@/lib/motion';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';

export interface SplitHeadlineProps {
  text: string;
  /** Words rendered in the accent gradient. Matched case-insensitively. */
  emphasise?: readonly string[];
  className?: string;
  delay?: number;
  as?: 'h1' | 'h2';
}

/**
 * Per-character headline reveal.
 *
 * Splitting text into spans destroys it for assistive technology — a screen
 * reader reads forty individual letters. The fix is structural, not
 * cosmetic: the real sentence is rendered once in a visually-hidden node, and
 * the animated copy is marked `aria-hidden`. Word boundaries also stay
 * intact (`inline-block` per word, characters inside), so the headline still
 * wraps like text rather than breaking mid-word at narrow widths.
 */
export function SplitHeadline({
  text,
  emphasise = [],
  className,
  delay = 0,
  as: Tag = 'h1',
}: SplitHeadlineProps): React.ReactElement {
  const reducedMotion = usePrefersReducedMotion();

  const words = useMemo(() => {
    const emphasised = new Set(emphasise.map((word) => word.toLowerCase()));
    return text.split(' ').map((word) => ({
      word,
      highlight: emphasised.has(word.toLowerCase().replace(/[^a-z]/gi, '')),
    }));
  }, [text, emphasise]);

  if (reducedMotion) {
    return (
      <Tag className={className}>
        {words.map(({ word, highlight }, index) => (
          <span
            key={`${word}-${String(index)}`}
            className={highlight ? 'text-gradient' : undefined}
          >
            {word}
            {index < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </Tag>
    );
  }

  return (
    <Tag className={className}>
      <span className="sr-only">{text}</span>

      <motion.span
        aria-hidden="true"
        variants={stagger(0.022, delay)}
        initial="hidden"
        animate="visible"
        className="inline"
        style={{ perspective: '800px' }}
      >
        {words.map(({ word, highlight }, wordIndex) => (
          <span
            key={`${word}-${String(wordIndex)}`}
            className={cn('inline-block whitespace-nowrap', highlight && 'text-gradient')}
          >
            {splitGraphemes(word).map((character, charIndex) => (
              <motion.span
                key={`${character}-${String(charIndex)}`}
                variants={charReveal}
                className="inline-block"
                style={{ transformOrigin: 'center bottom' }}
              >
                {character}
              </motion.span>
            ))}
            {wordIndex < words.length - 1 ? <span className="inline-block">&nbsp;</span> : null}
          </span>
        ))}
      </motion.span>
    </Tag>
  );
}

/**
 * Splits a word into user-perceived characters.
 *
 * `[...word]` yields code points, which tears apart emoji sequences and
 * combining marks — and city names in this product carry diacritics.
 * `Intl.Segmenter` is the correct tool and is available everywhere the rest of
 * this app runs; the spread is kept only as a fallback.
 */
function splitGraphemes(word: string): string[] {
  if (typeof Intl.Segmenter === 'function') {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    return [...segmenter.segment(word)].map((segment) => segment.segment);
  }
  return word.split('');
}
