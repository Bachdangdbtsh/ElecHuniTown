import PaymentDetail from "../../payment/[id]/paymentDetail";

export default async function OrderDetailPage({ params }) {
  const { id } = await params;
  return <PaymentDetail id={id} />;
}
