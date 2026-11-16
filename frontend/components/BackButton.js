'use client';

import { useRouter } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';

export default function BackButton() {
  const router = useRouter();

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push('/');
  }

  return (
    <button type="button" className="global-back-button" onClick={goBack} aria-label="Quay lại trang trước">
      <FiArrowLeft aria-hidden="true" />
      <span>Quay lại</span>
    </button>
  );
}
