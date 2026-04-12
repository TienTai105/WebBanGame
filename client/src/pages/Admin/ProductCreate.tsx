import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import AdminBreadcrumb from '../../components/admin/AdminBreadcrumb'
import DeleteConfirmationModal from '../../components/admin/DeleteConfirmationModal'
import EditVariantModal from '../../components/admin/EditVariantModal'
import RichTextEditor, { RichTextEditorHandle } from '../../components/admin/RichTextEditor'
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

// Extract YouTube Video ID from various URL formats
const extractYoutubeVideoId = (url: string): string => {
  if (!url) return ''
  
  if (url.includes('youtu.be/')) {
    return url.split('youtu.be/')[1]?.split('?')[0] || ''
  }
  
  if (url.includes('youtube.com/watch?v=')) {
    return url.split('youtube.com/watch?v=')[1]?.split('&')[0] || ''
  }
  
  if (url.includes('youtube.com/embed/')) {
    return url.split('youtube.com/embed/')[1]?.split('?')[0] || ''
  }
  
  return ''
}

interface ProductImage {
  url: string
  cloudinaryId?: string
  alt?: string
  isMain?: boolean
}

interface VideoTrailer {
  url: string
  cloudinaryId?: string
  alt?: string
  isMain?: boolean
}

interface Category {
  _id: string
  name: string
}

interface Genre {
  _id: string
  name: string
}

interface Platform {
  _id: string
  name: string
}

interface FormData {
  name: string
  sku: string
  description: string
  price: number
  cost?: number
  discount: number
  minPrice?: number
  maxPrice?: number
  categoryId: string
  isActive: boolean
  isBaseProduct?: boolean
  stock?: number
  genresId: string
  platformsId?: string
}

