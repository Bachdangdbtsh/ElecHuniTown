import { toast } from 'sonner';
import { loadCart, postShop, readCart, saveCart } from './cartStore';

export async function addCart(product, quantity) {
  const amount = Number(quantity);
  if (!product || !Number.isInteger(amount) || amount < 1 || amount > product.stock) {
    toast.error('Số lượng sản phẩm không hợp lệ');
    return;
  }
  try {
    await loadCart();
    const data = await postShop('/cart/add', {
      productID: product.id,
      quantity: amount,
      currentCart: readCart(),
    });
    if (data.currentCart) saveCart(data.currentCart);
    else await loadCart();
    toast.success(data.message);
  } catch (error) {
    toast.error(error.message);
  }
}

export async function removeCart(productId) {
  await postShop('/cart/remove', { productId: Number(productId) });
  return saveCart(readCart().filter((item) => Number(item.id) !== Number(productId)));
}

export async function updateCartQuantity(productId, quantity) {
  await postShop('/cart/update', { productId: Number(productId), quantity });
  return saveCart(readCart().map((item) => Number(item.id) === Number(productId)
    ? { ...item, quantity }
    : item));
}
