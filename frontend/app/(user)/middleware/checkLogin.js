import { cookies } from 'next/headers';

export default async function checkLogin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return { account: null, cart: null, isLogin: false };
  }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/checklogin`, {
      method: "GET",
      headers: {
        'Cookie': `token=${token}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      return { account: null, cart: null, isLogin: false };
    }

    const data = await res.json();
    return { account: data.account, cart: data.cart, isLogin: true };

  } catch (error) {
    console.error("Lỗi gọi API checklogin:", error);
    return { account: null, cart: null, isLogin: false };
  }
}