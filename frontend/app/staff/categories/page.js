'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from '@/lib/api';

const EMPTY_FORM = {
  name: '',
  description: '',
  parentID: '',
  imageUrl: '',
};

/* Các ô thống kê phía trên bảng */
function CategoryStats({ summary }) {
  const stats = [
    { label: 'Tổng danh mục', value: summary.totalCategories },
    { label: 'Đang hiển thị', value: summary.activeCategories },
    { label: 'Tổng sản phẩm', value: summary.totalProducts },
  ];

  return (
    <div className="staff-cards">
      {stats.map((stat) => (
        <div className="staff-card" key={stat.label}>
          <span>{stat.label}</span>
          <strong>{stat.value}</strong>
        </div>
      ))}
    </div>
  );
}

/* Bảng danh mục; các thao tác được truyền vào qua props */
function CategoryTable({
  categories,
  onEdit,
  onToggle,
  onDelete,
}) {
  function getParentName(category) {
    const parent = categories.find(
      (item) => item.id === category.parentID,
    );

    return parent?.name ?? '—';
  }

  return (
    <div className="staff-table-wrap">
      <table className="staff-table">
        <thead>
          <tr>
            <th>Danh mục</th>
            <th>Danh mục cha</th>
            <th>Số sản phẩm</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>

        <tbody>
          {categories.map((category) => (
            <tr key={category.id}>
              <td>
                <strong>{category.name}</strong>
                <br />
                <small>{category.slug}</small>
              </td>

              <td>{category.parentName || '—'}</td>

              <td>{category._count?.products ?? 0}</td>

              <td>
                <span
                  className={
                    'staff-badge ' +
                    (category.isActive ? 'green' : 'red')
                  }
                >
                  {category.isActive
                    ? 'Đang hiển thị'
                    : 'Đang ẩn'}
                </span>
              </td>

              <td>
                <div className="staff-actions">
                  <button
                    type="button"
                    className="staff-button secondary"
                    onClick={() => onEdit(category)}
                  >
                    Sửa
                  </button>

                  <button
                    type="button"
                    className="staff-button secondary"
                    onClick={() => onToggle(category)}
                  >
                    {category.isActive ? 'Ẩn' : 'Hiện'}
                  </button>

                  <button
                    type="button"
                    className="staff-button danger"
                    onClick={() => onDelete(category)}
                  >
                    Xóa
                  </button>
                </div>
              </td>
            </tr>
          ))}

          {categories.length === 0 && (
            <tr>
              <td colSpan="5" className="staff-empty">
                Chưa có danh mục
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* Modal thêm/sửa; không tự gọi API */
function CategoryFormModal({
  categories,
  editingCategory,
  form,
  error,
  busy,
  onChange,
  onSubmit,
  onCancel,
}) {
  const parentOptions = categories.filter(
    (category) => category.id !== editingCategory?.id,
  );

  return (
    <div
      className="staff-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      <form className="staff-modal" onSubmit={onSubmit}>
        <h2>
          {editingCategory ? 'Sửa danh mục' : 'Thêm danh mục'}
        </h2>

        {error && <p className="staff-error">{error}</p>}

        <div className="staff-form-grid">
          <div className="staff-field full">
            <label htmlFor="category-name">Tên danh mục *</label>
            <input
              id="category-name"
              required
              value={form.name}
              onChange={(event) =>
                onChange('name', event.target.value)
              }
            />
          </div>

          <div className="staff-field full">
            <label htmlFor="category-parent">Danh mục cha</label>
            <select
              id="category-parent"
              value={form.parentID}
              onChange={(event) =>
                onChange('parentID', event.target.value)
              }
            >
              <option value="">Không có (danh mục gốc)</option>

              {parentOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="staff-field full">
            <label htmlFor="category-description">Mô tả</label>
            <textarea
              id="category-description"
              rows="3"
              value={form.description}
              onChange={(event) =>
                onChange('description', event.target.value)
              }
            />
          </div>

          <div className="staff-field full">
            <label htmlFor="category-image">URL ảnh (tùy chọn)</label>
            <input
              id="category-image"
              value={form.imageUrl}
              onChange={(event) =>
                onChange('imageUrl', event.target.value)
              }
            />
          </div>
        </div>

        <div className="staff-modal-actions">
          <button
            type="button"
            className="staff-button secondary"
            onClick={onCancel}
          >
            Hủy
          </button>

          <button className="staff-button" disabled={busy}>
            {busy ? 'Đang lưu…' : 'Lưu danh mục'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* Page quản lý state và gọi API */
export default function StaffCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [categoryStats, setCategoryStats] = useState({
    totalCategories: 0,
    activeCategories: 0,
    totalProducts: 0,
  });

  const loadCategories = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        search: query,
        ...(statusFilter? { isActive: statusFilter === 'ACTIVE' ? 'true' : 'false' }: {}),
      });

      const result = await apiGet(`/staff/categories?${params}`);

      setCategories(result.items);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      setCategoryStats(result.stats);
      setError('');

      if (result.page !== page) {
        setPage(result.page);
      }
    } catch (requestError) {
      setError(requestError.message);
    }
  }, [page, pageSize, query, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(loadCategories, 300);
    return () => clearTimeout(timer);
  }, [loadCategories]);

  function openCreateForm() {
    setEditingCategory(null);
    setForm({ ...EMPTY_FORM });
    setError('');
    setIsFormOpen(true);
  }

  function openEditForm(category) {
    setEditingCategory(category);
    setForm({
      name: category.name ?? '',
      description: category.description ?? '',
      parentID: category.parentID ?? '',
      imageUrl: category.imageUrl ?? '',
    });
    setError('');
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingCategory(null);
    setForm({ ...EMPTY_FORM });
    setError('');
  }

  function updateFormField(fieldName, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [fieldName]: value,
    }));
  }

  async function saveCategory(event) {
    event.preventDefault();
    setBusy(true);
    setError('');

    const payload = {
      ...form,
      parentID:
        form.parentID === '' ? null : Number(form.parentID),
    };

    try {
      if (editingCategory) {
        await apiPatch(
          `/staff/categories/${editingCategory.id}`,
          payload,
        );
      } else {
        await apiPost('/staff/categories', payload);
      }

      closeForm();
      await loadCategories();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleCategory(category) {
    setError('');

    try {
      await apiPatch(
        `/staff/categories/${category.id}/status`,
        { isActive: !category.isActive },
      );
      await loadCategories();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function deleteCategory(category) {
    const confirmed = window.confirm(
      `Xóa danh mục “${category.name}”?`,
    );

    if (!confirmed) return;

    setError('');

    try {
      await apiDelete(`/staff/categories/${category.id}`);
      await loadCategories();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <section className="staff-page">
      <header className="staff-page-head">
        <div>
          <h1>Quản lý danh mục</h1>
          <p className="staff-subtitle">
            Tạo và sắp xếp danh mục sản phẩm
          </p>
        </div>

        <button
          type="button"
          className="staff-button"
          onClick={openCreateForm}
        >
          ＋ Thêm danh mục
        </button>
      </header>

      <div className="staff-toolbar">
        <input
          className="staff-input"
          placeholder="Tìm tên danh mục"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
        />
        <select
          className="staff-select"
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setPage(1);
          }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang hiển thị</option>
          <option value="HIDDEN">Đang ẩn</option>
        </select>
        <select
          className="staff-select"
          value={pageSize}
          onChange={(event) => {
            setPageSize(Number(event.target.value));
            setPage(1);
          }}
        >
          {[5, 10, 20, 50].map((size) => (
            <option key={size} value={size}>
              {size} dòng / trang
            </option>
          ))}
        </select>
      </div>

      <CategoryStats summary={categoryStats} />

      {error && !isFormOpen && (
        <div className="staff-error">{error}</div>
      )}

      <CategoryTable
        categories={categories}
        onEdit={openEditForm}
        onToggle={toggleCategory}
        onDelete={deleteCategory}
      />

      <div className="staff-pagination">
        <span className="staff-pagination-info">
          Tổng {total} danh mục · Trang {page} / {totalPages}
        </span>

        <div className="staff-pagination-buttons">
          <button
            type="button"
            className="staff-button secondary"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            Trước
          </button>

          <button
            type="button"
            className="staff-button secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Sau
          </button>
        </div>
      </div>

      {isFormOpen && (
        <CategoryFormModal
          categories={categories}
          editingCategory={editingCategory}
          form={form}
          error={error}
          busy={busy}
          onChange={updateFormField}
          onSubmit={saveCategory}
          onCancel={closeForm}
        />
      )}
    </section>
  );
}
