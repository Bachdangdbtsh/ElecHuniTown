export const dynamic = 'force-dynamic';


import CustomerInfor from "./customerForm";
import Cart from "./cart"
import checkLogin from "../middleware/checkLogin";
export const metadata = {
  title: "Trang giỏ hàng",
};
export default async function CartPage() {
  const { account, cart,isLogin } = await checkLogin();
  return (<>
    <div className="cart-page">
      <Cart cart={cart} isLogin={isLogin} ></Cart>

      <div className="customer-infor">
        <div className="inner-title">Thông Tin Khách Hàng</div>
        <CustomerInfor recipientInfos={account?.recipientInfos || []} isLogin={isLogin}/>

      </div>
    </div >

  </>)
}