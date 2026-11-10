
import PaymentDetail from "./paymentDetail";
export const instant = false;
export default async function OrderDetail({params}) {
  const {id}=await params;
  return (
    <PaymentDetail id={id}></PaymentDetail>
  )
}
