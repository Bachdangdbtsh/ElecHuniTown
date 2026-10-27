'use client';

// Khung dùng chung cho mỗi khối dữ liệu: đang tải / lỗi (có nút thử lại) / trống / có dữ liệu.
// Mỗi khối tự xử lý trạng thái của mình nên một API lỗi không làm hỏng cả trang.
export default function AsyncSection({ state, isEmpty, emptyText, minHeight = 160, children }) {
  const { status, data, error, reload } = state;

  if (status === 'error') {
    return (
      <div className="st-state st-state-error" role="alert" style={{ minHeight }}>
        <p>{error.message}</p>
        <button type="button" className="st-btn" onClick={reload}>
          Thử lại
        </button>
      </div>
    );
  }
  if (!data) {
    return <div className="st-skeleton" style={{ minHeight }} aria-busy="true" aria-label="Đang tải dữ liệu" />;
  }
  if (isEmpty?.(data)) {
    return (
      <div className="st-state" style={{ minHeight }}>
        <p>{emptyText}</p>
      </div>
    );
  }
  return (
    <div className={status === 'loading' ? 'st-refreshing' : undefined} aria-busy={status === 'loading'}>
      {children(data)}
    </div>
  );
}
