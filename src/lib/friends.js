import { supabase } from './supabaseClient'

export async function searchProfiles(query, myId) {
  if (!query.trim()) return []
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .neq('id', myId)
    .limit(10)
  if (error) throw error
  return data
}

// Friend rows involving me, with the "other person"'s profile attached.
export async function listFriendships(myId) {
  const { data, error } = await supabase
    .from('friendships')
    .select('*, requester:requester_id(*), addressee:addressee_id(*)')
    .or(`requester_id.eq.${myId},addressee_id.eq.${myId}`)
  if (error) throw error
  return (data || []).map((f) => ({
    ...f,
    other: f.requester_id === myId ? f.addressee : f.requester,
    iAmRequester: f.requester_id === myId,
  }))
}

export async function sendFriendRequest(myId, otherId) {
  const { error } = await supabase.from('friendships').insert({ requester_id: myId, addressee_id: otherId })
  if (error) throw error
}

export async function respondToRequest(friendshipId, status) {
  const { error } = await supabase.from('friendships').update({ status }).eq('id', friendshipId)
  if (error) throw error
}

export async function removeFriendship(friendshipId) {
  const { error } = await supabase.from('friendships').delete().eq('id', friendshipId)
  if (error) throw error
}
