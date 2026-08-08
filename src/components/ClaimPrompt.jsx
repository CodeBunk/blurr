import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useSession } from '../context/SessionProvider'

// Surfaces "is this you?" for unclaimed guest tags that loosely match the
// signed-in user's name, anywhere in the app — not just onboarding, since a
// friend might tag you on a bottle at any time.
export default function ClaimPrompt() {
  const { profile } = useSession()
  const [candidates, setCandidates] = useState([])
  const [dismissed, setDismissed] = useState(() => new Set())

  const load = async () => {
    const { data, error } = await supabase.rpc('list_claimable_tags')
    if (!error) setCandidates(data || [])
  }

  useEffect(() => {
    if (profile) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  const visible = candidates.filter((c) => !dismissed.has(c.participant_id))
  if (!visible.length) return null

  const claim = async (participantId) => {
    const { error } = await supabase.rpc('claim_tag', { target_participant_id: participantId })
    if (!error) {
      setCandidates((c) => c.filter((x) => x.participant_id !== participantId))
    }
  }

  const dismiss = (participantId) => setDismissed((d) => new Set(d).add(participantId))

  return (
    <div className="mx-auto max-w-2xl px-6 pt-6 flex flex-col gap-2">
      {visible.map((c) => (
        <div
          key={c.participant_id}
          className="flex items-center justify-between gap-3 bg-[#FFF6C9] border border-black/10 rounded-xl px-4 py-3"
        >
          <p className="text-sm">
            You were tagged as <b>{c.guest_name}</b> on <b>{c.bottle_label}</b>. Is that you?
          </p>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => claim(c.participant_id)}
              className="font-mono text-[10.5px] uppercase tracking-wider bg-black text-[#F4F3F0] rounded px-3 py-1.5"
            >
              That's me
            </button>
            <button
              onClick={() => dismiss(c.participant_id)}
              className="font-mono text-[10.5px] uppercase tracking-wider border border-black/15 rounded px-3 py-1.5"
            >
              Not me
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
