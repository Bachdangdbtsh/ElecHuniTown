
import PaymentDetail from "./paymentDetail";
export default async function OrderDetail({params}) {
  const {id}=await params;
  return (
    <PaymentDetail id={id}></PaymentDetail>
  )
}
