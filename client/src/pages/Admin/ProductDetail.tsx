import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import adminApiCall from '../../utils/adminApi'
import { errorToast, successToast } from '../../utils/toast'
import { ProductVariant } from '../../components/admin/VariantManagementModal'

// Format price to VND
const formatVND = (price: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price)
}

interface ProductImage {
  url: string
  cloudinaryId?: string
  alt?: string
  isMain?: boolean
}

interface Product {
  _id: string
  name: string
  sku: string
  description: string
  price: number
  finalPrice: number
  discount?: number
  images?: ProductImage[]
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

interface FormData {
  name: string
  sku: string
  description: string
  price: number
  discount: number
  categoryId: string
  isActive: boolean
}

const ProductDetail: React.FC = () => {
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [mainImageIndex, setMainImageIndex] = useState(0)
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    sku: '',
    description: '',
    price: 0,
    discount: 0,
    categoryId: '',
    isActive: true,
  })

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return
      try {
        setIsLoading(true)
        const { data, error } = await adminApiCall<any>(`/admin/products/${productId}`)
        
        if (error) throw error
        
        const productData = Array.isArray(data) ? data[0] : data
        setProduct(productData)
        
        // Set form data
        setFormData({
          name: productData.name || '',
          sku: productData.sku || '',
          description: productData.description || '',
          price: productData.price || 0,
          discount: productData.discount || 0,
          categoryId:
            productData.categoryId && typeof productData.categoryId === 'object'
              ? productData.categoryId._id
              : typeof productData.categoryId === 'string'
                ? productData.categoryId
                : '',
          isActive: productData.isActive ?? true,
        })

        // Set main image index
        const mainIndex = productData.images?.findIndex((img: ProductImage) => img.isMain) ?? 0
        setMainImageIndex(Math.max(0, mainIndex))
      } catch (err) {
        console.error('❌ Error loading product:', err)
        errorToast(err instanceof Error ? err.message : 'Failed to load product')
        navigate('/admin/products')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProduct()
  }, [productId, navigate])

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await adminApiCall<any>('/categories')
        if (error) throw error
        
        let categoriesArray: Category[] = []
        if (Array.isArray(data)) {
          categoriesArray = data
        } else if (data?.data && Array.isArray(data.data)) {
          categoriesArray = data.data
        }
        setCategories(categoriesArray)
      } catch (err) {
        console.error('❌ Error loading categories:', err)
      }
    }

    fetchCategories()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked,
      })
    } else if (type === 'number') {
      setFormData({
        ...formData,
        [name]: parseFloat(value) || 0,
      })
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }
  }

  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        errorToast('Tên sản phẩm không được để trống')
        return
      }
      if (!formData.sku.trim()) {
        errorToast('SKU không được để trống')
        return
      }
      if (!formData.categoryId) {
        errorToast('Vui lòng chọn danh mục')
        return
      }
      if (formData.price <= 0) {
        errorToast('Giá phải lớn hơn 0')
        return
      }

      setIsSaving(true)
      const { error } = await adminApiCall(`/admin/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      })

      if (error) throw error
      
      successToast('Cập nhật sản phẩm thành công')
      navigate('/admin/products')
    } catch (err) {
      console.error('Error saving product:', err)
      errorToast(err instanceof Error ? err.message : 'Failed to save product')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-10 flex items-center justify-center h-screen">
          <div className="text-slate-500">Đang tải thông tin sản phẩm...</div>
        </div>
      </AdminLayout>
    )
  }

  if (!product) {
    return (
      <AdminLayout>
        <div className="p-10">
          <div className="text-slate-500">Không tìm thấy sản phẩm</div>
        </div>
      </AdminLayout>
    )
  }

  const finalPrice = formData.price - (formData.price * formData.discount) / 100

  return (
    <AdminLayout>
      <div className="p-10 space-y-8 flex-1">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <nav className="flex text-xs text-slate-400 mb-2 gap-2">
              <button onClick={() => navigate('/admin/products')} className="hover:text-indigo-600">
                Sản Phẩm
              </button>
              <span>/</span>
              <span className="text-indigo-600 font-medium">Chi Tiết Sản Phẩm</span>
            </nav>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Chi Tiết Sản Phẩm</h1>
          </div>
          <button
            onClick={() => navigate('/admin/products')}
            className="flex items-center gap-2 px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
          >
            <span className="material-symbols-outlined">close</span>
            Đóng
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images & Variants */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 p-8">
              <h2 className="text-lg font-bold text-slate-900 mb-6">Hình Ảnh Sản Phẩm</h2>
              
              {product.images && product.images.length > 0 ? (
                <div className="space-y-6">
                  {/* Main Image */}
                  <div className="bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center h-96">
                    {product.images[mainImageIndex]?.url ? (
                      <img
                        src={product.images[mainImageIndex].url}
                        alt={product.images[mainImageIndex].alt || product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-slate-300 text-6xl">image_not_supported</span>
                    )}
                  </div>

                  {/* Thumbnail Grid */}
                  {product.images.length > 1 && (
                    <div className="grid grid-cols-4 gap-3">
                      {product.images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setMainImageIndex(idx)}
                          className={`w-full aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                            mainImageIndex === idx
                              ? 'border-indigo-600 ring-2 ring-indigo-300'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {img.url ? (
                            <img src={img.url} alt={img.alt || `-${idx}`} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                              <span className="material-symbols-outlined text-slate-300 text-2xl">image_not_supported</span>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <span className="material-symbols-outlined text-5xl">image_not_supported</span>
                  <p className="text-sm">Không có hình ảnh</p>
                </div>
              )}
            </div>

            {/* Variants Section */}
            {product.variants && product.variants.length > 0 && (
              <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 p-8">
                <h2 className="text-lg font-bold text-slate-900 mb-6">Biến Thể Sản Phẩm</h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-4 py-3 font-semibold text-slate-700">SKU</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Tên</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Thuộc Tính</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Giá</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Tồn Kho</th>
                        <th className="px-4 py-3 font-semibold text-slate-700 text-right">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {product.variants.map((variant, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <code className="bg-slate-100 px-2 py-1 rounded text-xs">{variant.sku}</code>
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-900">{variant.name}</td>
                          <td className="px-4 py-3 text-xs text-slate-600">
                            {variant.attributes
                              ? Object.entries(variant.attributes)
                                  .map(([key, val]) => `${key}: ${val}`)
                                  .join(', ')
                              : '-'}
                          </td>
                          <td className="px-4 py-3 text-slate-900">
                            {variant.price ? formatVND(variant.price) : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              variant.stock && variant.stock > 0
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {variant.stock || 0}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm">
                              Sửa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Form */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
              <h2 className="text-lg font-bold text-slate-900 mb-6">Thông Tin Cơ Bản</h2>

              <div className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-xs uppercase tracking-widest font-bold text-slate-600 mb-2">
                    Tên Sản Phẩm
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    placeholder="Nhập tên sản phẩm"
                  />
                </div>

                {/* SKU */}
                <div>
                  <label className="block text-xs uppercase tracking-widest font-bold text-slate-600 mb-2">
                    SKU
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    placeholder="Nhập SKU"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs uppercase tracking-widest font-bold text-slate-600 mb-2">
                    Danh Mục
                  </label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm appearance-none cursor-pointer"
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Active Status */}
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
                    Kích hoạt sản phẩm
                  </label>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
              <h2 className="text-lg font-bold text-slate-900 mb-6">Giá Bán</h2>

              <div className="space-y-5">
                {/* Price */}
                <div>
                  <label className="block text-xs uppercase tracking-widest font-bold text-slate-600 mb-2">
                    Giá Gốc
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">₫</span>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>

                {/* Discount */}
                <div>
                  <label className="block text-xs uppercase tracking-widest font-bold text-slate-600 mb-2">
                    Giảm Giá (%)
                  </label>
                  <input
                    type="number"
                    name="discount"
                    value={formData.discount}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    placeholder="0"
                    min="0"
                    max="100"
                  />
                </div>

                {/* Final Price Display */}
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs uppercase tracking-widest font-bold text-slate-600 mb-2">Giá Sau Giảm</p>
                  <p className="text-2xl font-extrabold text-indigo-600">{formatVND(finalPrice)}</p>
                </div>
              </div>
            </div>

            {/* Stock Info */}
            {product && (
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl shadow-sm border border-slate-100 p-8">
                <h2 className="text-lg font-bold text-slate-900 mb-6">Tồn Kho</h2>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-extrabold text-slate-900">{product.stock || 0}</p>
                  <p className="text-slate-500">sản phẩm</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Description Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Mô Tả Sản Phẩm</h2>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
            rows={6}
            placeholder="Nhập mô tả sản phẩm..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 sticky bottom-0 bg-white/80 backdrop-blur py-6 px-10 -mx-10 border-t border-slate-100">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-br from-indigo-600 to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              check
            </span>
            {isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
          </button>

          <button
            onClick={() => navigate('/admin/products')}
            className="flex items-center gap-2 px-8 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all"
          >
            <span className="material-symbols-outlined">close</span>
            Hủy
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}

export default ProductDetail
