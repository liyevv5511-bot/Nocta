import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './Button';

describe('Button', () => {
  it('renders its label and fires onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Plan a trip</Button>);

    await userEvent.click(screen.getByRole('button', { name: 'Plan a trip' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is operable from the keyboard', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Generate</Button>);

    await userEvent.tab();
    expect(screen.getByRole('button')).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not fire while disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Generate
      </Button>,
    );

    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('announces the busy state and blocks interaction while loading', async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} loading>
        Generate
      </Button>,
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();

    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('keeps the label mounted while loading, so the width does not jump', () => {
    render(<Button loading>Generate</Button>);
    // Present in the accessibility tree and the DOM, just visually hidden.
    expect(screen.getByRole('button')).toHaveTextContent('Generate');
  });

  it('defaults to type="button" so it cannot accidentally submit a form', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('lets a caller override the variant class', () => {
    render(<Button className="w-40">Wide</Button>);
    expect(screen.getByRole('button').className).toContain('w-40');
  });
});
