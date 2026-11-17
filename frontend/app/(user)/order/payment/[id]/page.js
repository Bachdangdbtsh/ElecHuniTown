
import PaymentDetail from "./paymentDetail";
export const metadata = {
  title: "Trang thanh toán đơn hàng",
};
export default async function OrderDetail({params}) {
  const {id}=await params;
  return (
    <PaymentDetail id={id}></PaymentDetail>
  )
}