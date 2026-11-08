"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import Link from "next/link";
import { IoCartOutline } from "react-icons/io5";

export default function CartIcon({ cart,isLogin }) {
  const [cartCount, setCartCount] = useState(0);
  const router = useRouter();

  const updateCount = () => {
    if (isLogin) {
      setCartCount(cart.items.length);
    } else {
      const localCart = JSON.parse(localStorage.getItem("cart") || "[]");
      setCartCount(localCart.length);
    }
  };

  useEffect(() => {
    const wasLoggedIn = localStorage.getItem("isLoggedIn") === "true";

    if (!isLogin && wasLoggedIn) {
      localStorage.removeItem("cart");      // Xóa giỏ hàng
      localStorage.removeItem("isLoggedIn"); // Xóa cờ
      setCartCount(0);                      // Reset số lượng về 0
    } else {
      updateCount();
    }

    const handleCartUpdated = () => {
      updateCount(); 
      router.refresh(); 
    };

    window.addEventListener("cartUpdated", handleCartUpdated);

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdated);
    };
  }, [isLogin, cart]);

  return (
    <Link className="cart" href="/cart">
      <IoCartOutline size="24px" />
      <div>{cartCount}</div>
    </Link>
  );
}