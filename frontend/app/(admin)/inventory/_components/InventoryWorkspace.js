'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FiAlertTriangle,
  FiArrowDownCircle,
  FiArrowRight,
  FiArrowUpCircle,
  FiBox,
  FiCalendar,
  FiCheck,
  FiChevronDown,
  FiChevronRight,
  FiDownload,
  FiFilter,
  FiPackage,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTag,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import { apiGet } from '@/lib/api';
import InventoryCreateModal from './InventoryCreateModal';
import InventoryDocumentModal from './InventoryDocumentModal';
import InventoryExportModal from './InventoryExportModal';
import { useInventoryUser } from './InventoryUserContext';

const pageSize = 100;
const number = (value) => new Intl.NumberFormat('vi-VN').format(value || 0);
const money = (value) => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
}).format(value || 0);

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(value));
}

function documentStatus(status) {
  return {
    DRAFT: 'Bản nháp',
    PENDING_HANDLE: 'Chờ duyệt',
    APPROVED: 'Đã duyệt',
    DENIED: 'Từ chối',
  }[status] || status || '—';
}

function productStatus(stock) {
  if (stock <= 0) return { label: 'Hết hàng', className: 'empty' };
  if (stock <= 3) return { label: 'Sắp hết', className: 'low' };
  return { label: 'Còn hàng', className: 'good' };
}

