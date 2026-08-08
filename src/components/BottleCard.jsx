import { Link } from 'react-router-dom'
import BottleGlyph from './BottleGlyph'

export default function BottleCard({ bottle }) {
  return (
    <Link
      to={`/b/${bottle.id}`}
      className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-transparent hover:border-black/10 hover:bg-white transition-colors"
    >
      <div className="h-20 flex items-end">
        <BottleGlyph skin={bottle.skin} photoUrl={bottle.photo_url} size={80} />
      </div>
      <span className="text-sm font-medium text-center leading-tight">{bottle.label}</span>
      {bottle.date && (
        <span className="font-mono text-[10px] uppercase tracking-wider text-[#94918B]">
          {new Date(bottle.date + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
        </span>
      )}
    </Link>
  )
}
