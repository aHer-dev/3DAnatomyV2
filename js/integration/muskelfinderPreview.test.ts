import { describe, it, expect, afterEach } from 'vitest'
import { isMuskelfinderPreviewMode } from './muskelfinderPreview.js'

/*
 * Die Vorschau ist ein STANDBILD: Sie schaltet die React-UI, `setupInteractions()` und
 * `initRoomSettings()` ab. Wer sie faelschlich anwirft, nimmt dem Nutzer die Bedienung,
 * den Rueckweg und die sichtbare CC-BY-Attribution (ADR 0005).
 *
 * Bis 2026-07-14 genuegte dafuer `source=muskelfinder` + `muscleKey` — also genau der Link,
 * den der Muskelfinder bei JEDEM „In 3D ansehen" schickt, und zwar per `<a target="_blank">`.
 * Live nachgemessen: 0 Knoepfe, 0 Links, keine Lizenz. Der Muskelfinder bettet nichts ein.
 */

/** Ein `window`, wie die Vorschau es sieht. `top === self` heisst: kein fremder Rahmen. */
function stubWindow(search: string, { embedded = false } = {}) {
  const self = { location: { search } }
  const win = embedded ? { ...self, self, top: { andersartig: true } } : { ...self, self, top: self }
  // @ts-expect-error — Test-Stub, absichtlich kein vollstaendiges Window
  globalThis.window = win
}

afterEach(() => {
  delete globalThis.window
})

const MUSKELFINDER_LINK = '?muscleKey=m_deltoideus&muscle=M.+deltoideus&source=muskelfinder'

describe('isMuskelfinderPreviewMode — die Herkunft allein reicht NICHT', () => {
  it('ein normaler Muskelfinder-Link (neuer Tab) ist KEINE Vorschau', () => {
    // Der Regressionsfall: genau das schickt `threeDUrl()` im Muskelfinder.
    stubWindow(MUSKELFINDER_LINK)

    expect(isMuskelfinderPreviewMode()).toBe(false)
  })

  it('eingebettet (fremder Rahmen) ist es eine Vorschau', () => {
    stubWindow(MUSKELFINDER_LINK, { embedded: true })

    expect(isMuskelfinderPreviewMode()).toBe(true)
  })

  it('`preview=1` verlangt die Vorschau ausdruecklich — auch ohne Rahmen', () => {
    stubWindow(`${MUSKELFINDER_LINK}&preview=1`)

    expect(isMuskelfinderPreviewMode()).toBe(true)
  })
})

describe('isMuskelfinderPreviewMode — ohne Muskel-Kontext gibt es nichts vorzuschauen', () => {
  it('kein Muskel, kein Vorschaumodus — selbst im Rahmen', () => {
    stubWindow('?source=muskelfinder', { embedded: true })

    expect(isMuskelfinderPreviewMode()).toBe(false)
  })

  it('fremde Herkunft bleibt aussen vor', () => {
    stubWindow('?muscleKey=m_deltoideus&source=woanders', { embedded: true })

    expect(isMuskelfinderPreviewMode()).toBe(false)
  })

  it('ganz ohne Parameter ist es die normale App', () => {
    stubWindow('', { embedded: true })

    expect(isMuskelfinderPreviewMode()).toBe(false)
  })
})
