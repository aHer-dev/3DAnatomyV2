import React, { useState, useEffect, useRef, useCallback, useId } from 'react'
import Fuse from 'fuse.js'
import { useReactStore } from '../useReactStore.js'
import { getGroupLabel, ENABLED_GROUPS } from '../groupLabels.js'
import { getStructureDisplayLabel } from '../../../utils/anatomyLabels.js'
import { loadGroupByName } from '../../../features/modelLoader-core.js'
import { highlightModel } from '../../../interaction/highlightModel.js'
import { focusOnObject } from '../../../core/cameraUtils.js'
import { camera } from '../../../core/camera.js'
import { controls } from '../../../core/controls.js'
import { getStore } from '../../../store/useStore.js'
import type { MetaEntry } from '../../../types/index.js'

const MAX_RESULTS = 10

interface SearchResult {
  item: MetaEntry
  score?: number
}

function buildFuse(entries: MetaEntry[]): Fuse<MetaEntry> {
  return new Fuse(entries, {
    threshold: 0.35,
    includeScore: true,
    keys: [
      { name: 'labels.la', weight: 3 },
      { name: 'labels.de', weight: 2 },
      { name: 'labels.en', weight: 1 },
      { name: 'id', weight: 0.5 },
    ],
  })
}

// Fuzzy-Treffer-Teil im Anzeigenamen hervorheben (Teilstring, case-insensitive).
function HighlightedLabel({ label, query }: { label: string; query: string }) {
  const q = query.trim()
  if (!q) return <>{label}</>
  const idx = label.toLowerCase().indexOf(q.toLowerCase())
  if (idx === -1) return <>{label}</>
  return (
    <>
      {label.slice(0, idx)}
      <mark className="sb-search__hl">{label.slice(idx, idx + q.length)}</mark>
      {label.slice(idx + q.length)}
    </>
  )
}

export function SearchBar() {
  const listboxId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const [query, setQuery]     = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [active, setActive]   = useState(-1)
  const [loading, setLoading] = useState(false)

  const metaById = useReactStore(s => s.metaById)
  const fuseRef  = useRef<Fuse<MetaEntry> | null>(null)

  // Rebuild Fuse index whenever meta changes
  useEffect(() => {
    const entries = Object.values(metaById)
    fuseRef.current = entries.length ? buildFuse(entries) : null
    setResults([])
    setQuery('')
  }, [metaById])

  const runSearch = useCallback((q: string) => {
    if (!q.trim() || !fuseRef.current) { setResults([]); return }
    const raw = fuseRef.current.search(q, { limit: MAX_RESULTS * 3 })
      .filter(r => ENABLED_GROUPS.has(r.item.classification?.group ?? ''))
      .slice(0, MAX_RESULTS)
    setResults(raw as SearchResult[])
  }, [])

  const search = useCallback((q: string) => {
    setQuery(q)
    setActive(-1)
    runSearch(q)
  }, [runSearch])

  const clear = useCallback(() => {
    setQuery('')
    setResults([])
    setActive(-1)
    inputRef.current?.blur()
  }, [])

  // Tastatur-Shortcut: „/" fokussiert die Suche, Esc leert sie
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const selectEntry = useCallback(async (entry: MetaEntry) => {
    setQuery('')
    setResults([])
    setActive(-1)
    inputRef.current?.blur()
    setLoading(true)
    try {
      const group = entry.classification?.group ?? 'other'
      const alreadyLoaded = (getStore().groups[group]?.length ?? 0) > 0
      if (!alreadyLoaded) await loadGroupByName(group, { centerCamera: false })

      const model = getStore().groups[group as keyof typeof getStore['prototype']]?.find(
        (m: any) => (m.userData?.meta?.id ?? m.userData?.entry?.id ?? m.name) === entry.id
      )
      if (model) {
        highlightModel(model)
        getStore().setSelection({ root: model, meta: entry })
        focusOnObject(camera, controls, model)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { clear(); return }
    if (!results.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive(a => Math.min(a + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive(a => Math.max(a - 1, 0))
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault()
      selectEntry(results[active].item)
    }
  }, [results, active, selectEntry, clear])

  // Beim Klick außerhalb das Dropdown schließen (Query bleibt erhalten)
  const handleBlur = useCallback(() => {
    setTimeout(() => {
      if (!panelRef.current?.contains(document.activeElement)) {
        setResults([])
        setActive(-1)
      }
    }, 150)
  }, [])

  const onFocus = useCallback(() => {
    if (query.trim()) runSearch(query)
  }, [query, runSearch])

  const open = results.length > 0

  return (
    <div className="sb-search" role="search" aria-label="Anatomische Strukturen durchsuchen">
      <div className="sb-search__wrap">
        <span className="sb-search__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7"/>
            <line x1="16.5" y1="16.5" x2="22" y2="22"/>
          </svg>
        </span>
        <input
          ref={inputRef}
          className="sb-search__input"
          type="search"
          value={query}
          onChange={e => search(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          onBlur={handleBlur}
          placeholder="Struktur suchen…"
          aria-label="Struktur suchen"
          aria-autocomplete="list"
          aria-controls={open ? listboxId : undefined}
          aria-activedescendant={active >= 0 ? `sr-item-${active}` : undefined}
          aria-busy={loading}
          autoComplete="off"
          spellCheck={false}
        />
        {loading && <span className="sb-search__spinner" aria-hidden="true" />}
      </div>

      {open && (
        <div className="sb-search__panel" ref={panelRef}>
          <div className="sb-search__meta">
            <span>{results.length} Treffer</span>
            <span className="sb-search__hint">↑ ↓ · Enter</span>
          </div>
          <ul
            id={listboxId}
            className="sb-search__results"
            role="listbox"
            aria-label="Suchergebnisse"
          >
            {results.map(({ item }, i) => {
              const displayLabel = getStructureDisplayLabel(item)
              const group = item.classification?.group ?? 'other'
              const dotStyle = { background: `var(--group-${group}, var(--group-default))` }
              return (
                <li
                  key={item.id}
                  id={`sr-item-${i}`}
                  role="option"
                  aria-selected={i === active}
                  className={`sb-search__item ${i === active ? 'is-active' : ''}`}
                  onMouseDown={e => { e.preventDefault(); selectEntry(item) }}
                  onMouseEnter={() => setActive(i)}
                >
                  <span className="sb-search__item-dot" style={dotStyle} aria-hidden="true" />
                  <span className="sb-search__item-primary">
                    <HighlightedLabel label={displayLabel} query={query} />
                  </span>
                  <span className="sb-search__item-group">{getGroupLabel(group)}</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
