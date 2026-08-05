import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Accordion, type AccordionItem } from './Accordion';

const ITEMS: AccordionItem[] = [
  { id: 'one', question: 'First question', answer: <p>First answer</p> },
  { id: 'two', question: 'Second question', answer: <p>Second answer</p> },
  { id: 'three', question: 'Third question', answer: <p>Third answer</p> },
];

describe('Accordion', () => {
  it('starts collapsed and wires aria-expanded', async () => {
    render(<Accordion items={ITEMS} />);
    const first = screen.getByRole('button', { name: 'First question' });

    expect(first).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(first);
    expect(first).toHaveAttribute('aria-expanded', 'true');
  });

  it('opens the item named by defaultOpenId', () => {
    render(<Accordion items={ITEMS} defaultOpenId="two" />);
    expect(screen.getByRole('button', { name: 'Second question' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('closes the previous panel in single mode', async () => {
    render(<Accordion items={ITEMS} mode="single" defaultOpenId="one" />);

    await userEvent.click(screen.getByRole('button', { name: 'Second question' }));

    expect(screen.getByRole('button', { name: 'First question' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.getByRole('button', { name: 'Second question' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('keeps panels open in multiple mode', async () => {
    render(<Accordion items={ITEMS} mode="multiple" defaultOpenId="one" />);

    await userEvent.click(screen.getByRole('button', { name: 'Second question' }));

    expect(screen.getByRole('button', { name: 'First question' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('moves focus between headers with the arrow keys, wrapping at the ends', async () => {
    render(<Accordion items={ITEMS} />);
    const [first, second, third] = ITEMS.map((item) =>
      screen.getByRole('button', { name: item.question }),
    );

    first?.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(second).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    expect(third).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    expect(first).toHaveFocus();

    await userEvent.keyboard('{ArrowUp}');
    expect(third).toHaveFocus();
  });

  it('jumps to the ends with Home and End', async () => {
    render(<Accordion items={ITEMS} />);
    const second = screen.getByRole('button', { name: 'Second question' });

    second.focus();
    await userEvent.keyboard('{End}');
    expect(screen.getByRole('button', { name: 'Third question' })).toHaveFocus();

    await userEvent.keyboard('{Home}');
    expect(screen.getByRole('button', { name: 'First question' })).toHaveFocus();
  });

  it('links each panel back to its header', async () => {
    render(<Accordion items={ITEMS} />);
    const header = screen.getByRole('button', { name: 'First question' });

    await userEvent.click(header);

    const region = screen.getByRole('region', { name: 'First question' });
    expect(header.getAttribute('aria-controls')).toBe(region.id);
  });

  it('keeps headings in the document outline', () => {
    render(<Accordion items={ITEMS} />);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3);
  });
});
