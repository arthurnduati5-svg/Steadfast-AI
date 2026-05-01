export type MediaScrollMode = 'stage' | 'flow';

type ScrollBehaviorLike = Extract<ScrollBehavior, 'auto' | 'smooth'>;

// STRICT: Media scroll ownership is explicit.
// Stage mode may only move the inner viewport.
// Flow mode may only move the workspace shell.
// Do not replace this contract with scrollIntoView because that lets the
// browser pick a different ancestor and the bottom-gap bug comes back.
export interface MediaScrollContainer {
  scrollTop: number;
  scrollTo?: (options: { top: number; behavior?: ScrollBehaviorLike }) => void;
  getBoundingClientRect: () => { top: number };
}

export interface MediaScrollAnchor {
  getBoundingClientRect: () => { top: number };
}

function clampScrollTop(nextTop: number): number {
  return Number.isFinite(nextTop) ? Math.max(0, nextTop) : 0;
}

export function measureScrollTopWithin(
  container: MediaScrollContainer,
  anchor: MediaScrollAnchor
): number {
  const containerTop = container.getBoundingClientRect().top;
  const anchorTop = anchor.getBoundingClientRect().top;
  return clampScrollTop(anchorTop - containerTop + container.scrollTop);
}

export function writeScrollTop(
  container: MediaScrollContainer | null | undefined,
  nextTop: number,
  behavior: ScrollBehaviorLike = 'auto'
): boolean {
  if (!container) return false;
  const resolvedTop = clampScrollTop(nextTop);
  if (typeof container.scrollTo === 'function') {
    container.scrollTo({ top: resolvedTop, behavior });
  } else {
    container.scrollTop = resolvedTop;
  }
  return true;
}

export function scrollMediaOwnerToAnchor(args: {
  mode: MediaScrollMode;
  workspace: MediaScrollContainer | null | undefined;
  viewport: MediaScrollContainer | null | undefined;
  target?: MediaScrollAnchor | null;
  behavior?: ScrollBehaviorLike;
}): 'workspace' | 'viewport' | 'none' {
  const behavior = args.behavior || 'auto';

  if (args.mode === 'stage') {
    if (!args.viewport) return 'none';
    const nextTop = args.target ? measureScrollTopWithin(args.viewport, args.target) : 0;
    writeScrollTop(args.viewport, nextTop, behavior);
    return 'viewport';
  }

  if (args.workspace) {
    const anchor = args.viewport || args.target || null;
    const nextTop = anchor ? measureScrollTopWithin(args.workspace, anchor) : 0;
    writeScrollTop(args.workspace, nextTop, behavior);
    return 'workspace';
  }

  if (args.viewport) {
    const nextTop = args.target ? measureScrollTopWithin(args.viewport, args.target) : 0;
    writeScrollTop(args.viewport, nextTop, behavior);
    return 'viewport';
  }

  return 'none';
}

export function resetMediaScrollContract(args: {
  workspace?: MediaScrollContainer | null;
  viewport?: MediaScrollContainer | null;
}): void {
  writeScrollTop(args.viewport, 0, 'auto');
  writeScrollTop(args.workspace, 0, 'auto');
}
