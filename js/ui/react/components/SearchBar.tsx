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

export function SearchBar() {
  const listboxId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef  = useRef<HTMLUListElement>(null)

  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState<SearchResult[]>([])
  const [active, setActive]     = useState(-1)
  const [loading, setLoading]   = useState(false)
  const [expanded, setExpanded] = useState(false)

  const metaById = useReactStore(s => s.metaById)
  const fuseRef  = useRef<Fuse<MetaEntry> | null>(null)

  // Rebuild Fuse index whenever meta changes
  useEffect(() => {
    const entries = Object.values(metaById)
    fuseRef.current = entries.length ? buildFuse(entries) : null
    setResults([])
    setQuery('')
  }, [metaById])

  // Focus input when expanded
  useEffect(() => {
    if (expanded) inputRef.current?.focus()
  }, [expanded])

  const collapse = useCallback(() => {
    setExpanded(false)
    setQuery('')
    setResults([])
  }, [])

  // Keyboard shortcut: / opens search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === '/') {
        e.preventDefault()
        setExpanded(true)
      }
      if (e.key === 'Escape') {
        collapse()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [collapse])

  const search = useCallback((q: string) => {
    setQuery(q)
    setActive(-1)
    if (!q.trim() || !fuseRef.current) { setResults([]); return }
    const raw = fuseRef.current.search(q, { limit: MAX_RESULTS * 3 })
      .filter(r => ENABLED_GROUPS.has(r.item.classification?.group ?? ''))
      .slice(0, MAX_RESULTS)
    setResults(raw as SearchResult[])
  }, [])

  const selectEntry = useCallback(async (entry: MetaEntry) => {
    setQuery('')
    setResults([])
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
    } else if (e.key === 'Escape') {
      collapse()
    }
  }, [results, active, selectEntry, collapse])

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      if (!listRef.current?.contains(document.activeElement)) {
        collapse()
      }
    }, 150)
  }, [collapse])

  const open = results.length > 0

  if (!expanded) {
    return (
      <button
        className="sb-search__toggle"
        title="Struktur suchen (/ zum Öffnen)"
        aria-label="Suche öffnen"
        onClick={() => setExpanded(true)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7"/>
          <line x1="16.5" y1="16.5" x2="22" y2="22"/>
        </svg>
      </button>
    )
  }

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
        {loading && <span className="sb-search__spinner" aria-hidden="true">⏳</span>}
      </div>

      {open && (
        <ul
          ref={listRef}
          id={listboxId}
          className="sb-search__results"
          role="listbox"
          aria-label="Suchergebnisse"
        >
          {results.map(({ item }, i) => {
            const displayLabel = getStructureDisplayLabel(item)
            const group = item.classification?.group ?? 'other'
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
                <span className="sb-search__item-primary">{displayLabel}</span>
                <span className="sb-search__item-group">{getGroupLabel(group)}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
