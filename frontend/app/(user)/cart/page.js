
import CustomerInfor from "./customerForm";
import Cart from "./cart"

export default function CartPage() {
 
  return (<>
    <div className="cart-page">
      <Cart></Cart>

      <div className="customer-infor">
        <div className="inner-title">Thông Tin Khách Hàng</div>
        <CustomerInfor/>

      </div>
    </div >

  </>)
}