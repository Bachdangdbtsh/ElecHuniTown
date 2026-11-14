'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CiHeart } from 'react-icons/ci';
import { IoCartOutline } from 'react-icons/io5';
import { FiSearch } from 'react-icons/fi';
import CartCount from './CartCount';

export default function ShopHeader() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/backend/auth/me', { credentials: 'include', signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((result) => setCustomer(result?.data?.role === 'CUSTOMER' ? result.data : null))
      .catch(() => {});
    return () => controller.abort();
  }, []);

  function handleSearch(event) {
    event.preventDefault();
    const term = query.trim();
    if (term) router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  return (
    <div className="header">
      <div className="container">
        <Link href="/" className="logo">
          <Image src="/Container.svg" alt="" width={36} height={36} />
          <div className="brand">ElecHuniTown</div>
        </Link>
        <form className="search" role="search" onSubmit={handleSearch}>
          <input type="search" aria-label="Tìm sản phẩm, danh mục" placeholder="Tìm sản phẩm, danh mục" value={query} onChange={(event) => setQuery(event.target.value)} />
          <button type="submit" aria-label="Tìm kiếm"><FiSearch size={20} /></button>
        </form>
        <div className="small-icon">
          <CiHeart size="24px" />
          <Link className="cart" href="/cart" aria-label="Giỏ hàng"><IoCartOutline size="24px" /><CartCount /></Link>
          {customer ? (
            <Link href="/account/overview" className="customer-avatar" aria-label={`Tài khoản của ${customer.fullName}`} title={customer.fullName}>
              <Image src="/default-avatar.svg" alt="" width={38} height={38} />
            </Link>
          ) : (
            <>
              <Link href="/login" className="login">Đăng nhập</Link>
              <Link href="/register" className="register">Đăng ký</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
