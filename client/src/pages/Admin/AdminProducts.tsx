import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import AdminBreadcrumb from '../../components/admin/AdminBreadcrumb'
import DeleteConfirmationModal from '../../components/admin/DeleteConfirmationModal'
import VariantManagementModal, { ProductVariant } from '../../components/admin/VariantManagementModal'
import ActionMenu from '../../components/admin/ActionMenu'
import adminApiCall from '../../utils/adminApi'
import { errorToast, successToast } from '../../utils/toast'

// Format price to VND
const formatVND = (price: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price)
}

interface Product {
  _id: string
  name: string
  sku: string
  description: string
  price: number
  finalPrice: number
  discount?: number
  images?: Array<{ url: string; cloudinaryId?: string; alt?: string; isMain?: boolean }>
  categoryId: { _id: string; name: string }
  isActive: boolean
  stock?: number
  minPrice: number
  maxPrice: number
  variants?: ProductVariant[]
}

interface Category {
  _id: string
  name: string
}

interface Filters {
  category: string
  stockStatus: string
  pricing: string
  search: string
}

const AdminProducts: React.FC = () => {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [categories, setCategories] = useState<any[]>([])
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; productId?: string; productName?: string; productCount?: number; isDeleting: boolean; isBulkDelete?: boolean }>({
    isOpen: false,
    productId: '',
    productName: '',
    isDeleting: false,
    isBulkDelete: false,
  })

  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set())
  const [variantModal, setVariantModal] = useState<{ isOpen: boolean; productId: string; productName: string; variants: ProductVariant[] }>({
    isOpen: false,
    productId: '',
    productName: '',
    variants: [],
  })

  const [filters, setFilters] = useState<Filters>({
    category: '',
    stockStatus: '',
    pricing: '',
    search: '',
  })

  const ITEMS_PER_PAGE = 10 // Display 10 products per page. Load all, paginate on client

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true)
        // Always fetch from page 1 with high limit to get all products
        const queryParams = new URLSearchParams({
          page: '1',
          limit: '1000', // Fetch all products regardless of page
          ...(filters.category && { categoryId: filters.category }),
          ...(filters.search && { search: filters.search }),
        })

        const { data, error } = await adminApiCall<any>(
          `/admin/products?${queryParams.toString()}`
        )


        if (error) throw error

        // Handle response structure - may contain pagination info
        let productsArray: Product[] = []
        let totalCount = 0

        if (Array.isArray(data)) {
          // If data is just an array
          productsArray = data
          totalCount = data.length
        } else if (data && typeof data === 'object') {
          // If data is an object with pagination info
          if (Array.isArray(data.data)) {
            productsArray = data.data
            totalCount = data.total || productsArray.length
          } else if ('products' in data || 'items' in data) {
            // Handle other possible structures
            productsArray = (data.products || data.items || []) as Product[]
            totalCount = data.total || productsArray.length
          }
        }

        // Calculate pagination for client-side paging
        const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
        
        setProducts(productsArray)
        setTotal(totalCount)
        setTotalPages(totalPages)
        setCurrentPage(1) // Reset to first page when filters change
        setSelectedProducts(new Set())
      } catch (err) {
        console.error('Error loading products:', err)
        errorToast(err instanceof Error ? err.message : 'Failed to load products')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [filters.category, filters.search])

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await adminApiCall<any>('/categories')
        console.log('Categories API Response:', { data, error })
        if (error) {
          console.error('Error fetching categories:', error)
          return
        }
        
        // Handle response structure
        let categoriesArray: Category[] = []
        if (Array.isArray(data)) {
          categoriesArray = data
        } else if (data && typeof data === 'object') {
          if (Array.isArray(data.data)) {
            categoriesArray = data.data
          } else if (Array.isArray(data.categories)) {
            categoriesArray = data.categories
          }
        }
        
        console.log('Categories loaded successfully:', categoriesArray.length, 'categories')
        setCategories(categoriesArray)
      } catch (err) {
        console.error('❌ Failed to load categories:', err)
      }
    }

    fetchCategories()
  }, [])

  // Filter products locally
  const filteredProducts = products.filter((product) => {
    if (filters.stockStatus === 'in-stock' && !product.stock) return false
    if (filters.stockStatus === 'low-stock' && (!product.stock || product.stock > 10)) return false
    if (filters.stockStatus === 'out-of-stock' && product.stock && product.stock > 0) return false
    if (filters.pricing === 'on-sale' && !product.discount) return false
    return true
  })

  // Paginate filtered products on client side
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)



  // Update total pages when filtered products change
  useEffect(() => {
    const newTotalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1
    setTotalPages(newTotalPages)
    // Reset to page 1 if current page is beyond new total
    if (currentPage > newTotalPages) {
      setCurrentPage(1)
    }
  }, [filteredProducts.length])

  const toggleSelectProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts)
    if (newSelected.has(productId)) {
      newSelected.delete(productId)
    } else {
      newSelected.add(productId)
    }
    setSelectedProducts(newSelected)
  }

  const handleDeleteProduct = async (productId: string, productName: string) => {
    setDeleteModal({ isOpen: true, productId, productName, isDeleting: false, isBulkDelete: false })
  }

  const handleBulkDelete = () => {
    if (selectedProducts.size === 0) {
      errorToast('Vui lòng chọn ít nhất một sản phẩm')
      return
    }
    setDeleteModal({ isOpen: true, productCount: selectedProducts.size, isDeleting: false, isBulkDelete: true })
  }

  const confirmDelete = async () => {
    setDeleteModal({ ...deleteModal, isDeleting: true })
    try {
      if (deleteModal.isBulkDelete) {
        // Bulk delete
        const deletePromises = Array.from(selectedProducts).map((productId) =>
          adminApiCall(`/admin/products/${productId}`, { method: 'DELETE' })
        )
        const results = await Promise.all(deletePromises)
        const errors = results.filter((r) => r.error)

        if (errors.length > 0) {
          errorToast(`Xóa thất bại ${errors.length} sản phẩm`)
          setDeleteModal({ isOpen: false, isDeleting: false, isBulkDelete: false })
        } else {
          successToast(`Xóa thành công ${selectedProducts.size} sản phẩm`)
          setProducts(products.filter((p) => !selectedProducts.has(p._id)))
          setSelectedProducts(new Set())
          setDeleteModal({ isOpen: false, isDeleting: false, isBulkDelete: false })
        }
      } else {
        // Single delete
        const { error } = await adminApiCall(`/admin/products/${deleteModal.productId}`, {
          method: 'DELETE',
        })
        if (error) throw error
        successToast('Xóa sản phẩm thành công')
        setProducts(products.filter((p) => p._id !== deleteModal.productId))
        setDeleteModal({ isOpen: false, isDeleting: false, isBulkDelete: false })
      }
    } catch (err) {
      errorToast(err instanceof Error ? err.message : 'Không thể xóa sản phẩm')
      setDeleteModal({ ...deleteModal, isDeleting: false })
    }
  }

  const cancelDelete = () => {
    setDeleteModal({ isOpen: false, isDeleting: false, isBulkDelete: false })
  }

  const getStockStatus = (stock?: number) => {
    if (!stock) return { label: 'Hết hàng', color: 'red', icon: 'error' }
    if (stock < 10) return { label: 'Tồn kho thấp', color: 'amber', icon: 'warning' }
    return { label: 'Còn hàng', color: 'emerald', icon: 'check_circle' }
  }

  const getInventoryValue = () => {
    return products.reduce((sum, p) => {
      const price = p.finalPrice || p.price || 0
      const stock = p.stock || 0
      return sum + (typeof price === 'number' ? price : 0) * stock
    }, 0)
  }

  const getLowStockCount = () => {
    return products.filter((p) => p.stock && p.stock < 10).length
  }

  const toggleExpandProduct = (productId: string) => {
    console.log('Toggling expand for product:', productId)
    const newExpanded = new Set(expandedProducts)
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId)
      console.log('Collapsed')
    } else {
      newExpanded.add(productId)
      console.log('Expanded')
    }
    setExpandedProducts(newExpanded)
  }

  const getTotalVariantStock = (variants?: ProductVariant[]) => {
    if (!variants) return 0
    return variants.reduce((sum, v) => sum + (v.stock || 0), 0)
  }

  const openVariantModal = (productId: string, productName: string, variants: ProductVariant[] = []) => {
    console.log('Opening variant modal:', { productId, productName, variantCount: variants.length, variants })
    setVariantModal({ isOpen: true, productId, productName, variants })
  }

  const closeVariantModal = () => {
    console.log('Closing variant modal')
    setVariantModal({ isOpen: false, productId: '', productName: '', variants: [] })
  }

  return (
    <AdminLayout>
      <div className="p-10 space-y-8 flex-1">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <AdminBreadcrumb items={[{ label: 'Product Management' }]} />
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Quản Lý Sản Phẩm</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
              <span className="material-symbols-outlined text-lg">file_export</span>
              Export
            </button>
            <button
              onClick={() => navigate('/admin/products/create')}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-indigo-600 to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                add
              </span>
              Thêm Sản Phẩm
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="relative">
            <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2 ml-0.5">
              Danh Mục
            </label>
            <select
              value={filters.category}
              onChange={(e) => {
                setFilters({ ...filters, category: e.target.value })
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none cursor-pointer hover:border-slate-300 transition-colors"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-10 text-slate-400 pointer-events-none">
              expand_more
            </span>
          </div>

          <div className="relative">
            <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2 ml-0.5">
              Tình Trạng Kho
            </label>
            <select
              value={filters.stockStatus}
              onChange={(e) => setFilters({ ...filters, stockStatus: e.target.value })}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none cursor-pointer hover:border-slate-300 transition-colors"
            >
              <option value="">Tất cả tình trạng</option>
              <option value="in-stock">Còn hàng</option>
              <option value="low-stock">Tồn kho thấp</option>
              <option value="out-of-stock">Hết hàng</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-10 text-slate-400 pointer-events-none">
              expand_more
            </span>
          </div>

          <div className="relative">
            <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2 ml-0.5">
              Giá Bán
            </label>
            <select
              value={filters.pricing}
              onChange={(e) => setFilters({ ...filters, pricing: e.target.value })}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none cursor-pointer hover:border-slate-300 transition-colors"
            >
              <option value="">Tất cả giá</option>
              <option value="on-sale">Có khuyến mãi</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-10 text-slate-400 pointer-events-none">
              expand_more
            </span>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({ category: '', stockStatus: '', pricing: '', search: '' })
                setCurrentPage(1)
              }}
              className="w-full py-2.5 text-indigo-600 font-semibold hover:bg-indigo-50 rounded-lg transition-all flex items-center justify-center gap-2 border border-indigo-200"
            >
              <span className="material-symbols-outlined">filter_list</span>
              Clear All Filters
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
          <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filteredProducts.length > 0 && filteredProducts.every((p) => selectedProducts.has(p._id))}
                  onChange={() => {
                    const newSelected = new Set(selectedProducts)
                    const allSelected = filteredProducts.every((p) => selectedProducts.has(p._id))
                    
                    if (allSelected) {
                      // Unselect all
                      filteredProducts.forEach((p) => newSelected.delete(p._id))
                    } else {
                      // Select all
                      filteredProducts.forEach((p) => newSelected.add(p._id))
                    }
                    setSelectedProducts(newSelected)
                  }}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">
                  Chọn Tất Cả ({filteredProducts.length})
                </span>
              </div>
              <div className="h-4 w-px bg-slate-200"></div>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkDelete}
                  disabled={selectedProducts.size === 0}
                  className="text-xs font-bold px-3 py-2 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                  Xóa ({selectedProducts.size})
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Hiển thị {filteredProducts.length === 0 ? 0 : startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} của{' '}
              {filteredProducts.length} sản phẩm
            </p>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500">Đang tải sản phẩm...</div>
            ) : paginatedProducts.length === 0 ? (
              <div className="p-8 text-center text-slate-500">Không tìm thấy sản phẩm</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white">
                    <th className="p-6 w-8"></th>
                    <th className="p-6 w-12">
                      <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" />
                    </th>
                    <th className="py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">
                      Product
                    </th>
                    <th className="py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">
                      Category
                    </th>
                    <th className="py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Giá Bán</th>
                    <th className="py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">
                      Kho Hàng
                    </th>
                    <th className="py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Trạng Thái</th>
                    <th className="py-4 pr-6 text-[10px] uppercase tracking-widest font-bold text-slate-400 text-right">
                      Thao Tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedProducts.map((product) => {
                    const stockStatus = getStockStatus(product.stock)
                    const isExpanded = expandedProducts.has(product._id)
                    const hasVariants = product.variants && product.variants.length > 0
                    const totalVariantStock = getTotalVariantStock(product.variants)
                    
                    
                    return (
                      <React.Fragment key={product._id}>
                        <tr className="group hover:bg-slate-50/50 transition-all cursor-default">
                          <td className="p-4 text-center">
                            {hasVariants && (
                              <button
                                onClick={() => toggleExpandProduct(product._id)}
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              >
                                <span className="material-symbols-outlined text-lg" style={{
                                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                  transition: 'transform 0.3s ease'
                                }}>
                                  expand_more
                                </span>
                              </button>
                            )}
                          </td>
                          <td className="p-6">
                            <input
                              type="checkbox"
                              checked={selectedProducts.has(product._id)}
                              onChange={() => toggleSelectProduct(product._id)}
                              className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="py-4 pl-4">
                            <div className="flex items-center gap-4">
                              <div className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                                {product.images && Array.isArray(product.images) && product.images.length > 0 && product.images[0]?.url ? (
                                  <img
                                    src={product.images[0].url}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      console.warn(`Failed to load image for ${product.name}: ${product.images?.[0]?.url}`)
                                      e.currentTarget.style.display = 'none'
                                    }}
                                  />
                                ) : (
                                  <span className="material-symbols-outlined text-slate-300 text-4xl">image_not_supported</span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 leading-tight truncate">{product.name}</p>
                                <p className="text-xs text-slate-400 mt-0.5">SKU: {product.sku}</p>
                                {hasVariants && (
                                  <p className="text-xs text-indigo-600 font-semibold mt-1.5">
                                    <span className="material-symbols-outlined text-xs" style={{fontVariationSettings: "'FILL' 1"}}>layers</span> {product.variants?.length} variant
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4">
                            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-tight rounded-md">
                              {product.categoryId?.name || 'N/A'}
                            </span>
                          </td>
                          <td className="py-4">
                            <div className="flex flex-col">
                              {hasVariants ? (
                                <>
                                  <span className="font-bold text-indigo-600">
                                    {product.minPrice && product.maxPrice ? `${formatVND(product.minPrice)}-${formatVND(product.maxPrice)}` : 'N/A'}
                                  </span>
                                  <span className="text-xs text-indigo-600 mt-1">({product.variants?.length} variant)</span>
                                </>
                              ) : (
                                <>
                                  <span className="font-bold text-indigo-600">{formatVND(product.finalPrice || product.price || 0)}</span>
                                  {product.discount ? (
                                    <span className="text-[10px] text-slate-400 line-through">{formatVND(product.price || 0)}</span>
                                  ) : null}
                                </>
                              )}
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor: 
                                    stockStatus.color === 'red' ? '#ef4444' :
                                    stockStatus.color === 'amber' ? '#f59e0b' :
                                    '#10b981'
                                }}
                              ></div>
                              <span className="text-sm font-semibold text-slate-700">{hasVariants ? totalVariantStock : (product.stock || 0)} in stock</span>
                            </div>
                          </td>
                          <td className="py-4">
                            <div
                              className={`inline-flex items-center border px-3 py-1 rounded-full gap-2 ${
                                product.isActive
                                  ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                  : 'bg-slate-50 border-slate-200 text-slate-500'
                              }`}
                            >
                              <span
                                className="material-symbols-outlined text-[14px]"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                              >
                                {product.isActive ? 'check_circle' : 'pause_circle'}
                              </span>
                              <span className="text-[11px] font-bold uppercase tracking-tighter">
                                {product.isActive ? 'Active' : 'Draft'}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 pr-6 text-right">
                            <ActionMenu
                              items={[
                                {
                                  icon: 'visibility',
                                  label: 'Xem chi tiết',
                                  color: 'default',
                                  onClick: () => navigate(`/admin/products/${product._id}`),
                                },
                                {
                                  icon: 'edit',
                                  label: 'Chỉnh sửa',
                                  color: 'default',
                                  onClick: () => {
                                    console.log('Navigating to edit product:', product._id)
                                    navigate(`/admin/products/${product._id}/edit`)
                                },
                                },
                                ...(hasVariants
                                  ? [
                                      {
                                        icon: 'layers',
                                        label: 'Quản Lý Variant',
                                        color: 'indigo' as const,
                                        onClick: () => openVariantModal(product._id, product.name, product.variants),
                                      },
                                    ]
                                  : []),
                                {
                                  icon: 'delete',
                                  label: 'Xóa',
                                  color: 'red',
                                  onClick: () => handleDeleteProduct(product._id, product.name),
                                },
                              ]}
                            />
                          </td>
                        </tr>
                        {isExpanded && hasVariants && product.variants?.map((variant, variantIndex) => {
                          const variantPrice = variant.finalPrice || variant.price
                          const isValidPrice = variantPrice && typeof variantPrice === 'number' && !isNaN(variantPrice)
                          
                          
                          return (
                          <tr key={`${product._id}-variant-${variantIndex}`} className="bg-indigo-50/40 hover:bg-indigo-50/60 transition-all">
                            <td className="py-3 pl-4"></td>
                            <td className="py-3"></td>
                            <td className="py-3 pl-8">
                              <div className="flex items-center gap-3">
                                <div className="w-14 h-14 bg-slate-100 rounded flex-shrink-0 flex items-center justify-center border border-slate-200">
                                  {variant.images && Array.isArray(variant.images) && variant.images.length > 0 && variant.images[0]?.url ? (
                                    <img
                                      src={variant.images[0].url}
                                      alt={variant.name || 'Variant'}
                                      className="w-full h-full rounded object-cover"
                                      onError={(e) => {
                                        console.warn(`Failed to load variant image: ${variant.images?.[0]?.url}`)
                                        e.currentTarget.style.display = 'none'
                                      }}
                                    />
                                  ) : (
                                    <span className="material-symbols-outlined text-slate-300 text-2xl">image_not_supported</span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-slate-700">
                                    {variant.name || `Variant ${variantIndex + 1}`}
                                  </p>
                                  {variant.attributes && Object.entries(variant.attributes).map(([key, value]) => (
                                    <p key={key} className="text-xs text-slate-500">• {value}</p>
                                  ))}
                                  <p className="text-xs text-slate-400 mt-0.5">SKU: {variant.sku}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3"></td>
                            <td className="py-3">
                              <span className="font-bold text-indigo-600">
                                {isValidPrice ? formatVND(variantPrice) : 'N/A'}
                              </span>
                            </td>
                            <td className="py-3">
                              <span className="text-sm font-semibold text-slate-700">{variant.stock || 0}</span>
                            </td>
                            <td className="py-3">
                              <span className={`inline-block px-2.5 py-1 rounded text-xs font-bold ${
                                variant.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                variant.status === 'inactive' ? 'bg-slate-100 text-slate-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {variant.status === 'active' ? 'Hoạt động' : variant.status === 'inactive' ? 'Không' : 'Ngừng'}
                              </span>
                            </td>
                            <td className="py-3 pr-6 text-right">
                              <button className="text-indigo-600 hover:text-indigo-700 font-semibold text-xs px-3 py-1 hover:bg-indigo-100 rounded transition-all">
                                Edit
                              </button>
                            </td>
                          </tr>
                        )
                        })}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div className="px-6 py-6 border-t border-slate-100 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
              Trước
            </button>

            <div className="flex items-center gap-1 flex-wrap">
              {totalPages <= 7 ? (
                // Show all pages if 7 or less
                Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                      currentPage === page
                        ? 'bg-indigo-600 text-white border border-indigo-500'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {page}
                  </button>
                ))
              ) : (
                // Show abbreviated pagination for many pages
                <>
                  <button
                    onClick={() => setCurrentPage(1)}
                    className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                      currentPage === 1
                        ? 'bg-indigo-600 text-white border border-indigo-500'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    1
                  </button>
                  {currentPage > 3 && <span className="text-slate-400 px-1">...</span>}
                  {Array.from(
                    { length: Math.min(3, totalPages - 2) },
                    (_, i) => Math.max(2, currentPage - 1) + i
                  )
                    .filter((p) => p < totalPages)
                    .map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                          currentPage === page
                            ? 'bg-indigo-600 text-white border border-indigo-500'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  {currentPage < totalPages - 2 && <span className="text-slate-400 px-1">...</span>}
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                      currentPage === totalPages
                        ? 'bg-indigo-600 text-white border border-indigo-500'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tiếp
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-indigo-900 text-white p-8 rounded-[2rem] relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-indigo-300 text-[10px] uppercase tracking-widest font-bold mb-4">Giá Trị Kho</p>
              <p className="text-2xl font-extrabold break-words">{formatVND(getInventoryValue())}</p>
              <div className="mt-8 flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-1 bg-white/10 rounded-lg">
                  {total} sản phẩm
                </span>
              </div>
            </div>
            <span
              className="material-symbols-outlined absolute -right-4 -bottom-4 text-[120px] opacity-10"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              account_balance_wallet
            </span>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-4">Danh Mục Hoạt Động</p>
            <p className="text-4xl font-extrabold text-slate-900">{products.filter((p) => p.isActive).length}</p>
            <div className="mt-8 flex items-center gap-3">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full border-2 border-white bg-indigo-200"></div>
                <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-300"></div>
                <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-400"></div>
              </div>
              <span className="text-xs text-slate-500">Đang bán trực tuyến</span>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-4">Cảnh Báo Kho</p>
              <p className="text-4xl font-extrabold text-red-600">{getLowStockCount()}</p>
            </div>
            <button className="mt-8 w-full py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-all text-sm">
              Xem Kho Thấp
            </button>
          </div>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        productName={deleteModal.productName}
        productCount={deleteModal.productCount}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isDeleting={deleteModal.isDeleting}
        isBulkDelete={deleteModal.isBulkDelete}
      />

      <VariantManagementModal
        isOpen={variantModal.isOpen}
        productName={variantModal.productName}
        variants={variantModal.variants}
        onClose={closeVariantModal}
      />
    </AdminLayout>
  )
}

export default AdminProducts
