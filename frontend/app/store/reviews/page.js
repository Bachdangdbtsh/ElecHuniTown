'use client';

import { useEffect, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiMessageSquare, FiRefreshCw, FiSend, FiTrash2 } from 'react-icons/fi';
import { toast } from 'sonner';
import { apiDelete, apiGet, apiPatch } from '@/lib/api';
import './reviews.css';

const PAGE_SIZE = 8;

function Stars({ value = 0 }) {
  return (
    <span className="rv-stars" aria-label={`${value} trên 5 sao`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= value ? 'on' : ''}>★</span>
      ))}
    </span>
  );
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function StoreReviewsPage() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [answered, setAnswered] = useState('all');
  const [rating, setRating] = useState('all');
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (answered !== 'all') params.set('answered', answered);
    if (rating !== 'all') params.set('rating', rating);

    apiGet(`/comments?${params.toString()}`)
      .then((data) => {
        if (!active) return;
        setItems(data.items);
        setPagination(data.pagination);
        setError('');
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, answered, rating, reloadToken]);

  function reload() {
    setLoading(true);
    setReloadToken((token) => token + 1);
  }

  const setDraft = (id, value) => setDrafts((prev) => ({ ...prev, [id]: value }));

  async function handleReply(comment) {
    const content = (drafts[comment.id] ?? '').trim();
    if (!content) {
      toast.error('Vui lòng nhập nội dung phản hồi');
      return;
    }
    setSavingId(comment.id);
    try {
      const updated = await apiPatch(`/comments/${comment.id}/reply`, { content });
      setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setDraft(comment.id, '');
      toast.success('Đã gửi phản hồi');
      if (answered === 'false') reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingId(null);
    }
  }

  async function handleRemove(comment) {
    setSavingId(comment.id);
    try {
      const updated = await apiDelete(`/comments/${comment.id}/reply`);
      setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      toast.success('Đã thu hồi phản hồi');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingId(null);
    }
  }

  function changeFilter(setter) {
    return (event) => {
      setter(event.target.value);
      setPage(1);
      setLoading(true);
    };
  }

  function changePage(next) {
    setPage(next);
    setLoading(true);
  }

  return (
    <section className="rv-page">
      <header className="rv-head">
        <div>
          <h1>Quản lý Đánh giá</h1>
          <p>Phản hồi ý kiến khách hàng về sản phẩm (UC_38).</p>
        </div>
        <button type="button" className="rv-btn rv-btn-ghost" onClick={reload} disabled={loading}>
          <FiRefreshCw /> Làm mới
        </button>
      </header>

      <div className="rv-toolbar">
        <label>
          Trạng thái
          <select value={answered} onChange={changeFilter(setAnswered)}>
            <option value="all">Tất cả đánh giá</option>
            <option value="false">Chưa phản hồi</option>
            <option value="true">Đã phản hồi</option>
          </select>
        </label>
        <label>
          Số sao
          <select value={rating} onChange={changeFilter(setRating)}>
            <option value="all">Tất cả</option>
            {[5, 4, 3, 2, 1].map((star) => (
              <option key={star} value={star}>{star} sao</option>
            ))}
          </select>
        </label>
        {pagination && (
          <p className="rv-count">
            <FiMessageSquare /> {pagination.total} đánh giá
          </p>
        )}
      </div>

      {loading && <p className="rv-state">Đang tải đánh giá…</p>}
      {!loading && error && <p className="rv-state rv-error">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="rv-state">Không có đánh giá nào phù hợp bộ lọc.</p>
      )}

      {!loading && !error && items.length > 0 && (
        <ul className="rv-list">
          {items.map((comment) => (
            <li key={comment.id} className="rv-card">
              <div className="rv-card-head">
                <div>
                  <p className="rv-product">{comment.Product?.productName ?? 'Sản phẩm đã xoá'}</p>
                  <p className="rv-meta">
                    {comment.User?.fullName ?? 'Khách hàng'} · {formatDate(comment.createdAt)}
                  </p>
                </div>
                <Stars value={comment.rating ?? 0} />
              </div>

              <p className="rv-content">{comment.content}</p>

              {comment.reply ? (
                <div className="rv-reply">
                  <div className="rv-reply-head">
                    <span>
                      Phản hồi của {comment.RepliedBy?.fullName ?? 'cửa hàng'} · {formatDate(comment.repliedAt)}
                    </span>
                    <button
                      type="button"
                      className="rv-btn rv-btn-danger"
                      onClick={() => handleRemove(comment)}
                      disabled={savingId === comment.id}
                    >
                      <FiTrash2 /> Thu hồi
                    </button>
                  </div>
                  <p>{comment.reply}</p>
                </div>
              ) : (
                <p className="rv-pending">Chưa phản hồi</p>
              )}

              <div className="rv-form">
                <textarea
                  rows={2}
                  maxLength={1000}
                  placeholder={comment.reply ? 'Sửa nội dung phản hồi…' : 'Nhập phản hồi cho khách hàng…'}
                  value={drafts[comment.id] ?? ''}
                  onChange={(event) => setDraft(comment.id, event.target.value)}
                />
                <button
                  type="button"
                  className="rv-btn rv-btn-primary"
                  onClick={() => handleReply(comment)}
                  disabled={savingId === comment.id}
                >
                  <FiSend /> {savingId === comment.id ? 'Đang gửi…' : comment.reply ? 'Cập nhật' : 'Gửi phản hồi'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="rv-pager">
          <button type="button" className="rv-btn rv-btn-ghost" onClick={() => changePage(page - 1)} disabled={page <= 1}>
            <FiChevronLeft /> Trước
          </button>
          <span>Trang {pagination.page} / {pagination.totalPages}</span>
          <button
            type="button"
            className="rv-btn rv-btn-ghost"
            onClick={() => changePage(page + 1)}
            disabled={page >= pagination.totalPages}
          >
            Sau <FiChevronRight />
          </button>
        </div>
      )}
    </section>
  );
}
