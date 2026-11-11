'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiPut,
} from '@/lib/api';

const EMPTY_FORM = {
  productName: '',
  categoryId: '',
  oldPrice: '',
  newPrice: '',
  stock: '',
  description: '',
  imageUrl: '',
  tagsText: '',
  isFeature: false,
  status: 'ACTIVE',
};

const money = (value) =>
  Number(value || 0).toLocaleString('vi-VN') + ' ₫';

/* Chỉ phụ trách form thêm/sửa sản phẩm */
function ProductFormModal({ product, categories, onClose, onSave }) {
  const [form, setForm] = useState(
    product
      ? {
          productName: product.productName,
          categoryId: String(product.categoryId),
          oldPrice: String(product.oldPrice),
          newPrice: String(product.newPrice),
          stock: String(product.stock),
          description: product.description || '',
          imageUrl: product.pictures?.[0]?.url || '',
          tagsText: product.tags?.map((tag) => tag.tag).join(', ') || '',
          isFeature: product.isFeature,
          status: product.status,
        }
      : {
          ...EMPTY_FORM,
          categoryId: categories[0] ? String(categories[0].id) : '',
        },
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function changeField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');

    const payload = {
      productName: form.productName,
      categoryId: Number(form.categoryId),
      oldPrice: Number(form.oldPrice),
      newPrice: Number(form.newPrice),
      stock: Number(form.stock),
      description: form.description,
      imageUrl: form.imageUrl,
      tags: form.tagsText
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      isFeature: form.isFeature,
      status: form.status,
    };

    try {
      await onSave(payload);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="staff-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form className="staff-modal" onSubmit={submit}>
        <h2>{product ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm'}</h2>

        {error && <div className="staff-error">{error}</div>}

        <div className="staff-form-grid">
          <div className="staff-field full">
            <label>Tên sản phẩm *</label>
            <input
              required
              value={form.productName}
              onChange={(event) =>
                changeField('productName', event.target.value)
              }
            />
          </div>

          <div className="staff-field">
            <label>Danh mục *</label>
            <select
              required
              value={form.categoryId}
              onChange={(event) =>
                changeField('categoryId', event.target.value)
              }
            >
              <option value="">Chọn danh mục</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="staff-field">
            <label>Trạng thái</label>
            <select
              value={form.status}
              onChange={(event) =>
                changeField('status', event.target.value)
              }
            >
              <option value="ACTIVE">Đang hiển thị</option>
              <option value="HIDDEN">Đang ẩn</option>
            </select>
          </div>

          <div className="staff-field">
            <label>Giá cũ (₫) *</label>
            <input
              type="number"
              min="0"
              value={form.oldPrice}
              onChange={(event) =>
                changeField('oldPrice', event.target.value)
              }
            />
          </div>

          <div className="staff-field">
            <label>Giá bán (₫) *</label>
            <input
              required
              type="number"
              min="0"
              value={form.newPrice}
              onChange={(event) =>
                changeField('newPrice', event.target.value)
              }
            />
          </div>

          <div className="staff-field">
            <label>Tồn kho *</label>
            <input
              required
              type="number"
              min="0"
              value={form.stock}
              onChange={(event) =>
                changeField('stock', event.target.value)
              }
            />
          </div>

          <div className="staff-field">
            <label>Ảnh sản phẩm (URL)</label>
            <input
              value={form.imageUrl}
              onChange={(event) =>
                changeField('imageUrl', event.target.value)
              }
            />
          </div>

          <div className="staff-field full">
            <label>Nhãn (phân cách bằng dấu phẩy)</label>
            <input
              value={form.tagsText}
              placeholder="Tiết kiệm điện, Bán chạy"
              onChange={(event) =>
                changeField('tagsText', event.target.value)
              }
            />
          </div>

          <div className="staff-field full">
            <label>Mô tả</label>
            <textarea
              rows="4"
              value={form.description}
              onChange={(event) =>
                changeField('description', event.target.value)
              }
            />
          </div>

          <label className="staff-featured-toggle">
            <input
              type="checkbox"
              checked={form.isFeature}
              onChange={(event) =>
                changeField('isFeature', event.target.checked)
              }
            />
            <span>Sản phẩm nổi bật</span>
          </label>
        </div>

        <div className="staff-modal-actions">
          <button
            type="button"
            className="staff-button secondary"
            onClick={onClose}
          >
            Hủy
          </button>
          <button className="staff-button" disabled={busy}>
            {busy ? 'Đang lưu…' : 'Lưu sản phẩm'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* Page tải dữ liệu, lọc bảng và gọi API */
export default function StaffProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        search: query,
        ...(statusFilter ? { status: statusFilter } : {}),
      });

      const productResult = await apiGet(`/staff/products?${params}`);

      setProducts(productResult.items);
      setTotal(productResult.total);
      setTotalPages(productResult.totalPages);
      setError('');

      if (productResult.page !== page) {
        setPage(productResult.page);
      }
    } catch (loadError) {
      setError(loadError.message);
    }
  }, [page, pageSize, query, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const firstPage = await apiGet('/staff/categories?page=1&pageSize=50');
        const remainingPages = await Promise.all(
          Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
            apiGet(`/staff/categories?page=${index + 2}&pageSize=50`),
          ),
        );

        if (!cancelled) {
          setCategories([
            ...firstPage.items,
            ...remainingPages.flatMap((result) => result.items),
          ]);
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError.message);
      }
    }

    loadCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  function openForm(product = null) {
    setEditingProduct(product);
    setIsFormOpen(true);
  }

  function closeForm() {
    setEditingProduct(null);
    setIsFormOpen(false);
  }

  async function saveProduct(payload) {
    if (editingProduct) {
      await apiPut(`/staff/products/${editingProduct.id}`, payload);
    } else {
      await apiPost('/staff/products', payload);
    }

    closeForm();
    await load();
  }

  async function toggleProduct(product) {
    try {
      await apiPatch(`/staff/products/${product.id}/status`, {
        status: product.status === 'ACTIVE' ? 'HIDDEN' : 'ACTIVE',
      });
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function deleteProduct(product) {
    if (!window.confirm(`Xóa sản phẩm “${product.productName}”?`)) {
      return;
    }

    try {
      await apiDelete(`/staff/products/${product.id}`);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <section className="staff-page">
      <header className="staff-page-head">
        <div>
          <h1>Quản lý sản phẩm</h1>
          <p className="staff-subtitle">
            Cập nhật danh sách, giá bán và tồn kho
          </p>
        </div>
        <button
          type="button"
          className="staff-button"
          onClick={() => openForm()}
        >
          ＋ Thêm sản phẩm
        </button>
      </header>

      <div className="staff-toolbar">
        <input
          className="staff-input"
          placeholder="Tìm tên sản phẩm"
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

      {error && <div className="staff-error">{error}</div>}

      <div className="staff-table-wrap">
        <table className="staff-table">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Danh mục</th>
              <th>Giá bán</th>
              <th>Tồn kho</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  <div className="staff-product-cell">
                    {product.pictures?.[0]?.url ? (
                      <img src={product.pictures[0].url} alt="" />
                    ) : (
                      <span className="staff-badge">Ảnh</span>
                    )}
                    <div>
                      <strong>{product.productName}</strong>
                      <br />
                      <small>
                        #{product.id}
                        {product.isFeature ? ' · Nổi bật' : ''}
                      </small>
                    </div>
                  </div>
                </td>
                <td>{product.category?.name || '—'}</td>
                <td>
                  {money(product.newPrice)}
                  <br />
                  <small>Giá cũ {money(product.oldPrice)}</small>
                </td>
                <td>{product.stock}</td>
                <td>
                  <span
                    className={
                      'staff-badge ' +
                      (product.status === 'ACTIVE' ? 'green' : 'red')
                    }
                  >
                    {product.status === 'ACTIVE'
                      ? 'Đang hiển thị'
                      : 'Đang ẩn'}
                  </span>
                </td>
                <td>
                  <div className="staff-actions">
                    <button
                      type="button"
                      className="staff-button secondary"
                      onClick={() => openForm(product)}
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      className="staff-button secondary"
                      onClick={() => toggleProduct(product)}
                    >
                      {product.status === 'ACTIVE' ? 'Ẩn' : 'Hiện'}
                    </button>
                    <button
                      type="button"
                      className="staff-button danger"
                      onClick={() => deleteProduct(product)}
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {products.length === 0 && (
              <tr>
                <td colSpan="6" className="staff-empty">
                  {error
                    ? 'Không tải được sản phẩm'
                    : 'Chưa có sản phẩm phù hợp'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="staff-pagination">
        <span className="staff-pagination-info">
          Tổng {total} sản phẩm · Trang {page} / {totalPages}
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
        <ProductFormModal
          key={editingProduct?.id ?? 'new-product'}
          product={editingProduct}
          categories={categories}
          onClose={closeForm}
          onSave={saveProduct}
        />
      )}
    </section>
  );
}
