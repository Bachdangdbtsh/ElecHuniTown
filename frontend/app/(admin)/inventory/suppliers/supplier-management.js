'use client';

import { useEffect, useState } from 'react';
import {
  FiBriefcase,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiCreditCard,
  FiEye,
  FiFilter,
  FiLock,
  FiMail,
  FiMapPin,
  FiEdit2,
  FiPhone,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiUser,
  FiX,
} from 'react-icons/fi';
import { toast } from 'sonner';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';

const pageSize = 4;
const searchOptions = [
  { value: 'all', label: 'Tất cả thông tin' },
  { value: 'name', label: 'Tên doanh nghiệp' },
  { value: 'businessRegistNum', label: 'Mã doanh nghiệp' },
  { value: 'phoneNumber', label: 'Số điện thoại' },
];
const maxLengthByField = {
  name: 150,
  businessRegistNum: 50,
  address: 500,
  phoneNumber: 30,
  email: 254,
  contactPerson: 150,
  bankNumber: 50,
  bankName: 50,
};

const fields = [
  { name: 'name', label: 'Tên nhà cung cấp', placeholder: 'Nhập tên doanh nghiệp hoặc nhà phân phối', icon: FiBriefcase },
  { name: 'businessRegistNum', label: 'Mã doanh nghiệp', placeholder: 'Ví dụ: MP-2026-109', icon: FiSearch },
  { name: 'address', label: 'Địa chỉ', placeholder: 'Nhập địa chỉ trụ sở', icon: FiMapPin },
  { name: 'phoneNumber', label: 'Số điện thoại liên hệ', placeholder: 'Nhập số điện thoại', icon: FiPhone },
  { name: 'email', label: 'Email liên hệ', placeholder: 'ten@doanhnghiep.vn', icon: FiMail },
  { name: 'contactPerson', label: 'Họ và tên người đại diện', placeholder: 'Nhập họ và tên đầy đủ', icon: FiUser },
  { name: 'bankNumber', label: 'Số tài khoản ngân hàng', placeholder: 'Nhập số tài khoản', icon: FiCreditCard },
  { name: 'bankName', label: 'Tên viết tắt ngân hàng', placeholder: 'Ví dụ: VCB', icon: FiBriefcase },
];

