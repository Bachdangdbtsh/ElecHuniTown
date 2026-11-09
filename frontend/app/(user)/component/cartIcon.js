"use client";
import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

import Link from "next/link";
import { IoCartOutline } from "react-icons/io5";

function subscribeToCart(callback) {
  window.addEventListener("cartUpdated", callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener("cartUpdated", callback);
    window.removeEventListener("storage", callback);
  };
}

function getLocalCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  return Array.isArray(cart) ? cart.length : 0;
}

export default function CartIcon({ cart,isLogin }) {
  const router = useRouter();
  const localCartCount = useSyncExternalStore(subscribeToCart, getLocalCartCount, () => 0);
  const cartCount = isLogin ? cart?.items?.length ?? 0 : localCartCount;

  useEffect(() => {
    const handleCartUpdated = () => {
      router.refresh();
    };

    window.addEventListener("cartUpdated", handleCartUpdated);

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdated);
    };
  }, [router]);

  return (
    <Link className="cart" href="/cart">
      <IoCartOutline size="24px" />
      <div>{cartCount}</div>
    </Link>
  );
}