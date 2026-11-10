
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { loadCart } from "../component/cartStore";
import CustomerInfor from "./customerForm";
import Cart from "./cart"

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadCart().then(setCart).catch((error) => toast.error(error.message)).finally(() => setLoading(false));
  }, []);
 
  return (<>
    <div className="cart-page">
      <Cart cart={cart} setCart={setCart} loading={loading} />

      <div className="customer-infor">
        <div className="inner-title">Thông Tin Khách Hàng</div>
        <CustomerInfor cart={cart} setCart={setCart} loading={loading} />

      </div>
    </div >

  </>)
}
