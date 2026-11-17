import { toast } from "sonner";
export function addCart(product, quantity) {
  if (!product) return;
  let cart = JSON.parse(localStorage.getItem("cart") || "[]");
  fetch(`${(process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_URL)}/cart/add`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      productID: product.id,
      quantity: quantity,
      currentCart: cart
    })
  })
    .then(res => res.json())
    .then(data => {

      if (data.code == "success") {
        toast.success(data.message);
        if(data.currentCart)
          localStorage.setItem("cart", JSON.stringify(data.currentCart));
        window.dispatchEvent(new Event("cartUpdated"));
      }
    })
}

export function removeCart(productID) {
  if (!productID) return;
  let cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const index = cart.findIndex(i => i.id == productID);
  if (index != -1) {
    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart || []));
  }
  return cart;
}