import { cookies } from 'next/headers';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_URL ||
  'http://localhost:4000';

/**
 * Server-side session check. Safe during prerender (cookies may reject).
 */
export default async function checkLogin() {
  try {
    let token;
    try {
      const cookieStore = await cookies();
      token = cookieStore.get('token')?.value;
    } catch {
      // Prerender / incomplete request — treat as guest
      return { account: null, cart: null, isLogin: false };
    }

    if (!token) {
      return { account: null, cart: null, isLogin: false };
    }

    const res = await fetch(`${API_BASE}/checkLogin`, {
      method: 'GET',
      headers: {
        Cookie: `token=${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return { account: null, cart: null, isLogin: false };
    }

    const data = await res.json();
    if (data.code !== 'success' || !data.account) {
      return { account: null, cart: null, isLogin: false };
    }

    return {
      account: data.account,
      cart: data.cart ?? null,
      isLogin: true,
    };
  } catch (error) {
    console.error('[checkLogin]', error.message);
    return { account: null, cart: null, isLogin: false };
  }
}
