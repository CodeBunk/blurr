import { supabase } from './supabaseClient'
import { dataUrlToBlob } from './resize'

// RLS already restricts this to bottles you own or are a claimed
// participant on — no manual filtering needed client-side. Ordered by each
// bottle's saved shelf position first, so drag-to-rearrange sticks.
export async function listMyShelf() {
  const { data, error } = await supabase
    .from('bottles')
    .select('*')
    .order('position', { ascending: true })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// Persists a new shelf order. Only the owner can move a bottle (RLS), so
// this quietly skips bottles you're only tagged on — they keep whatever
// position their owner set.
export async function reorderBottles(orderedBottles, myId) {
  const mine = orderedBottles.filter((b) => b.owner_id === myId)
  await Promise.all(mine.map((b, i) => supabase.from('bottles').update({ position: i }).eq('id', b.id)))
}

export async function getBottle(id) {
  const [{ data: bottle, error: e1 }, { data: participants, error: e2 }] = await Promise.all([
    supabase.from('bottles').select('*').eq('id', id).single(),
    supabase.from('bottle_participants').select('*').eq('bottle_id', id),
  ])
  if (e1) throw e1
  if (e2) throw e2

  const [{ data: stories, error: e3 }, { data: snaps, error: e4 }] = await Promise.all([
    supabase.from('bottle_stories').select('*').eq('bottle_id', id),
    supabase.from('bottle_snaps').select('*').eq('bottle_id', id).order('created_at', { ascending: true }),
  ])
  if (e3) throw e3
  if (e4) throw e4

  return { bottle, participants: participants || [], stories: stories || [], snaps: snaps || [] }
}

export async function createBottle({ skin, label, ml, date, cost, currency, extras, photoDataUrl }, tags, ownerId) {
  let photo_url = null
  if (photoDataUrl) photo_url = await uploadPhoto(photoDataUrl, ownerId)

  const { data: bottle, error } = await supabase
    .from('bottles')
    .insert({ owner_id: ownerId, skin, label, ml, date: date || null, cost, currency, extras, photo_url })
    .select()
    .single()
  if (error) throw error

  // Always seat the owner as a participant on their own bottle — otherwise
  // whoever logged it has no note field of their own on "the notes from
  // everyone" unless they explicitly tag themselves too.
  const rows = [{ bottle_id: bottle.id, user_id: ownerId, added_by: ownerId, claimed_at: new Date().toISOString() }]
  for (const t of tags) {
    if (t.userId && t.userId === ownerId) continue
    rows.push(
      t.userId
        ? { bottle_id: bottle.id, user_id: t.userId, added_by: ownerId, claimed_at: new Date().toISOString() }
        : { bottle_id: bottle.id, guest_name: t.name, added_by: ownerId }
    )
  }
  const { error: e2 } = await supabase.from('bottle_participants').insert(rows)
  if (e2) throw e2

  return bottle
}

export async function updateBottle(id, patch) {
  const { error } = await supabase.from('bottles').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteBottle(id) {
  const { error } = await supabase.from('bottles').delete().eq('id', id)
  if (error) throw error
}

export async function addTag(bottleId, tag, addedBy) {
  const row = tag.userId
    ? { bottle_id: bottleId, user_id: tag.userId, added_by: addedBy, claimed_at: new Date().toISOString() }
    : { bottle_id: bottleId, guest_name: tag.name, added_by: addedBy }
  const { data, error } = await supabase.from('bottle_participants').insert(row).select().single()
  if (error) throw error
  return data
}

// Upsert-by-hand: one story per (bottle, participant).
export async function saveStory(bottleId, participantId, body, existingId) {
  if (existingId) {
    const { error } = await supabase
      .from('bottle_stories')
      .update({ body, updated_at: new Date().toISOString() })
      .eq('id', existingId)
    if (error) throw error
  } else {
    const { error } = await supabase.from('bottle_stories').insert({ bottle_id: bottleId, participant_id: participantId, body })
    if (error) throw error
  }
}

export async function addSnap(bottleId, dataUrl, uploadedBy, caption) {
  const path = `${bottleId}/${crypto.randomUUID()}.jpg`
  const blob = await dataUrlToBlob(dataUrl)
  const { error: upErr } = await supabase.storage.from('bottle-snaps').upload(path, blob, { contentType: 'image/jpeg' })
  if (upErr) throw upErr
  const { data: pub } = supabase.storage.from('bottle-snaps').getPublicUrl(path)
  const { error } = await supabase
    .from('bottle_snaps')
    .insert({ bottle_id: bottleId, uploaded_by: uploadedBy, storage_path: pub.publicUrl, caption: caption || null })
  if (error) throw error
}

export async function uploadPhoto(dataUrl, ownerId) {
  const path = `${ownerId}/${crypto.randomUUID()}.jpg`
  const blob = await dataUrlToBlob(dataUrl)
  const { error } = await supabase.storage.from('bottle-photos').upload(path, blob, { contentType: 'image/jpeg' })
  if (error) throw error
  const { data: pub } = supabase.storage.from('bottle-photos').getPublicUrl(path)
  return pub.publicUrl
}

export async function createShareLink(bottleId, createdBy, canComment) {
  const { data, error } = await supabase
    .from('share_links')
    .insert({ bottle_id: bottleId, created_by: createdBy, can_comment: !!canComment })
    .select()
    .single()
  if (error) throw error
  return data
}
