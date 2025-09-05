import { api } from './api';

export async function fetchWishlist() {
  const { data } = await api.get('/wishlists');
  // คืน array ของ property.id
  const ids = new Set((data?.items || []).map(i => i.id));
  return { items: data?.items || [], ids };
}

export async function addToWishlist(id) {
  await api.post(`/wishlists/${id}`);
}

export async function removeFromWishlist(id) {
  await api.delete(`/wishlists/${id}`);
}

export async function toggleWishlist(id, wished) {
  if (wished) {
    await removeFromWishlist(id);
  } else {
    await addToWishlist(id);
  }
}
