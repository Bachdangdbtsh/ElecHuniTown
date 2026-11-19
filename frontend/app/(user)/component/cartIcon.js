"use client";

import Link from "next/link";
import { IoCartOutline } from "react-icons/io5";
import CartCount from "./CartCount";

export default function CartIcon() {
  return <Link className="cart" href="/cart" aria-label="Giỏ hàng"><IoCartOutline size="24px" /><CartCount /></Link>;
}
