'use client';

export default function AsyncSection({ state, isEmpty, emptyText, minHeight = 160, children }) {
  const { status, data, error, reload } = state;

  if (status === 'error') {
    return (
      <div className="adm-state adm-state-error" role="alert" style={{ minHeight }}>
        <p>{error.message}</p>
        <button type="button" className="adm-btn" style={{ width: 'auto', padding: '6px 16px', marginTop: 8 }} onClick={reload}>
          Thử lại
        </button>
      </div>
    );
  }
  if (!data) {
    return <div className="adm-skeleton" style={{ minHeight }} aria-busy="true" aria-label="Đang tải dữ liệu" />;
  }
  if (isEmpty?.(data)) {
    return (
      <div className="adm-state" style={{ minHeight }}>
        <p>{emptyText}</p>
      </div>
    );
  }
  return (
    <div className={status === 'loading' ? 'adm-refreshing' : undefined} aria-busy={status === 'loading'}>
      {children(data)}
    </div>
  );
}