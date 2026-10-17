'use client';
import { useEffect, useState } from 'react';

export default function Home() {
  const [status, setStatus] = useState('đang kiểm tra...');

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setStatus(d.status))
      .catch(() => setStatus('KHÔNG kết nối được backend'));
  }, []);

  return <main style={{ padding: 24 }}>Backend: {status}</main>;
}