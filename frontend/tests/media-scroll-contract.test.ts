import { describe, expect, it } from 'vitest';

import {
  measureScrollTopWithin,
  resetMediaScrollContract,
  scrollMediaOwnerToAnchor,
} from '@/lib/media-stream/scroll-contract';

function createScrollContainer(top: number, scrollTop = 0) {
  const calls: Array<{ top: number; behavior?: 'auto' | 'smooth' }> = [];
  const container = {
    scrollTop,
    scrollTo: ({ top: nextTop, behavior }: { top: number; behavior?: 'auto' | 'smooth' }) => {
      calls.push({ top: nextTop, behavior });
      container.scrollTop = nextTop;
    },
    getBoundingClientRect: () => ({ top }),
  };
  return { container, calls };
}

function createAnchor(top: number) {
  return {
    getBoundingClientRect: () => ({ top }),
  };
}

describe('Media scroll contract', () => {
  it('keeps stage scrolling inside the viewport', () => {
    const { container: workspace, calls: workspaceCalls } = createScrollContainer(24, 180);
    const { container: viewport, calls: viewportCalls } = createScrollContainer(120, 40);
    const target = createAnchor(250);

    const owner = scrollMediaOwnerToAnchor({
      mode: 'stage',
      workspace,
      viewport,
      target,
      behavior: 'smooth',
    });

    expect(owner).toBe('viewport');
    expect(viewportCalls).toEqual([{ top: 170, behavior: 'smooth' }]);
    expect(workspaceCalls).toEqual([]);
  });

  it('keeps flow scrolling on the workspace shell instead of the viewport', () => {
    const { container: workspace, calls: workspaceCalls } = createScrollContainer(20, 30);
    const { container: viewport, calls: viewportCalls } = createScrollContainer(260, 90);

    const owner = scrollMediaOwnerToAnchor({
      mode: 'flow',
      workspace,
      viewport,
      behavior: 'auto',
    });

    expect(owner).toBe('workspace');
    expect(workspaceCalls).toEqual([{ top: 270, behavior: 'auto' }]);
    expect(viewportCalls).toEqual([]);
  });

  it('measures offsets relative to the chosen scroll owner', () => {
    const { container } = createScrollContainer(100, 25);
    const target = createAnchor(340);

    expect(measureScrollTopWithin(container, target)).toBe(265);
  });

  it('resets the viewport and workspace scroll layers together', () => {
    const { container: workspace, calls: workspaceCalls } = createScrollContainer(0, 320);
    const { container: viewport, calls: viewportCalls } = createScrollContainer(120, 95);

    resetMediaScrollContract({ workspace, viewport });

    expect(viewportCalls).toEqual([{ top: 0, behavior: 'auto' }]);
    expect(workspaceCalls).toEqual([{ top: 0, behavior: 'auto' }]);
  });
});
