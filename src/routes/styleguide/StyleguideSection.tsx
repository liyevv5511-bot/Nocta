import type { ReactNode } from 'react';

export interface StyleguideSectionProps {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}

export function StyleguideSection({
  id,
  title,
  description,
  children,
}: StyleguideSectionProps): React.ReactElement {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-24 py-14">
      <h2 id={`${id}-heading`} className="text-h1 text-primary">
        {title}
      </h2>
      <p className="mt-3 max-w-prose text-body text-secondary">{description}</p>
      <div className="mt-8">{children}</div>
    </section>
  );
}

export function Swatch({ name, variable }: { name: string; variable: string }): React.ReactElement {
  return (
    <div className="min-w-0">
      <div
        className="h-16 w-full rounded-md border border-subtle"
        style={{ background: `var(${variable})` }}
      />
      <p className="mt-2 truncate text-sm font-medium text-primary">{name}</p>
      <p className="truncate font-mono text-mono-xs text-tertiary">{variable}</p>
    </div>
  );
}

export function SpecRow({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: ReactNode;
}): React.ReactElement {
  return (
    <div className="grid items-center gap-4 border-b border-subtle py-4 sm:grid-cols-[12rem_10rem_1fr]">
      <p className="text-sm font-medium text-primary">{label}</p>
      <p className="font-mono text-mono-xs text-tertiary">{value}</p>
      <div>{children}</div>
    </div>
  );
}
