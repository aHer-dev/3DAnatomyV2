// Bridges the Zustand vanilla store to React via the official useStore hook.
// Usage: const groups = useReactStore(s => s.groups)
import { useStore } from 'zustand'
import vanillaStore, { type StoreState } from '../../store/useStore.js'

export function useReactStore<T>(selector: (state: StoreState) => T): T {
  return useStore(vanillaStore, selector)
}
