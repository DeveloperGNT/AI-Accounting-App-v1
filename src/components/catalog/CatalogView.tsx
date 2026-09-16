import React, { useEffect, useState } from 'react';
import { Plus, Search, X, Trash2, Pencil } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../features/categories/categoriesSlice';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../features/products/productsSlice';
import {
  fetchAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
} from '../../features/accounts/accountsSlice';
import { formatINR } from '../../utils/formatters';

interface CatalogViewProps {
  navigate: (route: string) => void;
}

type CatalogTab = 'products' | 'categories' | 'accounts';

const PRODUCT_UNITS = ['NOS', 'PCS', 'SET', 'KGS', 'MTR', 'HRS', 'MONTH', 'JOB', 'SUB'];
const GST_RATES = ['0', '5', '12', '18', '28'];
const ACCOUNT_TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];
const CATEGORY_TYPES = ['EXPENSE', 'INCOME'];

const emptyProductForm = { name: '', hsn: '', unit: 'NOS', rate: '', gstRate: '18' };
const emptyCategoryForm = { name: '', type: 'EXPENSE' };
const emptyAccountForm = { code: '', name: '', accountType: 'EXPENSE' };

export const CatalogView: React.FC<CatalogViewProps> = () => {
  const dispatch = useAppDispatch();
  const productsState = useAppSelector((state) => state.products);
  const categoriesState = useAppSelector((state) => state.categories);
  const accountsState = useAppSelector((state) => state.accounts);

  const [activeTab, setActiveTab] = useState<CatalogTab>('products');
  const [searchQuery, setSearchQuery] = useState('');

  // Product form state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [productError, setProductError] = useState('');
  const [productSubmitting, setProductSubmitting] = useState(false);

  // Category form state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [categoryError, setCategoryError] = useState('');
  const [categorySubmitting, setCategorySubmitting] = useState(false);

  // Account form state
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editAccountId, setEditAccountId] = useState<string | null>(null);
  const [accountForm, setAccountForm] = useState(emptyAccountForm);
  const [accountError, setAccountError] = useState('');
  const [accountSubmitting, setAccountSubmitting] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch the server lists once the active organization is resolved (the
  // TenantAccessGuard rejects any request without x-organization-id) and
  // refetch on tenant switch. Tenant-scoped slices self-reset on switch via
  // resetOnOrganizationChange, so status returns to 'idle' and this re-runs.
  const activeOrganizationId = useAppSelector(
    (state) => state.organizations.activeOrganizationId,
  );
  useEffect(() => {
    if (!activeOrganizationId) return;
    dispatch(fetchProducts());
    dispatch(fetchCategories({ page: 1, limit: 100 }));
    dispatch(fetchAccounts());
  }, [activeOrganizationId, dispatch]);

  const setProductField = (field: keyof typeof emptyProductForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setProductForm((prev) => ({ ...prev, [field]: e.target.value }));

  const setCategoryField = (field: keyof typeof emptyCategoryForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setCategoryForm((prev) => ({ ...prev, [field]: e.target.value }));

  const setAccountField = (field: keyof typeof emptyAccountForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setAccountForm((prev) => ({ ...prev, [field]: e.target.value }));

  /* ------------------------- PRODUCTS ------------------------- */

  const openAddProduct = () => {
    setProductForm(emptyProductForm);
    setEditProductId(null);
    setProductError('');
    setIsProductModalOpen(true);
  };

  const openEditProduct = (p: { id: string; name: string; hsn?: string; unit: string; rate: number; gstRate: number }) => {
    setEditProductId(p.id);
    setProductForm({
      name: p.name,
      hsn: p.hsn ?? '',
      unit: p.unit,
      rate: String(p.rate ?? 0),
      gstRate: String(p.gstRate ?? 0),
    });
    setProductError('');
    setIsProductModalOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) {
      setProductError('Product / service name is required.');
      return;
    }
    setProductSubmitting(true);
    setProductError('');
    const payload = {
      name: productForm.name.trim(),
      hsn: productForm.hsn.trim() || undefined,
      unit: productForm.unit,
      rate: parseFloat(productForm.rate) || 0,
      gstRate: parseFloat(productForm.gstRate) || 0,
    };
    try {
      if (editProductId) {
        await dispatch(updateProduct({ id: editProductId, payload })).unwrap();
      } else {
        await dispatch(createProduct(payload)).unwrap();
      }
      setIsProductModalOpen(false);
      setEditProductId(null);
      setProductForm(emptyProductForm);
    } catch (err) {
      setProductError(err instanceof Error ? err.message : 'Failed to save product.');
    } finally {
      setProductSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Delete this product / service record?')) return;
    setDeletingId(id);
    try {
      await dispatch(deleteProduct(id)).unwrap();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to delete product.');
    } finally {
      setDeletingId(null);
    }
  };

  /* ------------------------ CATEGORIES ------------------------ */

  const openAddCategory = () => {
    setCategoryForm(emptyCategoryForm);
    setEditCategoryId(null);
    setCategoryError('');
    setIsCategoryModalOpen(true);
  };

  const openEditCategory = (c: { id: string; name: string; type: string }) => {
    setEditCategoryId(c.id);
    setCategoryForm({ name: c.name, type: c.type });
    setCategoryError('');
    setIsCategoryModalOpen(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      setCategoryError('Category name is required.');
      return;
    }
    setCategorySubmitting(true);
    setCategoryError('');
    const payload = { name: categoryForm.name.trim(), type: categoryForm.type };
    try {
      if (editCategoryId) {
        await dispatch(updateCategory({ id: editCategoryId, payload })).unwrap();
      } else {
        await dispatch(createCategory(payload)).unwrap();
      }
      setIsCategoryModalOpen(false);
      setEditCategoryId(null);
      setCategoryForm(emptyCategoryForm);
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : 'Failed to save category.');
    } finally {
      setCategorySubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Delete this category?')) return;
    setDeletingId(id);
    try {
      await dispatch(deleteCategory(id)).unwrap();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to delete category.');
    } finally {
      setDeletingId(null);
    }
  };

  /* ------------------------- ACCOUNTS ------------------------- */

  const openAddAccount = () => {
    setAccountForm(emptyAccountForm);
    setEditAccountId(null);
    setAccountError('');
    setIsAccountModalOpen(true);
  };

  const openEditAccount = (a: { id: string; code: string; name: string; accountType: string }) => {
    setEditAccountId(a.id);
    setAccountForm({ code: a.code ?? '', name: a.name, accountType: a.accountType ?? 'EXPENSE' });
    setAccountError('');
    setIsAccountModalOpen(true);
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountForm.code.trim() || !accountForm.name.trim()) {
      setAccountError('Account code and name are both required.');
      return;
    }
    setAccountSubmitting(true);
    setAccountError('');
    const payload = {
      code: accountForm.code.trim(),
      name: accountForm.name.trim(),
      accountType: accountForm.accountType,
    };
    try {
      if (editAccountId) {
        await dispatch(updateAccount({ id: editAccountId, payload })).unwrap();
      } else {
        await dispatch(createAccount(payload)).unwrap();
      }
      setIsAccountModalOpen(false);
      setEditAccountId(null);
      setAccountForm(emptyAccountForm);
    } catch (err) {
      setAccountError(err instanceof Error ? err.message : 'Failed to save account.');
    } finally {
      setAccountSubmitting(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!window.confirm('Delete this ledger account? Journal entries referencing it will stop balancing.')) return;
    setDeletingId(id);
    try {
      await dispatch(deleteAccount(id)).unwrap();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to delete account.');
    } finally {
      setDeletingId(null);
    }
  };

  /* ------------------------- RENDER ------------------------- */

  const q = searchQuery.toLowerCase();
  const filteredProducts = productsState.items.filter(
    (p) => !q || p.name.toLowerCase().includes(q) || (p.hsn ?? '').toLowerCase().includes(q),
  );
  const filteredCategories = categoriesState.list.filter(
    (c) => !q || c.name.toLowerCase().includes(q) || (c.type ?? '').toLowerCase().includes(q),
  );
  const filteredAccounts = accountsState.items.filter(
    (a: any) =>
      !q || (a.name ?? '').toLowerCase().includes(q) || (a.code ?? '').toLowerCase().includes(q),
  );

  const tabs: { id: CatalogTab; label: string; count: number }[] = [
    { id: 'products', label: 'Products & Services', count: productsState.items.length },
    { id: 'categories', label: 'Categories', count: categoriesState.list.length },
    { id: 'accounts', label: 'Ledger Accounts', count: accountsState.items.length },
  ];

  const renderProductRow = (p: (typeof productsState.items)[number]) => (
    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
      <td className="font-semibold text-slate-950 text-xs">{p.name}</td>
      <td className="font-mono text-xs text-slate-600">{p.hsn ?? '—'}</td>
      <td className="text-xs font-mono text-slate-600">{p.unit}</td>
      <td className="text-right font-mono text-slate-900 text-xs">{formatINR(p.rate ?? 0, false)}</td>
      <td className="text-center text-xs font-mono">{p.gstRate ?? 0}%</td>
      <td className="text-right whitespace-nowrap">
        <button
          onClick={() => openEditProduct(p)}
          className="text-[11px] font-semibold text-slate-900 hover:underline mr-3 inline-flex items-center gap-1"
        >
          <Pencil size={11} /> Edit
        </button>
        <button
          onClick={() => handleDeleteProduct(p.id)}
          disabled={deletingId === p.id}
          className="text-[11px] font-semibold text-red-600 hover:underline disabled:opacity-50"
        >
          {deletingId === p.id ? 'Deleting…' : 'Delete'}
        </button>
      </td>
    </tr>
  );

  const renderCategoryRow = (c: (typeof categoriesState.list)[number]) => (
    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
      <td className="font-semibold text-slate-950 text-xs">{c.name}</td>
      <td className="text-xs font-mono text-slate-600">{c.type}</td>
      <td className="text-xs font-mono text-slate-400">
        {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
      </td>
      <td className="text-right whitespace-nowrap">
        <button
          onClick={() => openEditCategory(c)}
          className="text-[11px] font-semibold text-slate-900 hover:underline mr-3 inline-flex items-center gap-1"
        >
          <Pencil size={11} /> Edit
        </button>
        <button
          onClick={() => handleDeleteCategory(c.id)}
          disabled={deletingId === c.id}
          className="text-[11px] font-semibold text-red-600 hover:underline disabled:opacity-50"
        >
          {deletingId === c.id ? 'Deleting…' : 'Delete'}
        </button>
      </td>
    </tr>
  );

  const renderAccountRow = (a: any) => (
    <tr key={a.id} className="hover:bg-slate-50 transition-colors">
      <td className="font-mono text-xs text-slate-600">{a.code}</td>
      <td className="font-semibold text-slate-950 text-xs">{a.name}</td>
      <td className="text-xs font-mono text-slate-600">{a.accountType}</td>
      <td className="text-center">
        <span
          className={`px-2 py-0.5 text-[10px] font-mono rounded-xs font-semibold ${
            (a.status ?? 'ACTIVE').toUpperCase() === 'ACTIVE'
              ? 'bg-emerald-100 text-emerald-900'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {a.status ?? 'ACTIVE'}
        </span>
      </td>
      <td className="text-right whitespace-nowrap">
        <button
          onClick={() => openEditAccount(a)}
          className="text-[11px] font-semibold text-slate-900 hover:underline mr-3 inline-flex items-center gap-1"
        >
          <Pencil size={11} /> Edit
        </button>
        <button
          onClick={() => handleDeleteAccount(a.id)}
          disabled={deletingId === a.id}
          className="text-[11px] font-semibold text-red-600 hover:underline disabled:opacity-50"
        >
          {deletingId === a.id ? 'Deleting…' : 'Delete'}
        </button>
      </td>
    </tr>
  );

  const renderErrorBanner = (message: string | undefined, retry: () => void) =>
    message ? (
      <div className="flex items-center justify-between bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xs">
        <span>Sync error: {message}</span>
        <button onClick={retry} className="font-semibold underline hover:no-underline">
          Retry
        </button>
      </div>
    ) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 p-6 rounded-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-950 tracking-tight">Catalog & Chart of Accounts</h1>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Products & services, expense categories, and ledger accounts — synced with the server
          </p>
        </div>
      </div>

      {/* Tabs + search */}
      <div className="bg-white border border-slate-200 rounded-xs p-4 space-y-4">
        <div className="flex items-center gap-1 border-b border-slate-200 pb-3 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-mono rounded-xs transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white font-bold'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 relative max-w-md">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, code, HSN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xs focus:outline-none focus:border-slate-900"
            />
          </div>

          <button
            onClick={
              activeTab === 'products'
                ? openAddProduct
                : activeTab === 'categories'
                  ? openAddCategory
                  : openAddAccount
            }
            id={`add-${activeTab}-btn`}
            className="bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-xs flex items-center gap-2 transition-colors"
          >
            <Plus size={14} />
            <span>
              {activeTab === 'products'
                ? 'Add Product / Service'
                : activeTab === 'categories'
                  ? 'Add Category'
                  : 'Add Ledger Account'}
            </span>
          </button>
        </div>
      </div>

      {/* Products table */}
      {activeTab === 'products' && (
        <>
          {renderErrorBanner(productsState.error, () => dispatch(fetchProducts()))}
          <div className="bg-white border border-slate-200 rounded-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left swiss-table border-collapse">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th className="w-24">HSN/SAC</th>
                    <th className="w-20">Unit</th>
                    <th className="text-right w-32">Default Rate</th>
                    <th className="text-center w-20">GST</th>
                    <th className="text-right w-36">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {productsState.loading && productsState.items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-slate-500 font-mono">
                        Loading products from server…
                      </td>
                    </tr>
                  )}
                  {!productsState.loading && filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-slate-500 font-mono">
                        No products found. Use “Add Product / Service” to create the first record.
                      </td>
                    </tr>
                  )}
                  {filteredProducts.map(renderProductRow)}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Categories table */}
      {activeTab === 'categories' && (
        <>
          {renderErrorBanner(categoriesState.error?.message, () =>
            dispatch(fetchCategories({ page: 1, limit: 100 })),
          )}
          <div className="bg-white border border-slate-200 rounded-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left swiss-table border-collapse">
                <thead>
                  <tr>
                    <th>Category Name</th>
                    <th className="w-32">Type</th>
                    <th className="w-32">Created</th>
                    <th className="text-right w-36">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categoriesState.listStatus === 'loading' && categoriesState.list.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-xs text-slate-500 font-mono">
                        Loading categories from server…
                      </td>
                    </tr>
                  )}
                  {categoriesState.listStatus !== 'loading' && filteredCategories.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-xs text-slate-500 font-mono">
                        No categories found. Use “Add Category” to create the first record.
                      </td>
                    </tr>
                  )}
                  {filteredCategories.map(renderCategoryRow)}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Accounts table */}
      {activeTab === 'accounts' && (
        <>
          {renderErrorBanner(accountsState.error, () => dispatch(fetchAccounts()))}
          <div className="bg-white border border-slate-200 rounded-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left swiss-table border-collapse">
                <thead>
                  <tr>
                    <th className="w-28">Code</th>
                    <th>Account Name</th>
                    <th className="w-32">Type</th>
                    <th className="text-center w-28">Status</th>
                    <th className="text-right w-36">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accountsState.status === 'loading' && accountsState.items.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-slate-500 font-mono">
                        Loading ledger accounts from server…
                      </td>
                    </tr>
                  )}
                  {accountsState.status !== 'loading' && filteredAccounts.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-slate-500 font-mono">
                        No ledger accounts found. Use “Add Ledger Account” to create the first one.
                      </td>
                    </tr>
                  )}
                  {filteredAccounts.map(renderAccountRow)}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Product modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-xs shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-950 tracking-tight">
                  {editProductId ? 'Edit Product / Service' : 'Add Product / Service'}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {editProductId ? 'PATCH /products/{id}' : 'POST /products'}
                </p>
              </div>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 rounded-xs hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleProductSubmit} className="p-6 space-y-4 text-xs">
              {productError && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xs">
                  {productError}
                </div>
              )}
              <div>
                <label className="block font-medium text-slate-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Precision Spindle Assembly"
                  value={productForm.name}
                  onChange={setProductField('name')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xs focus:outline-none focus:border-slate-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">HSN / SAC Code</label>
                  <input
                    type="text"
                    placeholder="8466"
                    value={productForm.hsn}
                    onChange={setProductField('hsn')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xs font-mono focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Unit *</label>
                  <select
                    value={productForm.unit}
                    onChange={setProductField('unit')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xs focus:outline-none focus:border-slate-900 bg-white font-mono"
                  >
                    {PRODUCT_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Default Rate (₹) *</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={productForm.rate}
                    onChange={setProductField('rate')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xs font-mono focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">GST Rate</label>
                  <select
                    value={productForm.gstRate}
                    onChange={setProductField('gstRate')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xs focus:outline-none focus:border-slate-900 bg-white font-mono"
                  >
                    {GST_RATES.map((r) => (
                      <option key={r} value={r}>
                        {r}%
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xs hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={productSubmitting}
                  className="px-5 py-2 bg-slate-950 text-white hover:bg-slate-800 rounded-xs font-semibold disabled:opacity-50"
                >
                  {productSubmitting ? 'Saving…' : editProductId ? 'Update Record' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-xs shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-950 tracking-tight">
                  {editCategoryId ? 'Edit Category' : 'Add Category'}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {editCategoryId ? 'PATCH /categories/{id}' : 'POST /categories'}
                </p>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 rounded-xs hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCategorySubmit} className="p-6 space-y-4 text-xs">
              {categoryError && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xs">
                  {categoryError}
                </div>
              )}
              <div>
                <label className="block font-medium text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rent & Facilities"
                  value={categoryForm.name}
                  onChange={setCategoryField('name')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xs focus:outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Type *</label>
                <select
                  value={categoryForm.type}
                  onChange={setCategoryField('type')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xs focus:outline-none focus:border-slate-900 bg-white font-mono"
                >
                  {CATEGORY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xs hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={categorySubmitting}
                  className="px-5 py-2 bg-slate-950 text-white hover:bg-slate-800 rounded-xs font-semibold disabled:opacity-50"
                >
                  {categorySubmitting ? 'Saving…' : editCategoryId ? 'Update Record' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account modal */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-xs shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-950 tracking-tight">
                  {editAccountId ? 'Edit Ledger Account' : 'Add Ledger Account'}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {editAccountId ? 'PATCH /accounts/{id}' : 'POST /accounts'}
                </p>
              </div>
              <button
                onClick={() => setIsAccountModalOpen(false)}
                className="p-1 rounded-xs hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAccountSubmit} className="p-6 space-y-4 text-xs">
              {accountError && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xs">
                  {accountError}
                </div>
              )}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    placeholder="5000"
                    value={accountForm.code}
                    onChange={setAccountField('code')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xs font-mono focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-medium text-slate-700 mb-1">Account Name *</label>
                  <input
                    type="text"
                    required
                    maxLength={255}
                    placeholder="e.g. Rent & Facilities"
                    value={accountForm.name}
                    onChange={setAccountField('name')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xs focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Account Type *</label>
                <select
                  value={accountForm.accountType}
                  onChange={setAccountField('accountType')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xs focus:outline-none focus:border-slate-900 bg-white font-mono"
                >
                  {ACCOUNT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xs hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={accountSubmitting}
                  className="px-5 py-2 bg-slate-950 text-white hover:bg-slate-800 rounded-xs font-semibold disabled:opacity-50"
                >
                  {accountSubmitting ? 'Saving…' : editAccountId ? 'Update Record' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
