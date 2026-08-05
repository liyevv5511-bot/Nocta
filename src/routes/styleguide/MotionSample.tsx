import { motion, type Variants } from 'framer-motion';
import { useState } from 'react';

import { Button } from '@/features/ui';
import { stagger } from '@/lib/motion';

/**
 * Replayable demonstration of a shared motion variant.
 *
 * Remounting via a `key` bump rather than driving `animate` manually: the
 * variant under demonstration owns its own `hidden` → `visible` transition,
 * and re-running it from scratch is exactly what the reader wants to see.
 */
export function MotionSample({
  variants,
  label,
}: {
  variants: Variants;
  label: string;
}): React.ReactElement {
  const [key, setKey] = useState(0);

  return (
    <div className="flex items-center gap-4">
      <motion.div
        key={key}
        variants={stagger(0.06)}
        initial="hidden"
        animate="visible"
        className="flex gap-2"
      >
        {[0, 1, 2].map((index) => (
          <motion.span key={index} variants={variants} className="size-8 rounded-sm bg-accent" />
        ))}
      </motion.div>

      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          setKey((value) => value + 1);
        }}
      >
        Replay {label}
      </Button>
    </div>
  );
}
