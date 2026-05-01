type FlowFactory<T> = () => T;

type GlobalFlowStore = {
  __steadfastFlowSingletons?: Map<string, unknown>;
};

const globalForFlowStore = globalThis as typeof globalThis & GlobalFlowStore;

function getFlowStore(): Map<string, unknown> {
  if (!globalForFlowStore.__steadfastFlowSingletons) {
    globalForFlowStore.__steadfastFlowSingletons = new Map<string, unknown>();
  }
  return globalForFlowStore.__steadfastFlowSingletons;
}

export function getOrCreateFlow<T>(key: string, factory: FlowFactory<T>): T {
  const store = getFlowStore();
  const existing = store.get(key);
  if (existing) return existing as T;

  const created = factory();
  store.set(key, created as unknown);
  return created;
}