function escapeCsv(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

export default function InventoryWorkspace({ initialView = 'dashboard', initialStatus = 'all' }) {
  const router = useRouter();
  const user = useInventoryUser();
  const permissions = user.permissions || [];
  const canCreateReceipt = permissions.includes('STOCK_RECEIPT_CREATE');
  const canCreateIssue = user.role === 'STAFF' || permissions.includes('STOCK_ISSUE_CREATE');
  const canAccessRequests = user.role === 'SHOP_OWNER';
  const canApproveReceipt = canAccessRequests && permissions.includes('STOCK_RECEIPT_APPROVE');
  const canApproveIssue = canAccessRequests && permissions.includes('STOCK_ISSUE_APPROVE');
  const [inventory, setInventory] = useState([]);
  const [inventoryTotal, setInventoryTotal] = useState(0);
  const [lowStock, setLowStock] = useState([]);
  const [lowStockTotal, setLowStockTotal] = useState(0);
  const [receipts, setReceipts] = useState([]);
  const [issues, setIssues] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState('');
  const [view, setView] = useState(
    initialView === 'pending' && user.role === 'STAFF' ? 'dashboard' : initialView,
  );
  const [category, setCategory] = useState('Tất cả');
  const [search, setSearch] = useState('');
  const [requestType, setRequestType] = useState('all');
  const [requestStatus, setRequestStatus] = useState(initialStatus);
  const [period, setPeriod] = useState('all');
  const [periodNow, setPeriodNow] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [createKind, setCreateKind] = useState('');
  const [createProductId, setCreateProductId] = useState('');
  const [exportOpen, setExportOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState(null);
  const [adjustingProduct, setAdjustingProduct] = useState(null);
  const [activeDocument, setActiveDocument] = useState(null);

  useEffect(() => {
    if (initialView === 'pending' && user.role === 'STAFF') {
      router.replace('/inventory');
    }
  }, [initialView, router, user.role]);

  const fetchData = useCallback(() => Promise.all([
    apiGet(`/inventory?page=1&pageSize=${pageSize}`),
    apiGet(`/inventory/low-stock?page=1&pageSize=${pageSize}`),
    apiGet('/inventory/suppliers'),
    apiGet(`/stock-receipts?page=1&pageSize=${pageSize}`),
    apiGet(`/stock-issues?page=1&pageSize=${pageSize}`),
  ]), []);

  const updateData = useCallback(([inventoryData, lowStockData, suppliersData, receiptData, issueData]) => {
    setInventory(inventoryData.items || []);
    setInventoryTotal(inventoryData.total || 0);
    setLowStock(lowStockData.items || []);
    setLowStockTotal(lowStockData.total || 0);
    setSuppliers(suppliersData || []);
    setReceipts(receiptData.items || []);
    setIssues(issueData.items || []);
    setPageError('');
  }, []);

  useEffect(() => {
    let active = true;
    fetchData()
      .then((data) => {
        if (active) updateData(data);
      })
      .catch((error) => {
        if (active) setPageError(error.message || 'Không thể tải dữ liệu kho.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [fetchData, updateData]);

  function refreshData() {
    setRefreshing(true);
    setPageError('');
    fetchData()
      .then(updateData)
      .catch((error) => setPageError(error.message || 'Không thể tải dữ liệu kho.'))
      .finally(() => setRefreshing(false));
  }

  const documents = useMemo(() => [
    ...receipts.map((doc) => ({ ...doc, kind: 'receipt' })),
    ...issues.map((doc) => ({ ...doc, kind: 'issue' })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [receipts, issues]);

  const pendingDocuments = useMemo(
    () => documents.filter((doc) => doc.status === 'PENDING_HANDLE'),
    [documents],
  );
  const processedDocuments = useMemo(
    () => documents.filter((doc) => ['APPROVED', 'DENIED'].includes(doc.status)),
    [documents],
  );

  const categories = useMemo(() => [
    'Tất cả',
    ...new Set(inventory.map((product) => product.category?.name).filter(Boolean)),
  ], [inventory]);

  const visibleProducts = useMemo(() => {
    const source = view === 'lowStock' ? lowStock : inventory;
    const query = search.trim().toLocaleLowerCase('vi-VN');
    return source.filter((product) => {
      const matchesCategory = category === 'Tất cả' || product.category?.name === category;
      const matchesSearch = !query
        || product.productName?.toLocaleLowerCase('vi-VN').includes(query)
        || product.slug?.toLocaleLowerCase('vi-VN').includes(query)
        || String(product.id).includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [category, inventory, lowStock, search, view]);

  const visibleDocuments = useMemo(() => {
    const source = view === 'pending' ? pendingDocuments : processedDocuments;
    const query = search.trim().toLocaleLowerCase('vi-VN');
    const cutoff = period === '7days' && periodNow ? periodNow - 7 * 86400000 : null;
    return source.filter((doc) => {
      const matchesType = requestType === 'all' || doc.kind === requestType;
      const matchesStatus = requestStatus === 'all' || doc.status === requestStatus;
      const matchesSearch = !query
        || doc.code?.toLocaleLowerCase('vi-VN').includes(query)
        || doc.content?.toLocaleLowerCase('vi-VN').includes(query)
        || doc.createdBy?.fullName?.toLocaleLowerCase('vi-VN').includes(query);
      const matchesPeriod = !cutoff || new Date(doc.createdAt).getTime() >= cutoff;
      return matchesType && matchesStatus && matchesSearch && matchesPeriod;
    });
  }, [pendingDocuments, period, periodNow, processedDocuments, requestStatus, requestType, search, view]);

  const categoriesToRender = useMemo(() => {
    const map = new Map();
    for (const product of visibleProducts) {
      const label = product.category?.name || 'Chưa phân loại';
      map.set(label, [...(map.get(label) || []), product]);
    }
    return [...map.entries()];
  }, [visibleProducts]);

  async function loadMoreProducts() {
    const source = view === 'lowStock' ? lowStock : inventory;
    const nextPage = Math.floor(source.length / pageSize) + 1;
    try {
      const path = view === 'lowStock' ? '/inventory/low-stock' : '/inventory';
      const next = await apiGet(`${path}?page=${nextPage}&pageSize=${pageSize}`);
      if (view === 'lowStock') setLowStock((current) => [...current, ...(next.items || [])]);
      else setInventory((current) => [...current, ...(next.items || [])]);
    } catch (error) {
      setPageError(error.message || 'Không thể tải thêm sản phẩm.');
    }
  }

  async function openDocument(row) {
    setActiveDocument({ ...row, loading: true });
    const path = row.kind === 'receipt' ? '/stock-receipts' : '/stock-issues';
    try {
      const detail = await apiGet(`${path}/${row.id}`);
      setActiveDocument({ ...detail, kind: row.kind });
    } catch (error) {
      setActiveDocument(null);
      setPageError(error.message || 'Không thể tải chi tiết phiếu.');
    }
  }

  function startCreate(initialKind = '', productId = '') {
    if (initialKind === 'receipt' && !canCreateReceipt) return;
    if (initialKind === 'issue' && !canCreateIssue) return;
    setCreateKind(initialKind);
    setCreateProductId(productId ? String(productId) : '');
    setCreateOpen(true);
    setActiveProduct(null);
  }

  function finishCreate() {
    setCreateOpen(false);
    changeView(canAccessRequests ? 'pending' : 'inventory');
    refreshData();
  }

  function changeView(nextView, nextStatus = 'all') {
    if (nextView === 'pending' && user.role === 'STAFF') return;
    setView(nextView);
    setSearch('');
    setCategory('Tất cả');
    setRequestType('all');
    setRequestStatus(nextStatus);
    const query = new URLSearchParams();
    if (nextView !== 'dashboard') query.set('view', nextView);
    if (nextStatus !== 'all') query.set('status', nextStatus);
    const queryString = query.toString();
    router.push(queryString ? `/inventory?${queryString}` : '/inventory');
  }

  function chooseAdjustment(kind) {
    if (!adjustingProduct) return;
    startCreate(kind, adjustingProduct.id);
    setAdjustingProduct(null);
  }

  function finishDocumentUpdate() {
    setActiveDocument(null);
    refreshData();
  }

  async function exportInventory(scope = 'all') {
    try {
      let products = scope === 'filtered' ? visibleProducts : inventory;
      if (scope === 'all' && inventoryTotal > inventory.length) {
        const pages = Math.ceil(inventoryTotal / pageSize);
        const remaining = await Promise.all(
          Array.from({ length: pages - 1 }, (_, index) => (
            apiGet(`/inventory?page=${index + 2}&pageSize=${pageSize}`)
          )),
        );
        products = [...products, ...remaining.flatMap((pageData) => pageData.items || [])];
      }

      const rows = [
        ['Mã sản phẩm', 'Tên sản phẩm', 'Danh mục', 'Tồn kho', 'Tình trạng', 'Lần nhập gần nhất'],
        ...products.map((product) => [
          product.slug || product.id,
          product.productName,
          product.category?.name || '',
          product.stock,
          productStatus(product.stock).label,
          product.inventoryTransactions?.[0]?.createdAt ? formatDate(product.inventoryTransactions[0].createdAt) : '',
        ]),
      ];
      const csv = `\uFEFF${rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n')}`;
      const blobUrl = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = `ton-kho-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();
      URL.revokeObjectURL(blobUrl);
      setExportOpen(false);
    } catch (error) {
      setPageError(error.message || 'Không thể xuất dữ liệu kho.');
    }
  }

  const viewTitle = {
    dashboard: 'Quản lý kho hàng',
    inventory: 'Quản lý hàng tồn kho',
    lowStock: 'Cảnh báo tồn kho thấp',
    pending: 'Phiếu nhập/xuất chờ xử lý',
    processed: 'Danh sách phiếu đã xử lý',
    suppliers: 'Quản lý nhà cung cấp',
  }[view];

  const viewDescription = {
    dashboard: 'Chọn nghiệp vụ kho hàng bạn muốn thực hiện.',
    inventory: 'Theo dõi số lượng, tình trạng và lịch sử nhập hàng theo từng danh mục sản phẩm.',
    lowStock: 'Theo dõi các sản phẩm có số lượng tồn kho không quá 3 và chủ động bổ sung.',
    pending: 'Theo dõi và duyệt các phiếu nhập, phiếu xuất đang chờ xử lý.',
    processed: 'Tra cứu các phiếu nhập, phiếu xuất đã được duyệt hoặc từ chối.',
    suppliers: 'Danh sách nhà cung cấp đang được sử dụng cho các phiếu nhập kho.',
  }[view];

  const pendingTitle = 'Phiếu nhập/xuất đang chờ xử lý';
  const processedTitle = 'Phiếu nhập/xuất đã xử lý';

  return (
    <div className="inv-page">
      <header className="inv-page-heading">
        <div>
          {view !== 'dashboard' && (
            <div className="inv-breadcrumb">
              <button type="button" className="inv-breadcrumb-home" onClick={() => changeView('dashboard')}>
                Quản lý Kho hàng
              </button>
              <FiChevronRight aria-hidden="true" />
              <strong>{viewTitle}</strong>
            </div>
          )}
          <h1>{viewTitle}</h1>
          <p>{viewDescription}</p>
        </div>
        {view !== 'dashboard' && view !== 'suppliers' && (
          <div className="inv-sync">
            <span><i /> {refreshing ? 'Đang cập nhật…' : `Cập nhật lúc ${new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date())}`}</span>
            <small>Dữ liệu tồn kho trực tiếp</small>
          </div>
        )}
      </header>

      {pageError && (
        <div className="inv-page-error" role="alert">
          <span>{pageError}</span>
          <button type="button" onClick={refreshData}><FiRefreshCw aria-hidden="true" /> Thử lại</button>
        </div>
      )}

      {view === 'dashboard' ? (
        <InventoryDashboard
          onOpenInventory={() => changeView('inventory')}
          onOpenRequests={() => changeView('pending')}
          onOpenSuppliers={() => router.push('/inventory/suppliers')}
          supplierCount={suppliers.length}
          canAccessRequests={canAccessRequests}
        />
      ) : (
        <>
      {view !== 'suppliers' && (
      <section className="inv-overview" aria-label="Tổng quan cần xử lý">
        <div className="inv-section-kicker">TỔNG QUAN CẦN XỬ LÝ</div>
        {view === 'pending' || view === 'processed' ? (
          <div className="inv-metric-grid inv-metric-grid-four">
            <MetricCard icon={<FiPackage />} value={documents.length} title="Tổng yêu cầu" subtitle="Phiếu nhập và phiếu xuất" tone="blue" onClick={() => setRequestStatus('all')} />
            <MetricCard icon={<FiRefreshCw />} value={pendingDocuments.length} title="Đang xử lý" subtitle="Cần xem xét" tone="orange" onClick={() => { changeView('pending'); }} />
            <MetricCard icon={<FiCheck />} value={documents.filter((doc) => doc.status === 'APPROVED').length} title="Đã duyệt" subtitle="Hoàn tất xử lý" tone="green" onClick={() => changeView('processed', 'APPROVED')} />
            <MetricCard icon={<FiX />} value={documents.filter((doc) => doc.status === 'DENIED').length} title="Từ chối" subtitle="Có lý do đi kèm" tone="red" onClick={() => changeView('processed', 'DENIED')} />
          </div>
        ) : (
          <div className={`inv-metric-grid ${view === 'lowStock' ? 'inv-metric-grid-one' : !canAccessRequests ? 'inv-metric-grid-two' : ''}`}>
            <MetricCard
              icon={<FiAlertTriangle />}
              value={number(lowStockTotal)}
              title={view === 'lowStock' ? 'Sản phẩm sắp hết' : 'Cảnh báo tồn kho thấp'}
              subtitle="Số lượng không quá 3 sản phẩm"
              tone="orange"
              onClick={() => changeView('lowStock')}
            />
            {view !== 'lowStock' && (
              <>
                <MetricCard
                  icon={<FiArrowDownCircle />}
                  value={number(processedDocuments.length)}
                  title={processedTitle}
                  subtitle="Phiếu đã được xử lý"
                  tone="green"
                  onClick={() => changeView('processed')}
                />
                {canAccessRequests && (
                  <MetricCard
                    icon={<FiArrowUpCircle />}
                    value={number(pendingDocuments.length)}
                    title={pendingTitle}
                    subtitle="Phiếu đang chờ xử lý"
                    tone="blue"
                    onClick={() => changeView('pending')}
                  />
                )}
              </>
            )}
          </div>
        )}
      </section>
      )}

      {view === 'suppliers' ? (
        <section className="inv-products-section">
          <div className="inv-section-heading">
            <div>
              <h2>Danh sách nhà cung cấp</h2>
              <p>{number(suppliers.length)} nhà cung cấp đang hoạt động</p>
            </div>
          </div>
          {loading ? <LoadingState /> : suppliers.length ? (
            <article className="inv-product-group">
              <div className="inv-table-scroll">
                <table className="inv-table inv-supplier-table">
                  <thead>
                    <tr><th>Mã nhà cung cấp</th><th>Tên nhà cung cấp</th><th>Sử dụng</th></tr>
                  </thead>
                  <tbody>
                    {suppliers.map((supplier) => (
                      <tr key={supplier.id}>
                        <td><span className="inv-product-id">NCC-{supplier.id}</span></td>
                        <td><strong className="inv-supplier-name">{supplier.name}</strong></td>
                        <td><span className="inv-pill inv-pill-good"><i />Phiếu nhập kho</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ) : (
            <EmptyState title="Chưa có nhà cung cấp" description="Nhà cung cấp sẽ xuất hiện tại đây khi được kích hoạt." />
          )}
        </section>
      ) : (view === 'inventory' || view === 'lowStock') ? (
        <>
          <section className="inv-category-section">
            <div className="inv-section-heading">
              <div>
                <h2>{view === 'lowStock' ? 'Lọc sản phẩm sắp hết theo danh mục' : 'Tìm theo danh mục'}</h2>
                <p>Chọn một hoặc nhiều danh mục để thu hẹp danh sách sản phẩm.</p>
              </div>
              <label className="inv-search">
                <FiSearch aria-hidden="true" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm ID hoặc tên sản phẩm" aria-label="Tìm ID hoặc tên sản phẩm" />
                {search && <button type="button" onClick={() => setSearch('')} aria-label="Xóa tìm kiếm"><FiX /></button>}
              </label>
            </div>

            <div className="inv-category-chips" aria-label="Lọc danh mục">
              {categories.map((name, index) => (
                <button
                  type="button"
                  key={name}
                  className={`inv-chip ${category === name ? 'is-selected' : ''}`}
                  onClick={() => setCategory(name)}
                >
                  {index === 0 ? <FiFilter aria-hidden="true" /> : <FiTag aria-hidden="true" />}
                  {name}
                </button>
              ))}
            </div>
          </section>

          <section className="inv-products-section">
            <div className="inv-section-heading inv-products-heading">
              <div>
                <h2>{view === 'lowStock' ? 'Danh sách sản phẩm sắp hết' : 'Danh sách sản phẩm theo danh mục'}</h2>
                <p>{number(visibleProducts.length)} sản phẩm đang hiển thị · Ngưỡng cảnh báo ≤ 3 sản phẩm</p>
              </div>
              <div className="inv-toolbar">
                {view === 'inventory' && (
                  <button type="button" className="inv-button inv-button-light" onClick={() => changeView('lowStock')}>
                    <FiFilter aria-hidden="true" /> Sắp hết hàng
                  </button>
                )}
                <button type="button" className="inv-button inv-button-primary" onClick={() => setExportOpen(true)}>
                  <FiDownload aria-hidden="true" /> Xuất dữ liệu
                </button>
                {(canCreateReceipt || canCreateIssue) && (
                  <button type="button" className="inv-button inv-button-outline" onClick={() => startCreate()}>
                    <FiPlus aria-hidden="true" /> Tạo phiếu
                  </button>
                )}
              </div>
            </div>

            {loading ? <LoadingState /> : visibleProducts.length ? (
              <div className="inv-product-groups">
                {categoriesToRender.map(([name, products]) => (
                  <ProductGroup
                    key={name}
                    name={name}
                    products={products}
                    onOpen={setActiveProduct}
                    onAdjust={setAdjustingProduct}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title={view === 'lowStock' ? 'Không có sản phẩm sắp hết' : 'Không tìm thấy sản phẩm'}
                description={view === 'lowStock' ? 'Hiện không có sản phẩm nào có tồn kho từ 0 đến 3.' : 'Thử đổi danh mục hoặc từ khóa tìm kiếm.'}
              />
            )}
            {(view === 'inventory' ? inventory.length < inventoryTotal : lowStock.length < lowStockTotal) && (
              <button type="button" className="inv-load-more" onClick={loadMoreProducts}>
                <FiChevronDown aria-hidden="true" /> Xem thêm sản phẩm
              </button>
            )}
          </section>
        </>
      ) : (
        <section className="inv-documents-section">
          <div className="inv-section-heading inv-documents-heading">
            <div>
              <h2>Danh sách yêu cầu</h2>
              <p>{number(visibleDocuments.length)} phiếu {view === 'pending' ? 'đang chờ xử lý' : 'đã được xử lý'}</p>
            </div>
            {view === 'pending' && (canCreateReceipt || canCreateIssue) && (
              <button type="button" className="inv-button inv-button-primary" onClick={() => startCreate()}>
                <FiPlus aria-hidden="true" /> Tạo yêu cầu
              </button>
            )}
          </div>

          <div className="inv-document-filters">
            <label className="inv-search inv-document-search">
              <FiSearch aria-hidden="true" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm ID, người lập hoặc nội dung" aria-label="Tìm phiếu" />
              {search && <button type="button" onClick={() => setSearch('')} aria-label="Xóa tìm kiếm"><FiX /></button>}
            </label>
            <label className="inv-select-filter">
              <FiFilter aria-hidden="true" />
              <select value={requestType} onChange={(event) => setRequestType(event.target.value)} aria-label="Lọc loại phiếu">
                <option value="all">Tất cả loại phiếu</option>
                <option value="receipt">Phiếu nhập</option>
                <option value="issue">Phiếu xuất</option>
              </select>
            </label>
            <label className="inv-select-filter">
              <FiChevronDown aria-hidden="true" />
              <select value={requestStatus} onChange={(event) => setRequestStatus(event.target.value)} aria-label="Lọc tình trạng">
                <option value="all">{view === 'pending' ? 'Chờ duyệt' : 'Mọi tình trạng'}</option>
                {view === 'processed' && <><option value="APPROVED">Đã duyệt</option><option value="DENIED">Từ chối</option></>}
              </select>
            </label>
            <label className="inv-select-filter">
              <FiCalendar aria-hidden="true" />
              <select value={period} onChange={(event) => {
                setPeriod(event.target.value);
                setPeriodNow(Date.now());
              }} aria-label="Lọc thời gian gửi">
                <option value="all">Tất cả ngày gửi</option>
                <option value="7days">Trong 7 ngày</option>
              </select>
            </label>
            <button type="button" className="inv-button inv-button-quiet" onClick={refreshData} disabled={refreshing}>
              <FiRefreshCw aria-hidden="true" /> Làm mới
            </button>
          </div>

          {loading ? <LoadingState /> : visibleDocuments.length ? (
            <DocumentTable
              documents={visibleDocuments}
              view={view}
              canApproveReceipt={canApproveReceipt}
              canApproveIssue={canApproveIssue}
              onOpen={openDocument}
            />
          ) : (
            <EmptyState
              title={view === 'pending' ? 'Không có phiếu chờ xử lý' : 'Chưa có phiếu đã xử lý'}
              description="Thay đổi bộ lọc hoặc tạo phiếu kho mới."
            />
          )}
        </section>
      )}
        </>
      )}

      <footer className="inv-page-footer">
        <span>Dữ liệu kho được cập nhật theo lịch sử giao dịch thực tế.</span>
        <button type="button" onClick={refreshData} disabled={refreshing}>
          <FiRefreshCw aria-hidden="true" /> Cập nhật dữ liệu
        </button>
      </footer>

      {activeProduct && (
        <ProductDetailModal
          product={activeProduct}
          canCreateReceipt={canCreateReceipt}
          canCreateIssue={canCreateIssue}
          onClose={() => setActiveProduct(null)}
          onCreate={startCreate}
        />
      )}
      {adjustingProduct && (
        <ProductAdjustmentModal
          product={adjustingProduct}
          canCreateReceipt={canCreateReceipt}
          canCreateIssue={canCreateIssue}
          onClose={() => setAdjustingProduct(null)}
          onSelect={chooseAdjustment}
        />
      )}
      {createOpen && (
        <InventoryCreateModal
          products={inventory}
          suppliers={suppliers}
          permissions={permissions}
          userRole={user.role}
          initialKind={createKind}
          initialProductId={createProductId}
          onClose={() => setCreateOpen(false)}
          onCreated={finishCreate}
        />
      )}
      {exportOpen && (
        <InventoryExportModal
          visibleCount={visibleProducts.length}
          totalCount={inventoryTotal}
          onClose={() => setExportOpen(false)}
          onExport={exportInventory}
          onPrint={() => window.print()}
        />
      )}
      {activeDocument && (
        <InventoryDocumentModal
          document={activeDocument}
          canReview={activeDocument.kind === 'receipt' ? canApproveReceipt : canApproveIssue}
          onClose={() => setActiveDocument(null)}
          onUpdated={finishDocumentUpdate}
        />
      )}
    </div>
  );
}

function InventoryDashboard({ onOpenInventory, onOpenRequests, onOpenSuppliers, supplierCount, canAccessRequests }) {
  const features = [
    {
      icon: <FiPackage aria-hidden="true" />,
      label: 'HÀNG HÓA',
      title: 'Quản lý hàng tồn kho',
      description: 'Theo dõi số lượng và tình trạng hàng tồn trong kho, cảnh báo mức tồn kho theo từng sản phẩm.',
      onClick: onOpenInventory,
    },
    {
      icon: <FiRefreshCw aria-hidden="true" />,
      label: 'VẬN HÀNH KHO',
      title: 'Duyệt phiếu nhập/xuất kho',
      description: 'Quản lý nhập xuất hàng hóa và toàn bộ lịch sử giao dịch kho.',
      onClick: onOpenRequests,
      disabled: !canAccessRequests,
    },
    {
      icon: <FiUsers aria-hidden="true" />,
      label: 'ĐỐI TÁC',
      title: 'Quản lý nhà cung cấp',
      description: 'Tra cứu nhà cung cấp và các đối tác đang phục vụ hoạt động nhập kho.',
      detail: `${number(supplierCount)} nhà cung cấp đang hoạt động`,
      onClick: onOpenSuppliers,
    },
  ];

  return (
    <section className="inv-dashboard" aria-labelledby="inventory-shortcuts-title">
      <div className="inv-dashboard-heading">
        <h2 id="inventory-shortcuts-title">LỐI TẮT NGHIỆP VỤ</h2>
        <span><i /> Dữ liệu kho được đồng bộ theo thời gian thực</span>
      </div>
      <div className="inv-feature-grid">
        {features.map((feature) => (
          <article className="inv-feature-card" key={feature.title}>
            <span className="inv-feature-icon">{feature.icon}</span>
            <span className="inv-feature-label">{feature.label}</span>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
            {feature.detail && <small className="inv-feature-detail">{feature.detail}</small>}
            <button
              type="button"
              className="inv-feature-action"
              onClick={feature.onClick}
              disabled={feature.disabled}
              aria-disabled={feature.disabled || undefined}
            >
              <span>{feature.disabled ? 'Chỉ dành cho Shop Owner' : 'Mở chức năng'}</span>
              <FiArrowRight aria-hidden="true" />
            </button>
          </article>
        ))}
      </div>
      <div className="inv-dashboard-hint">
        <span><FiCheck aria-hidden="true" /></span>
        <p>Chọn một chức năng để xem dữ liệu và bắt đầu thao tác quản lý kho.</p>
      </div>
    </section>
  );
}

function MetricCard({ icon, value, title, subtitle, tone, onClick }) {
  return (
    <button type="button" className="inv-metric-card" onClick={onClick}>
      <span className={`inv-metric-icon tone-${tone}`}>{icon}</span>
      <span className="inv-metric-number">{value}</span>
      <span className="inv-metric-copy">
        <strong>{title}</strong>
        <small>{subtitle}</small>
      </span>
      <FiArrowRight className="inv-metric-arrow" aria-hidden="true" />
    </button>
  );
}

function ProductGroup({ name, products, onOpen, onAdjust }) {
  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
  return (
    <article className="inv-product-group">
      <header className="inv-group-header">
        <span className="inv-group-icon"><FiBox aria-hidden="true" /></span>
        <span>
          <strong>{name}</strong>
          <small>{products.length} sản phẩm · Tổng tồn {number(totalStock)}</small>
        </span>
        <span className="inv-group-total">{products.length} sản phẩm</span>
      </header>
      <div className="inv-table-scroll">
        <table className="inv-table">
          <thead>
            <tr>
              <th>ID sản phẩm</th>
              <th>Tên sản phẩm</th>
              <th>Số lượng tồn kho</th>
              <th>Tình trạng</th>
              <th>Lần nhập gần nhất</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const status = productStatus(product.stock);
              const lastMovement = product.inventoryTransactions?.[0]?.createdAt;
              return (
                <tr key={product.id}>
                  <td><span className="inv-product-id">{product.slug || `SP-${product.id}`}</span></td>
                  <td>
                    <button type="button" className="inv-product-name" onClick={() => onOpen(product)}>
                      <span className="inv-product-thumb">
                        {product.pictures?.[0]?.url
                          ? <img src={product.pictures[0].url} alt="" loading="lazy" />
                          : <FiPackage aria-hidden="true" />}
                      </span>
                      {product.productName}
                    </button>
                  </td>
                  <td><strong className={`inv-stock-count ${status.className}`}>{number(product.stock)}</strong><small className="inv-unit"> sản phẩm</small></td>
                  <td><span className={`inv-pill inv-pill-${status.className}`}><i />{status.label}</span></td>
                  <td>{formatDate(lastMovement)}</td>
                  <td><button type="button" className="inv-button inv-button-outline inv-button-compact" onClick={() => onAdjust(product)}><FiRefreshCw aria-hidden="true" /> Điều chỉnh</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function ProductAdjustmentModal({ product, canCreateReceipt, canCreateIssue, onClose, onSelect }) {
  const actions = [
    {
      kind: 'receipt',
      title: 'Nhập kho',
      description: 'Tạo yêu cầu bổ sung sản phẩm vào kho.',
      icon: <FiArrowDownCircle aria-hidden="true" />,
      allowed: canCreateReceipt,
    },
    {
      kind: 'issue',
      title: 'Xuất kho',
      description: 'Tạo yêu cầu xuất sản phẩm khỏi kho.',
      icon: <FiArrowUpCircle aria-hidden="true" />,
      allowed: canCreateIssue,
    },
  ];

  return (
    <div className="inv-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="inv-modal inv-adjust-modal" role="dialog" aria-modal="true" aria-labelledby="adjust-title">
        <header className="inv-modal-header">
          <div>
            <p className="inv-eyebrow">ĐIỀU CHỈNH TỒN KHO</p>
            <h2 id="adjust-title">Chọn thao tác</h2>
            <p>Chọn loại yêu cầu cần tạo cho sản phẩm này.</p>
          </div>
          <button type="button" className="inv-close-button" onClick={onClose} aria-label="Đóng">
            <FiX aria-hidden="true" />
          </button>
        </header>

        <div className="inv-adjust-product">
          <span className="inv-product-large-thumb">
            {product.pictures?.[0]?.url
              ? <img src={product.pictures[0].url} alt="" />
              : <FiPackage aria-hidden="true" />}
          </span>
          <span>
            <small>{product.slug || `SP-${product.id}`}</small>
            <strong>{product.productName}</strong>
            <small>Tồn kho hiện tại: {number(product.stock)} sản phẩm</small>
          </span>
        </div>

        <div className="inv-adjust-actions">
          {actions.map((action) => (
            <button
              key={action.kind}
              type="button"
              className={`inv-adjust-option ${!action.allowed ? 'is-disabled' : ''}`}
              disabled={!action.allowed}
              onClick={() => onSelect(action.kind)}
            >
              <span className={`inv-adjust-icon ${action.kind}`}>{action.icon}</span>
              <span className="inv-adjust-copy">
                <strong>{action.title}</strong>
                <small>{action.description}</small>
                {!action.allowed && <small className="inv-adjust-permission">Bạn không có quyền thực hiện</small>}
              </span>
              <FiChevronRight className="inv-adjust-chevron" aria-hidden="true" />
            </button>
          ))}
        </div>

        <footer className="inv-modal-footer">
          <span className="inv-footer-note">Yêu cầu cần được Shop Owner xét duyệt.</span>
          <button type="button" className="inv-button inv-button-light" onClick={onClose}>Đóng</button>
        </footer>
      </section>
    </div>
  );
}

function DocumentTable({ documents, view, canApproveReceipt, canApproveIssue, onOpen }) {
  return (
    <article className="inv-document-card">
      <header className="inv-group-header">
        <span className="inv-group-icon"><FiClipboardIcon /></span>
        <span>
          <strong>{view === 'pending' ? 'Tất cả yêu cầu nhập xuất' : 'Phiếu nhập/xuất đã xử lý'}</strong>
          <small>Ưu tiên hiển thị phiếu mới nhất</small>
        </span>
        <span className="inv-group-total">{documents.length} phiếu</span>
      </header>
      <div className="inv-table-scroll">
        <table className="inv-table inv-doc-table">
          <thead>
            <tr>
              <th>Phân loại</th>
              <th>ID yêu cầu</th>
              <th>Người lập</th>
              <th>Nội dung yêu cầu</th>
              <th>Ngày lập</th>
              <th>Tình trạng</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => {
              const canReview = doc.kind === 'receipt' ? canApproveReceipt : canApproveIssue;
              return (
                <tr key={`${doc.kind}-${doc.id}`}>
                  <td><span className={`inv-doc-kind ${doc.kind}`}><i />{doc.kind === 'receipt' ? 'Nhập kho' : 'Xuất kho'}</span></td>
                  <td><button type="button" className="inv-product-id inv-link-button" onClick={() => onOpen(doc)}>{doc.code}</button></td>
                  <td>{doc.createdBy?.fullName || '—'}</td>
                  <td className="inv-doc-content">{doc.content}</td>
                  <td><strong>{formatDate(doc.createdAt)}</strong><small className="inv-doc-time">{new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date(doc.createdAt))}</small></td>
                  <td><span className={`inv-status inv-status-${doc.status?.toLowerCase()}`}><i />{documentStatus(doc.status)}</span></td>
                  <td>
                    <button
                      type="button"
                      className={`inv-button ${view === 'pending' && canReview ? 'inv-button-primary' : 'inv-button-outline'} inv-button-compact`}
                      onClick={() => onOpen(doc)}
                    >
                      {view === 'pending' && canReview ? 'Xét duyệt' : 'Chi tiết'}
                      <FiArrowRight aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="inv-table-footer">
        <span>Hiển thị 1–{documents.length} trong {documents.length} phiếu</span>
        <span>Trang 1 / 1</span>
      </div>
    </article>
  );
}

function ProductDetailModal({ product, canCreateReceipt, canCreateIssue, onClose, onCreate }) {
  const status = productStatus(product.stock);
  const lastMovement = product.inventoryTransactions?.[0]?.createdAt;
  return (
    <div className="inv-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="inv-modal inv-product-modal" role="dialog" aria-modal="true" aria-labelledby="product-title">
        <header className="inv-modal-header">
          <div>
            <p className="inv-eyebrow">CHI TIẾT SẢN PHẨM</p>
            <h2 id="product-title">{product.productName}</h2>
            <p>Cập nhật từ dữ liệu kho · {formatDate(lastMovement)}</p>
          </div>
          <button type="button" className="inv-close-button" onClick={onClose} aria-label="Đóng"><FiX /></button>
        </header>
        <div className="inv-product-detail-head">
          <span className="inv-product-large-thumb">
            {product.pictures?.[0]?.url ? <img src={product.pictures[0].url} alt="" /> : <FiPackage />}
          </span>
          <span><small>{product.category?.name || 'Sản phẩm'}</small><strong>{product.productName}</strong><small>{product.slug || `SP-${product.id}`}</small></span>
        </div>
        <div className="inv-product-facts">
          <div><span>Mã sản phẩm</span><strong>{product.slug || product.id}</strong></div>
          <div><span>Số lượng tồn kho</span><strong className={`inv-stock-count ${status.className}`}>{number(product.stock)} sản phẩm</strong></div>
          <div><span>Tình trạng</span><strong><span className={`inv-pill inv-pill-${status.className}`}><i />{status.label}</span></strong></div>
          <div><span>Lần nhập / giao dịch gần nhất</span><strong>{formatDate(lastMovement)}</strong></div>
        </div>
        {(canCreateReceipt || canCreateIssue) && (
          <footer className="inv-product-actions">
            {canCreateReceipt && <button type="button" className="inv-button inv-button-outline" onClick={() => onCreate('receipt', product.id)}><FiArrowDownCircle /> Lập phiếu nhập kho</button>}
            {canCreateIssue && <button type="button" className="inv-button inv-button-primary" onClick={() => onCreate('issue', product.id)}><FiArrowUpCircle /> Lập phiếu xuất kho</button>}
          </footer>
        )}
      </section>
    </div>
  );
}

function LoadingState() {
  return <div className="inv-loading" role="status"><span className="inv-spinner" /> Đang tải dữ liệu từ hệ thống kho…</div>;
}

function EmptyState({ title, description }) {
  return (
    <div className="inv-empty-state">
      <span className="inv-empty-icon"><FiPackage aria-hidden="true" /></span>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

function FiClipboardIcon() {
  return <FiBox aria-hidden="true" />;
}