function initials(name) {
  return (name || 'NCC')
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export default function SupplierManagement() {
  const [suppliers, setSuppliers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [searchBy, setSearchBy] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [dialog, setDialog] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchText.trim());
      setPage(1);
      setLoading(true);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), searchBy });
    if (search) params.set('search', search);

    apiGet(`/suppliers?${params}`, controller.signal)
      .then((result) => {
        setSuppliers(result.items || []);
        setTotal(result.total || 0);
        setPageError('');
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setPageError(error.message || 'Không thể tải danh sách nhà cung cấp.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [page, refreshKey, search, searchBy]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  function handleSaved() {
    setDialog(null);
    setSearchText('');
    setSearch('');
    setPage(1);
    setLoading(true);
    setRefreshKey((current) => current + 1);
  }

  async function confirmDelete() {
    if (!dialog?.supplier) return;
    setDeleting(true);
    try {
      await apiDelete(`/suppliers/${dialog.supplier.id}`);
      toast.success('Xoá nhà cung cấp thành công');
      setDialog(null);
      setLoading(true);
      if (suppliers.length === 1 && page > 1) setPage((current) => current - 1);
      else setRefreshKey((current) => current + 1);
    } catch (error) {
      toast.error(error.message || 'Không thể xoá nhà cung cấp.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="supplier-page">
      <header className="supplier-heading">
        <div>
          <h1>Quản lý Nhà cung cấp</h1>
          <p>Quản lý thông tin và liên hệ của các đối tác cung ứng.</p>
        </div>
        <button type="button" className="supplier-primary-button" onClick={() => setDialog({ mode: 'create' })}>
          <FiPlus aria-hidden="true" />
          Thêm nhà cung cấp
        </button>
      </header>

      <div className="supplier-toolbar">
        <label className="supplier-search">
          <FiSearch aria-hidden="true" />
          <input
            type="search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Tìm theo tên, mã doanh nghiệp, số điện thoại..."
            aria-label="Tìm nhà cung cấp"
          />
          {searchText && (
            <button type="button" onClick={() => setSearchText('')} aria-label="Xóa từ khóa tìm kiếm">
              <FiX aria-hidden="true" />
            </button>
          )}
        </label>
        <div className="supplier-filter-wrap">
          <button
            type="button"
            className={`supplier-filter-button ${filterOpen ? 'is-open' : ''}`}
            onClick={() => setFilterOpen((open) => !open)}
            aria-expanded={filterOpen}
          >
            <FiFilter aria-hidden="true" />
            Bộ lọc
          </button>
          {filterOpen && (
            <label className="supplier-filter-menu">
              <span>Tìm kiếm theo</span>
              <select value={searchBy} onChange={(event) => { setLoading(true); setSearchBy(event.target.value); setPage(1); }}>
                {searchOptions.map((option) => (
                  <option value={option.value} key={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          )}
        </div>
      </div>

      {pageError && (
        <div className="supplier-error" role="alert">
          <span>{pageError}</span>
          <button type="button" onClick={() => { setLoading(true); setRefreshKey((current) => current + 1); }}>Thử lại</button>
        </div>
      )}

      <section className="supplier-table-card" aria-label="Danh sách nhà cung cấp">
        <div className="supplier-table-scroll">
          <table className="supplier-table">
            <thead>
              <tr>
                <th scope="col">Tên doanh nghiệp</th>
                <th scope="col">Mã doanh nghiệp</th>
                <th scope="col">Số điện thoại liên hệ</th>
                <th scope="col">Email liên hệ</th>
                <th scope="col"><span className="supplier-sr-only">Thao tác</span></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="supplier-table-state" colSpan={5}>Đang tải nhà cung cấp…</td></tr>
              ) : suppliers.length ? suppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td>
                    <div className="supplier-company">
                      <span className="supplier-avatar">{initials(supplier.name)}</span>
                      <span>
                        <strong>{supplier.name}</strong>
                        <small>Đang hợp tác</small>
                      </span>
                    </div>
                  </td>
                  <td><strong className="supplier-code">{supplier.businessRegistNum}</strong></td>
                  <td>{supplier.phoneNumber}</td>
                  <td><a className="supplier-email" href={`mailto:${supplier.email}`}>{supplier.email}</a></td>
                  <td>
                    <div className="supplier-row-actions">
                      <button type="button" title="Xem thông tin" aria-label={`Xem ${supplier.name}`} onClick={() => setDialog({ mode: 'view', supplier })}>
                        <FiEye aria-hidden="true" />
                      </button>
                      <button type="button" title="Sửa thông tin" aria-label={`Sửa ${supplier.name}`} onClick={() => setDialog({ mode: 'edit', supplier })}>
                        <FiEdit2 aria-hidden="true" />
                      </button>
                      <button type="button" className="is-danger" title="Xóa nhà cung cấp" aria-label={`Xóa ${supplier.name}`} onClick={() => setDialog({ mode: 'delete', supplier })}>
                        <FiTrash2 aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td className="supplier-table-state" colSpan={5}>
                    {search ? 'Không tìm thấy nhà cung cấp phù hợp.' : 'Chưa có nhà cung cấp đang hợp tác.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <footer className="supplier-table-footer">
          <span>Hiển thị {rangeStart}–{rangeEnd} trong tổng số {total} nhà cung cấp</span>
          <nav className="supplier-pagination" aria-label="Phân trang nhà cung cấp">
            <button type="button" disabled={page <= 1 || loading} onClick={() => { setLoading(true); setPage((current) => current - 1); }} aria-label="Trang trước">
              <FiChevronLeft aria-hidden="true" />
            </button>
            <span aria-current="page">{page}</span>
            <button type="button" disabled={page >= pageCount || loading} onClick={() => { setLoading(true); setPage((current) => current + 1); }} aria-label="Trang sau">
              <FiChevronRight aria-hidden="true" />
            </button>
          </nav>
        </footer>
      </section>

      <div className="supplier-sync-note">
        <FiCheck aria-hidden="true" />
        <span>Dữ liệu nhà cung cấp được đồng bộ theo thời gian thực.</span>
      </div>

      {dialog?.mode === 'delete' && (
        <div className="supplier-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget && !deleting) setDialog(null); }}>
          <section className="supplier-delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="supplier-delete-title" aria-describedby="supplier-delete-description">
            <button type="button" className="supplier-modal-close" onClick={() => setDialog(null)} aria-label="Đóng" disabled={deleting}><FiX /></button>
            <span className="supplier-delete-icon"><FiTrash2 aria-hidden="true" /></span>
            <h2 id="supplier-delete-title">Xoá nhà cung cấp?</h2>
            <p id="supplier-delete-description">
              Bạn có chắc chắn muốn xoá nhà cung cấp: <strong>{dialog.supplier.name}</strong> này?
            </p>
            <div className="supplier-delete-actions">
              <button type="button" className="supplier-secondary-button" onClick={() => setDialog(null)} disabled={deleting}>Quay lại</button>
              <button type="button" className="supplier-danger-button" onClick={confirmDelete} disabled={deleting}>
                <FiTrash2 aria-hidden="true" /> {deleting ? 'Đang xoá…' : 'Xoá'}
              </button>
            </div>
          </section>
        </div>
      )}

      {dialog && ['create', 'edit', 'view'].includes(dialog.mode) && (
        <SupplierFormModal
          key={`${dialog.mode}-${dialog.supplier?.id || 'new'}`}
          mode={dialog.mode}
          supplier={dialog.supplier}
          onClose={() => setDialog(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

function SupplierFormModal({ mode, supplier, onClose, onSaved }) {
  const readOnly = mode === 'view';
  const isEditing = mode === 'edit';
  const [values, setValues] = useState(() => Object.fromEntries(
    fields.map(({ name }) => [name, supplier?.[name] || '']),
  ));
  const [saving, setSaving] = useState(false);
  const title = readOnly ? 'Thông tin nhà cung cấp' : isEditing ? 'Sửa thông tin nhà cung cấp' : 'Thêm một nhà cung cấp mới';
  const subtitle = readOnly
    ? 'Thông tin hồ sơ của nhà cung cấp đã chọn.'
    : isEditing
      ? 'Cập nhật thông tin hồ sơ của nhà cung cấp đã chọn.'
      : 'Nhập đầy đủ thông tin để tạo hồ sơ nhà cung cấp.';

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      if (isEditing) await apiPatch(`/suppliers/${supplier.id}`, values);
      else await apiPost('/suppliers', values);
      toast.success(isEditing ? 'Đã lưu cập nhật!' : 'Thêm thành công', {
        description: isEditing ? undefined : 'Nhà cung cấp đã được lưu.',
      });
      onSaved();
    } catch (error) {
      toast.error(error.message || 'Không thể lưu thông tin nhà cung cấp.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="supplier-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
      <section className="supplier-form-dialog" role="dialog" aria-modal="true" aria-labelledby="supplier-form-title">
        <header className="supplier-modal-heading">
          <div>
            <h2 id="supplier-form-title">{title}</h2>
            <p>{subtitle}</p>
          </div>
          <button type="button" className="supplier-modal-close" onClick={onClose} aria-label="Đóng" disabled={saving}>
            <FiX aria-hidden="true" />
          </button>
        </header>
        <form onSubmit={submit}>
          <div className="supplier-form-grid">
            {fields.map(({ name, label, placeholder, icon: Icon }, index) => {
              const halfWidth = index >= 6;
              return (
                <label className={`supplier-form-field ${halfWidth ? 'is-half' : ''}`} key={name}>
                  <span>{label}{!readOnly && <b> *</b>}</span>
                  <span className={`supplier-input-wrap ${readOnly ? 'is-readonly' : ''}`}>
                    <Icon aria-hidden="true" />
                    <input
                      name={name}
                      type={name === 'email' ? 'email' : name === 'phoneNumber' ? 'tel' : 'text'}
                      value={values[name]}
                      onChange={(event) => setValues((current) => ({ ...current, [name]: event.target.value }))}
                      placeholder={placeholder}
                      required={!readOnly}
                      readOnly={readOnly}
                      maxLength={maxLengthByField[name]}
                    />
                    {readOnly && <FiLock className="supplier-field-lock" aria-label="Chỉ đọc" />}
                  </span>
                </label>
              );
            })}
          </div>
          <footer className="supplier-form-footer">
            {readOnly ? (
              <span className="supplier-readonly-note"><FiLock aria-hidden="true" /> Thông tin chỉ hiển thị</span>
            ) : (
              <>
                <span className="supplier-required-note"><b>*</b> Thông tin bắt buộc</span>
                <button type="submit" className="supplier-primary-button" disabled={saving}>
                  {isEditing ? <FiCheck aria-hidden="true" /> : <FiPlus aria-hidden="true" />}
                  {saving ? 'Đang lưu…' : isEditing ? 'Lưu thay đổi' : 'Thêm'}
                </button>
              </>
            )}
          </footer>
        </form>
      </section>
    </div>
  );
}
