import { useState } from 'react'
import Modal from './Modal'
import TagPicker from './TagPicker'
import { PRESETS, PRESET_KEYS, artFor } from '../lib/presets'
import { shrink } from '../lib/resize'
import { Audio2 } from '../lib/audio'

export default function AddBottleModal({ onClose, onSave }) {
  const [skin, setSkin] = useState(null)
  const [label, setLabel] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [currency, setCurrency] = useState('₹')
  const [cost, setCost] = useState('')
  const [extras, setExtras] = useState([])
  const [photoDataUrl, setPhotoDataUrl] = useState(null)
  const [photoUrlInput, setPhotoUrlInput] = useState('')
  const [tags, setTags] = useState([])
  const [busy, setBusy] = useState(false)

  const onPhoto = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      setPhotoDataUrl(await shrink(file, 900, 0.85, true))
      setPhotoUrlInput('')
    } catch {
      /* ignore bad image */
    }
  }

  const applyPhotoUrl = () => {
    const u = photoUrlInput.trim()
    if (!u) return
    setPhotoDataUrl(u)
  }

  const pick = (k) => {
    setSkin(k)
    Audio2.click()
    if (!label) setLabel(PRESETS[k].label)
    if (!cost) setCost(PRESETS[k].price || '')
  }

  const addExtra = () => setExtras([...extras, { name: '', amt: '' }])
  const updateExtra = (i, field, value) => setExtras(extras.map((x, idx) => (idx === i ? { ...x, [field]: value } : x)))
  const removeExtra = (i) => setExtras(extras.filter((_, idx) => idx !== i))

  const submit = async (e) => {
    e.preventDefault()
    if (!skin) return
    setBusy(true)
    try {
      await onSave({
        skin,
        label: label.trim() || PRESETS[skin].label,
        ml: PRESETS[skin].ml,
        date,
        currency,
        cost: Number(cost) || 0,
        extras: extras.filter((x) => x.name.trim() || Number(x.amt)).map((x) => ({ name: x.name.trim() || '—', amt: Number(x.amt) || 0 })),
        photoDataUrl,
        tags,
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="Add a bottle" subtitle="Pick a bottle. Everything else is optional." onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field">
          <label>The bottle</label>
          <div className="skins">
            {PRESET_KEYS.map((k) => (
              <button
                type="button"
                key={k}
                data-skin={k}
                aria-pressed={k === skin}
                onClick={() => pick(k)}
                onPointerEnter={() => Audio2.hover()}
                title={PRESETS[k].label}
              >
                <img src={artFor(k)} alt={PRESETS[k].label} />
              </button>
            ))}
          </div>
          {skin && (
            <div className="picked">
              <img src={photoDataUrl || artFor(skin)} alt="" />
              <span style={{ flex: 1 }}>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  style={{ border: 'none', borderBottom: '1px solid var(--line)', padding: '5px 0', fontSize: 15, width: '100%' }}
                />
                <span className="help">name this bottle</span>
              </span>
            </div>
          )}
        </div>

        <div className="row" style={{ marginBottom: 4 }}>
          <div className="field">
            <label>The night <span className="opt">optional</span></label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="field narrow">
            <label>Cur</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {['₹', 'QAR', '$', '€'].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field narrow">
            <label>Price</label>
            <input type="number" min="0" step="1" inputMode="decimal" placeholder="0" value={cost} onChange={(e) => setCost(e.target.value)} />
          </div>
        </div>
        <p className="help" style={{ margin: '-10px 0 18px' }}>
          Price fills in from the bottle you pick — a rough guess. Edit it to what you actually paid.
        </p>

        <div className="field">
          <label>Anything else on the bill <span className="opt">optional</span></label>
          {extras.map((x, i) => (
            <div className="extra-row" key={i}>
              <input
                type="text"
                placeholder="what"
                value={x.name}
                onChange={(e) => updateExtra(i, 'name', e.target.value)}
              />
              <input
                type="number"
                placeholder="0"
                inputMode="decimal"
                value={x.amt}
                onChange={(e) => updateExtra(i, 'amt', e.target.value)}
              />
              <button type="button" onClick={() => removeExtra(i)}>
                ×
              </button>
            </div>
          ))}
          <button type="button" className="btn" style={{ marginTop: 4 }} onClick={addExtra}>
            + line item
          </button>
        </div>

        <div className="field">
          <label>Swap the artwork for a real photo <span className="opt">optional</span></label>
          <label className="dropzone">
            tap to upload a cut-out PNG
            <input type="file" accept="image/*" hidden onChange={onPhoto} />
          </label>
          <input
            type="text"
            placeholder="…or paste an image URL"
            value={photoUrlInput}
            onChange={(e) => setPhotoUrlInput(e.target.value)}
            onBlur={applyPhotoUrl}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyPhotoUrl())}
            style={{ marginTop: 9, border: 'none', borderBottom: '1px solid var(--line)', background: 'transparent', padding: '8px 0', width: '100%', fontSize: 14.5 }}
          />
          {photoDataUrl && (
            <div className="thumbs">
              <div className="thumb">
                <img src={photoDataUrl} alt="" />
                <button
                  type="button"
                  onClick={() => {
                    setPhotoDataUrl(null)
                    setPhotoUrlInput('')
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          )}
          <p className="help">Leave blank to keep the illustrated skin. A photo replaces it just for this bottle.</p>
        </div>

        <div className="field">
          <label>Who was there <span className="opt">optional</span></label>
          <TagPicker tags={tags} setTags={setTags} />
        </div>

        <div className="actions">
          <button type="button" className="btn" onClick={onClose}>
            cancel
          </button>
          <button className="btn btn-solid" disabled={busy || !skin}>
            {busy ? 'saving…' : 'put it on the shelf'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
