const endpoint = '/api/backend';

export function readCart() {
  try {
    const value = JSON.parse(localStorage.getItem('cart') || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
  window.dispatchEvent(new Event('cart:changed'));
  return cart;
}

export async function postShop(path, body = {}) {
  const response = await fetch(`${endpoint}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || data?.code !== 'success') throw new Error(data?.message || 'Không thể xử lý yêu cầu');
  return data;
}

export async function loadCart() {
  const local = readCart();
  const me = await fetch(`${endpoint}/auth/me`, { credentials: 'include' });
  const user = me.ok ? (await me.json()).data : null;
  if (user?.role !== 'CUSTOMER') localStorage.removeItem('cartOwnerId');
  let data = await postShop('/cart/get', { currentCart: local });
  if (user?.role === 'CUSTOMER' && localStorage.getItem('cartOwnerId') !== String(user.id)) {
    const serverIds = new Set(data.currentCart.map((item) => Number(item.id)));
    for (const item of local) {
      if (!serverIds.has(Number(item.id))) {
        await postShop('/cart/add', { productID: item.id, quantity: Number(item.quantity), currentCart: [] });
      }
    }
    localStorage.setItem('cartOwnerId', String(user.id));
    data = await postShop('/cart/get', { currentCart: local });
  }
  const cart = data.currentCart.map((item) => ({
    ...item,
    selected: local.find((old) => Number(old.id) === Number(item.id))?.selected !== false,
  }));
  return saveCart(cart);
}