const ProductCreate: React.FC = () => {
  const navigate = useNavigate()
  const editorRef = useRef<RichTextEditorHandle>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [tags, setTags] = useState<string>('')
  const [specifications, setSpecifications] = useState<Record<string, string>>({})
  const [trailers, setTrailers] = useState<VideoTrailer[]>([])
  const [trailerUrl, setTrailerUrl] = useState<string>('')
  const [isEditingTrailer, setIsEditingTrailer] = useState(false)
  const [isDeleteTrailerConfirming, setIsDeleteTrailerConfirming] = useState(false)
  const [isAddingSpec, setIsAddingSpec] = useState(false)
  const [newSpecKey, setNewSpecKey] = useState('')
  const [newSpecValue, setNewSpecValue] = useState('')
  const [images, setImages] = useState<ProductImage[]>([])
  const [newImageUrl, setNewImageUrl] = useState<string>('')
  const [mainImageIndex, setMainImageIndex] = useState(0)

  // Common specification templates
  const commonSpecs = [
    'CPU Details',
    'GPU',
    'RAM',
    'Internal Storage',
    'Color',
    'Size',
    'Weight',
    'Connectivity',
    'Power Supply',
    'Display',
    'Battery',
    'Operating System',
    'Interface Ports',
    'Network Connection',
    'Warranty',
    'Special Features',
    'Release Date',
    'Publisher',
    'ESRB',
    'System',
    'Genre',
  ]

  // Variant management
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [deletingVariantIdx, setDeletingVariantIdx] = useState<number | null>(null)
  const [variantModal, setVariantModal] = useState<{
    isOpen: boolean
    index: number | null
    data: ProductVariant | null
    available?: number
    isAddMode?: boolean
  }>({ isOpen: false, index: null, data: null, isAddMode: false })

  // Collapsible sections
  const [isSpecificationsOpen, setIsSpecificationsOpen] = useState(true)
  const [isVariantsOpen, setIsVariantsOpen] = useState(true)

  const [formData, setFormData] = useState<FormData>({
    name: '',
    sku: '',
    description: '',
    price: 0,
    cost: 0,
    discount: 0,
    minPrice: 0,
    maxPrice: 0,
    categoryId: '',
    isActive: true,
    isBaseProduct: false,
    stock: 0,
    genresId: '',
    platformsId: '',
  })

  // Fetch categories, genres, platforms
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [catRes, genreRes, platformRes] = await Promise.all([
          adminApiCall<any>('/categories'),
          adminApiCall<any>('/genres'),
          adminApiCall<any>('/platforms'),
        ])

        let categoriesArray: Category[] = []
        if (Array.isArray(catRes.data)) {
          categoriesArray = catRes.data
        } else if (catRes.data?.data && Array.isArray(catRes.data.data)) {
          categoriesArray = catRes.data.data
        }
        setCategories(categoriesArray)

        let genresArray: Genre[] = []
        if (Array.isArray(genreRes.data)) {
          genresArray = genreRes.data
        } else if (genreRes.data?.data && Array.isArray(genreRes.data.data)) {
          genresArray = genreRes.data.data
        }
        setGenres(genresArray)

        let platformsArray: Platform[] = []
        if (Array.isArray(platformRes.data)) {
          platformsArray = platformRes.data
        } else if (platformRes.data?.data && Array.isArray(platformRes.data.data)) {
          platformsArray = platformRes.data.data
        }
        setPlatforms(platformsArray)
      } catch (err) {
        console.error('Error loading metadata:', err)
      }
    }

    fetchMetadata()
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

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms((prev) => {
      const updated = prev.includes(platformId)
        ? prev.filter((id) => id !== platformId)
        : [...prev, platformId]
      return updated
    })
  }

  const handleGenreToggle = (genreId: string) => {
    setSelectedGenres((prev) => {
      const updated = prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId]
      return updated
    })
  }

  const handleAddTrailer = () => {
    if (!trailerUrl.trim()) {
      errorToast('Vui lòng nhập đường dẫn YouTube')
      return
    }

    const videoId = extractYoutubeVideoId(trailerUrl)
    if (!videoId) {
      errorToast('Đường dẫn YouTube không hợp lệ')
      return
    }

    const embedUrl = `https://www.youtube.com/embed/${videoId}`
    setTrailers([{
      url: embedUrl,
      alt: 'Product Trailer',
      isMain: true
    }])
    setTrailerUrl('')
    setIsEditingTrailer(false)
    successToast('Thêm trailer thành công')
  }

  const handleDeleteTrailer = () => {
    setIsDeleteTrailerConfirming(true)
  }

  const confirmDeleteTrailer = () => {
    setTrailers([])
    setTrailerUrl('')
    setIsEditingTrailer(false)
    setIsDeleteTrailerConfirming(false)
    successToast('Xóa trailer thành công')
  }

  const handleAddImage = () => {
    if (!newImageUrl.trim()) {
      errorToast('Vui lòng nhập đường dẫn hình ảnh')
      return
    }

    const newImage: ProductImage = {
      url: newImageUrl,
      alt: `Product image ${images.length + 1}`,
      isMain: images.length === 0,
    }
    setImages([...images, newImage])
    setNewImageUrl('')
    successToast('Thêm hình ảnh thành công')
  }

  const handleDeleteImage = (idx: number) => {
    const updatedImages = images.filter((_, i) => i !== idx)
    
    if (mainImageIndex >= updatedImages.length) {
      setMainImageIndex(Math.max(0, updatedImages.length - 1))
    }
    
    const newImages = updatedImages.map((img, i) => ({
      ...img,
      isMain: i === (mainImageIndex >= updatedImages.length ? updatedImages.length - 1 : mainImageIndex)
    }))
    
    setImages(newImages)
    successToast('Xóa hình ảnh thành công')
  }

  const handleSetMainImage = (idx: number) => {
    setMainImageIndex(idx)
    const updatedImages = images.map((img, i) => ({
      ...img,
      isMain: i === idx
    }))
    setImages(updatedImages)
    successToast('Đặt hình ảnh chính thành công')
  }

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const MAX_FILE_SIZE = 5 * 1024 * 1024
    const validFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) {
        errorToast('Vui lòng chọn file hình ảnh')
        return false
      }
      if (file.size > MAX_FILE_SIZE) {
        errorToast(`${file.name} quá lớn (${(file.size / 1024 / 1024).toFixed(1)}MB > 5MB)`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    uploadImagesToServer(validFiles)
    e.target.value = ''
  }

  const uploadImagesToServer = async (filesToUpload: File[]) => {
    try {
      const token = localStorage.getItem('adminToken')
      console.log('Token from localStorage:', token ? 'EXISTS' : 'MISSING')
      
      const formDataToUpload = new FormData()
      filesToUpload.forEach(file => {
        formDataToUpload.append('images', file)
      })

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataToUpload,
        headers: {
          'Authorization': `Bearer ${token || ''}`,
        }
      })

      const result = await response.json()
      console.log('Upload response:', result)

      if (!response.ok) {
        throw new Error(result.message || 'Upload failed')
      }

      if (!result.data || !Array.isArray(result.data)) {
        throw new Error('Invalid response format from server')
      }

      const newImages: ProductImage[] = result.data.map((img: any, idx: number) => ({
        url: img.url,
        alt: `Product image ${images.length + idx + 1}`,
        isMain: images.length + idx === 0,
      }))

      console.log('New images to add:', newImages)
      setImages([...images, ...newImages])
      successToast(`Uploaded ${newImages.length} image(s) successfully`)
    } catch (err) {
      console.error('Upload error:', err)
      errorToast(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  // Specifications handlers
  const handleSpecificationChange = (key: string, newKey: string, value: string) => {
    const newSpecs = { ...specifications }
    if (key !== newKey) {
      delete newSpecs[key]
    }
    newSpecs[newKey] = value
    setSpecifications(newSpecs)
  }

  const handleRemoveSpecification = (key: string) => {
    const newSpecs = { ...specifications }
    delete newSpecs[key]
    setSpecifications(newSpecs)
  }

  const handleAddNewSpecification = (newKey: string, newValue: string) => {
    if (!newKey.trim() || !newValue.trim()) {
      errorToast('Vui lòng nhập cả key và value')
      return
    }
    if (specifications[newKey]) {
      errorToast(`Specification "${newKey}" đã tồn tại`)
      return
    }
    const newSpecs = { ...specifications, [newKey]: newValue }
    setSpecifications(newSpecs)
    setIsAddingSpec(false)
    setNewSpecKey('')
    setNewSpecValue('')
    successToast(`Thêm specification "${newKey}" thành công`)
  }

  const handleAddQuickSpec = (specName: string) => {
    if (specifications[specName]) {
      errorToast(`"${specName}" đã tồn tại`)
      return
    }
    setNewSpecKey(specName)
    setIsAddingSpec(true)
  }

  // Variant management handlers
  const handleAddVariant = () => {
    if (variantModal.data && variantModal.index === null) {
      if (!variantModal.data.name.trim()) {
        errorToast('Tên variant không được để trống')
        return
      }
      if (variantModal.data.price <= 0) {
        errorToast('Giá phải lớn hơn 0')
        return
      }

      let variant = { ...variantModal.data } as any
      if (!variant.sku.trim()) {
        variant.sku = `${formData.sku}-${variant.name}`.toUpperCase().replace(/\s+/g, '-')
      }
      variant.available = variantModal.available || 0

      setVariants([...variants, variant])
      closeVariantModal()
      successToast('Thêm variant thành công')
    } else if (variantModal.data && variantModal.index !== null) {
      if (!variantModal.data.name.trim()) {
        errorToast('Tên variant không được để trống')
        return
      }
      if (!variantModal.data.sku.trim()) {
        errorToast('SKU không được để trống')
        return
      }
      if (variantModal.data.price <= 0) {
        errorToast('Giá phải lớn hơn 0')
        return
      }

      const updated = [...variants]
      updated[variantModal.index] = variantModal.data
      setVariants(updated)

      closeVariantModal()
      successToast('Cập nhật variant thành công')
    }
  }

  const openAddVariantModal = () => {
    const newVariant: ProductVariant = {
      sku: '',
      name: '',
      attributes: {},
      price: 0,
      cost: 0,
      discount: 0,
      finalPrice: 0,
      status: 'active',
      images: []
    }
    setVariantModal({ isOpen: true, index: null, data: newVariant, available: 0, isAddMode: true })
  }

  const closeVariantModal = () => {
    setVariantModal({ isOpen: false, index: null, data: null, available: 0, isAddMode: false })
  }

  const handleDeleteVariant = (idx: number) => {
    setDeletingVariantIdx(idx)
  }

  const confirmDeleteVariant = () => {
    if (deletingVariantIdx !== null) {
      const updated = variants.filter((_, i) => i !== deletingVariantIdx)
      setVariants(updated)
      setDeletingVariantIdx(null)
      successToast('Xóa variant thành công')
    }
  }

  const openEditVariantModal = (idx: number) => {
    const variant = { ...variants[idx] }
    if (!variant.attributes || typeof variant.attributes !== 'object') {
      variant.attributes = {}
    }
    setVariantModal({ 
      isOpen: true, 
      index: idx, 
      data: variant, 
      available: (variant as any).available || 0,  // Lấy stock từ variant
      isAddMode: false 
    })
  }

  const handleVariantModalChange = (field: keyof ProductVariant, value: any) => {
    if (variantModal.data) {
      const updated = { ...variantModal.data, [field]: value }
      if (field === 'price' || field === 'discount') {
        const price = field === 'price' ? value : updated.price
        const discount = field === 'discount' ? value : updated.discount
        updated.finalPrice = price - (price * discount) / 100
      }
      setVariantModal({ ...variantModal, data: updated })
    }
  }

  const handleVariantAvailableChange = (value: number) => {
    setVariantModal({ ...variantModal, available: value })
  }

  const handleVariantImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !variantModal.data) return

    const MAX_FILE_SIZE = 5 * 1024 * 1024
    const validFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) {
        errorToast('Vui lòng chọn file hình ảnh')
        return false
      }
      if (file.size > MAX_FILE_SIZE) {
        errorToast(`${file.name} quá lớn`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    try {
      const formDataToUpload = new FormData()
      validFiles.forEach(file => {
        formDataToUpload.append('images', file)
      })

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataToUpload,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`,
        }
      })

      const result = await response.json()

      if (!response.ok) throw new Error(result.message || 'Upload failed')

      const newImages = result.data.map((img: any) => ({
        url: img.url,
        alt: 'Variant image'
      }))

      const updated = {
        ...variantModal.data,
        images: [...(variantModal.data.images || []), ...newImages]
      }
      setVariantModal({ ...variantModal, data: updated })
      successToast('Upload ảnh thành công')
    } catch (err) {
      console.error('Upload error:', err)
      errorToast(err instanceof Error ? err.message : 'Upload failed')
    }
    e.target.value = ''
  }

  const handleRemoveVariantImage = (idx: number) => {
    if (variantModal.data && variantModal.data.images) {
      const updated = {
        ...variantModal.data,
        images: variantModal.data.images.filter((_, i) => i !== idx)
      }
      setVariantModal({ ...variantModal, data: updated })
    }
  }

  const handleAddAttributeFieldToVariant = () => {
    if (variantModal.data) {
      const updated = {
        ...variantModal.data,
        attributes: { ...variantModal.data.attributes, '': '' }
      }
      setVariantModal({ ...variantModal, data: updated })
    }
  }

  const handleRemoveAttributeFieldFromVariant = (key: string) => {
    if (variantModal.data && variantModal.data.attributes) {
      const updated = { ...variantModal.data }
      const newAttributes = { ...updated.attributes }
      delete newAttributes[key]
      updated.attributes = newAttributes
      setVariantModal({ ...variantModal, data: updated })
    }
  }

  const handleAttributeChangeInVariant = (oldKey: string, newKey: string, value: string) => {
    if (variantModal.data && variantModal.data.attributes) {
      const updated = { ...variantModal.data }
      const newAttributes = { ...updated.attributes }
      if (oldKey !== newKey) {
        delete newAttributes[oldKey]
      }
      newAttributes[newKey] = value
      updated.attributes = newAttributes
      setVariantModal({ ...variantModal, data: updated })
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
      if ((!variants || variants.length === 0) && formData.price <= 0) {
        errorToast('Giá phải lớn hơn 0')
        return
      }
      if (variants && variants.length > 0) {
        const invalidVariant = variants.find(v => !v.price || v.price <= 0)
        if (invalidVariant) {
          errorToast(`Variant "${invalidVariant.name}" có giá không hợp lệ`)
          return
        }
      }

      setIsSaving(true)
      
      // Extract HTML from Quill editor before saving
      const htmlDescription = editorRef.current?.getHtml() || formData.description
      
      const createPayload = {
        ...formData,
        description: htmlDescription,  // Use extracted HTML instead of Delta
        genres: selectedGenres,
        platforms: selectedPlatforms,
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
        specifications,
        trailers,
        images,
        variants,
      }

      // Log payload để debug
      console.log('🔍 Create product payload:', {
        name: createPayload.name,
        sku: createPayload.sku,
        price: createPayload.price,
        categoryId: createPayload.categoryId,
        description: createPayload.description ? 'EXISTS' : 'MISSING',
        descriptionLength: createPayload.description?.length || 0,
      })

      const { error } = await adminApiCall('/admin/products', {
        method: 'POST',
        body: JSON.stringify(createPayload),
      })

      if (error) throw error

      successToast('Tạo sản phẩm mới thành công')
      navigate('/admin/products')
    } catch (err) {
      console.error('Error creating product:', err)
      errorToast(err instanceof Error ? err.message : 'Failed to create product')
    } finally {
      setIsSaving(false)
    }
  }

  const finalPrice = formData.price - (formData.price * formData.discount) / 100

  return (
    <AdminLayout>
      <div className="p-8 max-w-8xl mx-auto space-y-8 flex-1">
        {/* Header with Title & Global Actions */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <AdminBreadcrumb items={[{ label: 'Products', href: '/admin/products' }, { label: 'New Product' }]} />
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
              Add New Product
            </h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-indigo-100 rounded-full">
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">New Product</span>
              </div>
              <span className="text-sm text-slate-500">Create a new product</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/products')}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Back
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-500 text-white font-bold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
              {isSaving ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </div>

        {/* Main Content - Bento Grid */}
        <div className="grid grid-cols-12 gap-8">
          {/* Left Column: Primary Data (7 cols) */}
          <div className="col-span-12 lg:col-span-7 space-y-8">
            {/* General Information Card */}
            <section className="bg-white rounded-xl p-8 shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600">info</span>
                General Information
              </h3>
              <div className="space-y-6">
                {/* Product Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-600 mb-2">
                    Product Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium hover:border-slate-300"
                    placeholder="Enter product name"
                  />
                </div>

                {/* Slug & SKU Grid */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-600 mb-2">
                      Slug
                    </label>
                    <input
                      type="text"
                      value={formData.name
                        .toLowerCase()
                        .replace(/\s+/g, '-')
                        .replace(/[^\w-]/g, '')}
                      disabled
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-600 mb-2">
                      SKU
                    </label>
                    <input
                      type="text"
                      name="sku"
                      value={formData.sku}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono hover:border-slate-300"
                      placeholder="Product SKU"
                    />
                  </div>
                </div>
                
                {/* Description */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-600 mb-2">
                    Description
                  </label>
                  <RichTextEditor
                    ref={editorRef}
                    value={formData.description}
                    onChange={(value) => setFormData({ ...formData, description: value })}
                    placeholder="Enter product description with formatting (bold, italic, images, links, etc.)..."
                    height="400px"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  {/* Category Dropdown */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">
                      Category
                    </label>
                    <div className="relative">
                      <select
                        name="categoryId"
                        value={formData.categoryId}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer hover:border-slate-300 transition-all"
                      >
                        <option value="">-- Select Category --</option>
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat._id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-2.5 text-slate-400 pointer-events-none text-xl">expand_more</span>
                    </div>
                  </div>
                  
                  {/* Tags */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="e.g. gaming, fast, portable"
                      className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all hover:border-slate-300"
                    />
                    {tags && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {tags.split(',').filter(t => t.trim()).map((tag, idx) => (
                          <span key={idx} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Genres & Platforms Grid */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Genres */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">
                      Genres
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {genres.map((genre) => (
                        <button
                          key={genre._id}
                          onClick={() => handleGenreToggle(genre._id)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                            selectedGenres.includes(genre._id)
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {genre.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Platforms */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">
                      Platforms
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {platforms.map((platform) => (
                        <button
                          key={platform._id}
                          onClick={() => handlePlatformToggle(platform._id)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                            selectedPlatforms.includes(platform._id)
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {platform.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Pricing Card */}
            <section className="bg-white rounded-xl p-8 shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600">payments</span>
                Pricing
              </h3>
              
              <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-600 font-bold mb-2">Base Price (₫)</p>
                <input
                  name="price"
                  value={formData.price || ''}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold text-lg hover:border-slate-400"
                  type="number"
                  min="0"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-600 mb-2">
                    Discount (%)
                  </label>
                  <input
                    name="discount"
                    value={formData.discount || ''}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all hover:border-slate-300"
                    type="number"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-600 mb-2">
                    Final Price (₫)
                  </label>
                  <div className="w-full bg-indigo-50 border border-indigo-300 rounded-lg px-4 py-3 text-indigo-600 font-bold text-lg">
                    {formatVND(finalPrice)}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-600 mb-2">
                  Cost Price (₫)
                </label>
                <input
                  type="number"
                  name="cost"
                  value={formData.cost || ''}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all hover:border-slate-300"
                  
                />
              </div>

              <div className="mt-6">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-600 mb-2">
                  Stock (units)
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock || ''}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all hover:border-slate-300"
                  min="0"
                />
              </div>

              <div className="grid grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-600 mb-2">
                    Min Price (₫)
                  </label>
                  <input
                    type="number"
                    name="minPrice"
                    value={formData.minPrice || ''}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all hover:border-slate-300"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-600 mb-2">
                    Max Price (₫)
                  </label>
                  <input
                    type="number"
                    name="maxPrice"
                    value={formData.maxPrice || ''}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all hover:border-slate-300"
                    min="0"
                  />
                </div>
              </div>
            </section>

            {/* Variants Section */}
            <section className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                <div 
                  className="flex items-center gap-2 cursor-pointer group"
                  onClick={() => setIsVariantsOpen(!isVariantsOpen)}
                >
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-600">layers</span>
                    Regional Variants
                  </h3>
                  <button className="p-1 hover:bg-slate-100 rounded transition-all">
                    <span className="material-symbols-outlined text-slate-600 group-hover:text-slate-900 text-lg">
                      {isVariantsOpen ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                </div>
                <button
                  onClick={openAddVariantModal}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-md shadow-indigo-200"
                >
                  <span className="material-symbols-outlined text-base">add_circle</span>
                  Add Variant
                </button>
              </div>

              {isVariantsOpen && (
              <>
              {variants && variants.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-slate-600 w-28">Variant</th>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-slate-600 text-right">Price</th>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-slate-600 text-right">Cost</th>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-slate-600 text-right">Profit/Unit</th>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-slate-600 text-right">Stock</th>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-slate-600 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {variants.map((variant, idx) => {
                        const variantPrice = variant.price || formData.price
                        const variantCost = variant.cost || 0
                        const profitPerUnit = variantPrice - variantCost
                        const profitColor = profitPerUnit >= 0 ? 'text-emerald-600' : 'text-red-600'
                        
                        return (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4">
                              <span className="font-semibold text-slate-900">{variant.name || `V${idx + 1}`}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-slate-700 font-medium">{formatVND(variantPrice)}</span>
                            </td>
                            <td className="px-6 py-4 text-right text-slate-600 text-xs">{formatVND(variantCost)}</td>
                            <td className={`px-6 py-4 text-right font-semibold text-sm ${profitColor}`}>{formatVND(profitPerUnit)}</td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-slate-700 font-medium text-sm">
                                {(variant as any).available || 0} units
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100">
                                <button
                                  onClick={() => openEditVariantModal(idx)}
                                  className="text-indigo-600 hover:text-indigo-700 p-1"
                                  title="Edit variant"
                                >
                                  <span className="material-symbols-outlined text-base">edit</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteVariant(idx)}
                                  className="text-red-600 hover:text-red-700 p-1"
                                  title="Delete variant"
                                >
                                  <span className="material-symbols-outlined text-base">trash</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              </>
              )}
            </section>

            {/* Specifications Card */}
            <section className="bg-white rounded-xl p-8 shadow-sm border border-slate-100">
              <div 
                className="flex items-center justify-between mb-6 cursor-pointer group"
                onClick={() => setIsSpecificationsOpen(!isSpecificationsOpen)}
              >
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-600">description</span>
                  Specifications & Details
                </h3>
                <button className="p-1 hover:bg-slate-100 rounded transition-all">
                  <span className="material-symbols-outlined text-slate-600 group-hover:text-slate-900">
                    {isSpecificationsOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
              </div>
              {isSpecificationsOpen && (
              <div className="space-y-6">
                {/* Status */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">
                    Status
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-lg hover:bg-slate-50 transition-all">
                    <div className="relative inline-flex">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        className="w-5 h-5 text-indigo-600 rounded accent-indigo-600"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg" style={{ color: formData.isActive ? '#10b981' : '#ef4444' }}>
                        {formData.isActive ? 'check_circle' : 'cancel'}
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {formData.isActive ? 'Active Product' : 'Inactive Product'}
                      </span>
                    </div>
                  </label>

                  {/* Base Product for Seeding */}
                  <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-lg hover:bg-indigo-50 transition-all mt-2">
                    <div className="relative inline-flex">
                      <input
                        type="checkbox"
                        name="isBaseProduct"
                        checked={formData.isBaseProduct || false}
                        onChange={handleInputChange}
                        className="w-5 h-5 text-indigo-600 rounded accent-indigo-600"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg" style={{ color: formData.isBaseProduct ? '#6366f1' : '#9ca3af' }}>
                        {formData.isBaseProduct ? 'library_add' : 'layers'}
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        Mark as Base Product (dùng để nhân bản)
                      </span>
                      <span className="material-symbols-outlined text-xs text-slate-400 ml-1" title="This product will be used as template for variant seeding">
                        info
                      </span>
                    </div>
                  </label>
                </div>

                {/* Specifications */}
                <div className="pt-4 border-t border-slate-200">
                  <div className="mb-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">
                        Product Specifications
                      </label>
                      <p className="text-xs text-slate-500 mb-4">Define product features and characteristics</p>
                    </div>

                    {/* Quick Add Common Specs */}
                    <div className="mb-6 p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                      <p className="text-xs font-bold text-amber-900 uppercase tracking-widest mb-3">Quick Add Specifications</p>
                      <div className="flex flex-wrap gap-2">
                        {commonSpecs.map((spec) => (
                          <button
                            key={spec}
                            onClick={() => handleAddQuickSpec(spec)}
                            disabled={specifications[spec] ? true : false}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              specifications[spec]
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-white text-amber-700 border border-amber-300 hover:bg-amber-100 active:scale-95'
                            }`}
                          >
                            + {spec}
                          </button>
                        ))}
                      </div>
                    </div>

                    {!isAddingSpec && (
                      <button
                        onClick={() => {
                          setIsAddingSpec(true)
                          setNewSpecKey('')
                          setNewSpecValue('')
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 hover:shadow-lg transition-all duration-200 active:scale-95"
                      >
                        <span className="material-symbols-outlined text-lg">add_circle</span>
                        Add Custom Specification
                      </button>
                    )}
                  </div>

                  {isAddingSpec && (
                    <div className="mb-6 p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-200 shadow-sm">
                      <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-4">
                        {newSpecKey ? `Adding: ${newSpecKey}` : 'Enter specification details'}
                      </p>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-2">Specification Name</label>
                            <input
                              type="text"
                              value={newSpecKey}
                              onChange={(e) => setNewSpecKey(e.target.value)}
                              placeholder="e.g., CPU, RAM, Storage"
                              disabled={commonSpecs.includes(newSpecKey) && newSpecKey !== ''}
                              className="w-full px-3 py-2.5 bg-white border border-indigo-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all disabled:bg-indigo-100"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-2">Value</label>
                            <input
                              type="text"
                              value={newSpecValue}
                              onChange={(e) => setNewSpecValue(e.target.value)}
                              placeholder="Enter value..."
                              autoFocus
                              className="w-full px-3 py-2.5 bg-white border border-indigo-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleAddNewSpecification(newSpecKey, newSpecValue)
                                }
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => {
                              setIsAddingSpec(false)
                              setNewSpecKey('')
                              setNewSpecValue('')
                            }}
                            className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              handleAddNewSpecification(newSpecKey, newSpecValue)
                            }}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all active:scale-95"
                          >
                            Add Specification
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {specifications && Object.keys(specifications).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(specifications).map(([key, value]: [string, any]) => (
                        <div
                          key={key}
                          className="group p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md hover:bg-white transition-all duration-200 flex items-center gap-4"
                        >
                          <div className="flex-shrink-0 px-3 py-2 bg-indigo-100 rounded-lg border border-indigo-200 min-w-fit">
                            <input
                              type="text"
                              value={key}
                              onChange={(e) => handleSpecificationChange(key, e.target.value, value as string)}
                              placeholder="Key"
                              className="bg-transparent text-indigo-700 font-semibold text-sm placeholder-indigo-400 outline-none w-full"
                            />
                          </div>

                          <div className="text-slate-300 font-bold text-lg">→</div>

                          <div className="flex-1">
                            <textarea
                              value={value as string}
                              onChange={(e) => handleSpecificationChange(key, key, e.target.value)}
                              placeholder="Value"
                              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-700 text-sm placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-y transition-all"
                            />
                          </div>

                          <button
                            onClick={() => {
                              handleRemoveSpecification(key)
                              successToast('Xóa specification thành công')
                            }}
                            className="flex-shrink-0 p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="Delete specification"
                          >
                            <span className="material-symbols-outlined text-base">trash</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 px-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border-2 border-dashed border-slate-300 text-center">
                      <div className="flex justify-center mb-3">
                        <span className="material-symbols-outlined text-4xl text-slate-300">inventory_2</span>
                      </div>
                      <p className="text-slate-600 font-medium mb-1">No specifications yet</p>
                      <p className="text-slate-500 text-sm">Click "Add Specification" to start defining product features</p>
                    </div>
                  )}
                </div>
              </div>
              )}
            </section>
          </div>

          {/* Right Column: Secondary Data (5 cols) */}
          <div className="col-span-12 lg:col-span-5 space-y-8 lg:sticky lg:top-8 lg:self-start">
            {/* Media Gallery */}
            <section className="bg-white rounded-xl p-8 shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-900">Media Gallery</h3>
              </div>

              {images && images.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className="aspect-square rounded-lg overflow-hidden group relative"
                      >
                        <img
                          src={img.url}
                          alt={img.alt || `Product image ${idx + 1}`}
                          className={`w-full h-full object-cover transition-all ${
                            mainImageIndex === idx ? 'ring-2 ring-indigo-500' : ''
                          }`}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-1">
                          {mainImageIndex !== idx && (
                            <button
                              onClick={() => handleSetMainImage(idx)}
                              className="p-1.5 bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Set as main"
                            >
                              <span className="material-symbols-outlined text-base text-slate-900">star</span>
                            </button>
                          )}
                          {mainImageIndex === idx && (
                            <span className="px-2 py-1 bg-indigo-600 text-white text-xs font-bold rounded">Main</span>
                          )}
                          <button
                            onClick={() => handleDeleteImage(idx)}
                            className="p-1.5 bg-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-white"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-base">close</span>
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    <div className="aspect-square rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center hover:bg-slate-50 cursor-pointer group">
                      <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                        <span className="material-symbols-outlined text-slate-400 text-3xl group-hover:text-slate-600">cloud_upload</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-600 mb-2">
                      Add New Image URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        placeholder="Paste image URL here..."
                        className="flex-1 bg-white border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddImage()}
                      />
                      <button
                        onClick={handleAddImage}
                        className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all active:scale-95"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                    <span className="material-symbols-outlined text-slate-400 text-4xl block mb-2">image</span>
                    <p className="text-sm text-slate-500 mb-4">No images. Add images for the product.</p>
                  </div>

                  <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-600 mb-2">
                      Add First Image
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        placeholder="Paste image URL here..."
                        className="flex-1 bg-white border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddImage()}
                      />
                      <button
                        onClick={handleAddImage}
                        className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all active:scale-95"
                      >
                        Add
                      </button>
                    </div>

                    <div className="border-t border-slate-300 pt-3 mt-3">
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-600 mb-2">
                        Or Upload Files
                      </label>
                      <label className="block border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-100 cursor-pointer transition-all">
                        <span className="material-symbols-outlined text-slate-400 text-3xl block mb-2">cloud_upload</span>
                        <span className="text-xs text-slate-600 font-semibold">Click to upload images</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Video Trailer */}
            <section className="bg-white rounded-xl p-8 shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-900">Video Trailer</h3>
              </div>

              {trailers && trailers.length > 0 ? (
                <div className="space-y-4">
                  <div className="rounded-lg overflow-hidden bg-black aspect-video flex items-center justify-center">
                    {trailers[0]?.url.includes('youtube.com/embed') ? (
                      <iframe
                        src={trailers[0].url}
                        className="w-full h-full"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    ) : (
                      <video
                        src={trailers[0]?.url}
                        controls
                        className="w-full h-full"
                      />
                    )}
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Trailer Details</p>
                    <p className="text-sm text-slate-700">
                      <span className="font-semibold">{trailers[0]?.alt || 'Product Trailer'}</span>
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsEditingTrailer(!isEditingTrailer)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-100 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-200 transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                      Replace
                    </button>
                    <button
                      onClick={handleDeleteTrailer}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-100 text-red-600 rounded-lg text-sm font-bold hover:bg-red-200 transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                      Delete
                    </button>
                  </div>

                  {isEditingTrailer && (
                    <div className="space-y-3 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                      <label className="block text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">
                        YouTube URL mới
                      </label>
                      <input
                        type="text"
                        value={trailerUrl}
                        onChange={(e) => setTrailerUrl(e.target.value)}
                        placeholder="https://youtu.be/... hoặc https://youtube.com/watch?v=..."
                        className="w-full bg-white border border-indigo-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleAddTrailer}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all active:scale-95"
                        >
                          <span className="material-symbols-outlined text-base">check</span>
                          Update
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingTrailer(false)
                            setTrailerUrl('')
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200 transition-all active:scale-95"
                        >
                          <span className="material-symbols-outlined text-base">close</span>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                    <span className="material-symbols-outlined text-slate-400 text-4xl block mb-2">video_library</span>
                    <p className="text-sm text-slate-500 mb-4">No trailer. Add a YouTube video.</p>
                  </div>

                  <div className="space-y-3 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <label className="block text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">
                      YouTube URL
                    </label>
                    <input
                      type="text"
                      value={trailerUrl}
                      onChange={(e) => setTrailerUrl(e.target.value)}
                      placeholder="https://youtu.be/... hoặc https://youtube.com/watch?v=..."
                      className="w-full bg-white border border-indigo-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTrailer()}
                    />
                    <button
                      onClick={handleAddTrailer}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-base">add</span>
                      Add Trailer
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* Delete Trailer Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteTrailerConfirming}
        productName="Video Trailer"
        onConfirm={confirmDeleteTrailer}
        onCancel={() => setIsDeleteTrailerConfirming(false)}
        isDeleting={false}
      />

      {/* Delete Variant Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deletingVariantIdx !== null}
        productName={deletingVariantIdx !== null ? `Variant: ${variants[deletingVariantIdx]?.name}` : ''}
        onConfirm={confirmDeleteVariant}
        onCancel={() => setDeletingVariantIdx(null)}
        isDeleting={false}
      />

      {/* Variant Modal - Add/Edit Mode */}
      <EditVariantModal
        isOpen={variantModal.isOpen}
        isAddMode={variantModal.isAddMode}
        variantModal={variantModal}
        formatVND={formatVND}
        onClose={closeVariantModal}
        onSave={handleAddVariant}
        onVariantChange={(field, value) => handleVariantModalChange(field as keyof ProductVariant, value)}
        onAvailableChange={handleVariantAvailableChange}
        onImageFileUpload={handleVariantImageFileUpload}
        onRemoveImage={handleRemoveVariantImage}
        onAddAttribute={handleAddAttributeFieldToVariant}
        onRemoveAttribute={handleRemoveAttributeFieldFromVariant}
        onAttributeChange={handleAttributeChangeInVariant}
      />
    </AdminLayout>
  )
}

export default ProductCreate
