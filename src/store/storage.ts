import { initialState, type AppState } from './state';

/**
 * Persistence port. Local-first today (localStorage); the interface lets a
 * synced backend (Supabase, Firebase, own API) replace it without touching UI.
 */
export interface StateStorage {
  load(): AppState;
  save(state: AppState): void;
}

const KEY = 'wellfood:state';

/** Upgrade older shapes here as the schema evolves (switch on `version`). */
function migrate(raw: unknown): AppState {
  if (!raw || typeof raw !== 'object') return initialState;
  const s = raw as Partial<AppState>;
  if (s.version !== 1) return initialState;
  // Shallow-merge so newly added fields get defaults.
  return { ...initialState, ...s, prefs: { ...initialState.prefs, ...s.prefs } };
}

export const localStateStorage: StateStorage = {
  load() {
    try {
      const json = localStorage.getItem(KEY);
      return json ? migrate(JSON.parse(json)) : initialState;
    } catch {
      return initialState;
    }
  },
  save(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* quota / private mode: app keeps working in-memory */
    }
  },
};
