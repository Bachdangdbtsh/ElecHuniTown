import { cookies } from 'next/headers';

const API_BASE =
  process.env.INTERNAL_API_URL ||
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
      return { account: null };
    }

    if (!token) {
      return { account: null };
    }

    const res = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      headers: {
        Cookie: `token=${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return { account: null };
    }

    const data = await res.json();
    if (data.code !== 'success' || !data.data) {
      return { account: null };
    }

    return {
      account: data.data,
    };
  } catch (error) {
    console.error('[checkLogin]', error.message);
    return { account: null };
  }
}
