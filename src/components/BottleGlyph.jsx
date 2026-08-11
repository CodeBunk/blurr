import { artFor } from '../lib/presets'

// Real illustrated bottle artwork, same source as the design bible. A
// user-uploaded photo takes priority over the illustrated skin, matching
// the original app's behaviour.
export default function BottleGlyph({ skin, photoUrl, size = 120 }) {
  const src = photoUrl || artFor(skin)
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      style={{
        height: size,
        width: 'auto',
        display: 'block',
        objectFit: 'contain',
        WebkitUserDrag: 'none',
        userSelect: 'none',
        pointerEvents: 'none',
      }}
    />
  )
}
