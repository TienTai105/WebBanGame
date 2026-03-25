import { FC, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/atomic'
import Button from '../components/atomic/Button'
import Checkbox from '../components/atomic/Checkbox'
import ConfirmDialog from '../components/modules/ConfirmDialog'
import ProfileSidebar from '../components/modules/ProfileSidebar'
import CustomSelect from '../components/ui/CustomSelect'
import { RadioGroup, RadioGroupItem } from '../components/ui/radio'
import { useProvinces } from '../hooks/useProvinces'
import { cn } from '../utils/cn'
import api from '../services/api'
import { successToast, errorToast} from '../utils/toast'

interface ShippingAddress {
  _id?: string
  name: string
  street: string
  city: string
  district: string
  ward: string
  zipCode: string
  isDefault: boolean
}

interface UserData {
  name: string
  avatar?: string
  role: 'customer' | 'staff' | 'admin'
}

const AddressBookPage: FC = () => {
  const navigate = useNavigate()
  const { provinces, getDistrictsByProvince, getWardsByDistrict } = useProvinces()
  
  // Address type options
  const addressTypeOptions = [
    { code: 'HOME', name: 'Nhà riêng' },
    { code: 'OFFICE', name: 'Văn phòng' },
    { code: 'OTHER', name: 'Khác' },
  ]

  const [user, setUser] = useState<UserData | null>(null)
  const [addresses, setAddresses] = useState<ShippingAddress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<number | ''>('')
  const [selectedDistrictCode, setSelectedDistrictCode] = useState<number | ''>('')
  const [selectedWardCode, setSelectedWardCode] = useState<number | ''>('')
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [deleteIdToConfirm, setDeleteIdToConfirm] = useState<string | null>(null)
  const [formData, setFormData] = useState<ShippingAddress>({
    name: 'HOME',
    street: '',
    city: '',
    district: '',
    ward: '',
    zipCode: '',
    isDefault: false,
  })

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      navigate('/login')
      return
    }

    fetchUserData()
  }, [navigate])

  const fetchUserData = async () => {
    try {
      const response = await api.get('/auth/me')
      const userData = response.data.data.user
      setUser(userData)
      // Get addresses from user data
      if (userData.shippingAddresses && Array.isArray(userData.shippingAddresses)) {
        setAddresses(userData.shippingAddresses)
        setIsLoading(false)
      } else {
        // If no addresses in user data, fetch separately
        fetchAddresses()
      }
    } catch (err) {
      console.error('Failed to fetch user data:', err)
      fetchAddresses()
    }
  }

  const fetchAddresses = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await api.get<{ success: boolean; data: ShippingAddress[] | { shippingAddresses: ShippingAddress[] } }>(
        '/user/shipping-addresses'
      )

      if (response.data.success) {
        const addressData = Array.isArray(response.data.data) 
          ? response.data.data 
          : response.data.data.shippingAddresses || []
        setAddresses(addressData)
      }
    } catch (err: any) {
      console.error('Failed to fetch addresses:', err)
      const errorMsg = err.response?.data?.message || 'Failed to load addresses'
      setError(errorMsg)
      // Try to get from user profile instead
      try {
        const userResponse = await api.get('/auth/me')
        const userData = userResponse.data.data.user
        if (userData.shippingAddresses && Array.isArray(userData.shippingAddresses)) {
          setAddresses(userData.shippingAddresses)
          setError(null)
        }
      } catch {
        errorToast(errorMsg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddNew = () => {
    setEditingId(null)
    setFormData({
      name: 'HOME',
      street: '',
      city: '',
      district: '',
      ward: '',
      zipCode: '',
      isDefault: addresses.length === 0,
    })
    setSelectedProvinceCode('')
    setSelectedDistrictCode('')
    setSelectedWardCode('')
    setShowForm(true)
  }

  const handleEdit = (address: ShippingAddress) => {
    setEditingId(address._id || null)
    setFormData(address)
    // Set province, district, and ward codes
    const provinceCode = provinces.find(p => p.name === address.city)?.code
    if (provinceCode) {
      setSelectedProvinceCode(provinceCode)
      const districtCode = getDistrictsByProvince(provinceCode).find(d => d.name === address.district)?.code
      if (districtCode) {
        setSelectedDistrictCode(districtCode)
        const wardCode = getWardsByDistrict(districtCode).find(w => w.name === address.ward)?.code
        if (wardCode) {
          setSelectedWardCode(wardCode)
        }
      }
    }
    setShowForm(true)
  }

  const handleDelete = (id: string | undefined) => {
    if (!id) return
    setDeleteIdToConfirm(id)
    setIsConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteIdToConfirm) return

    try {
      const response = await api.delete(`/user/shipping-address/${deleteIdToConfirm}`)

      if (response.data.success) {
        successToast('Xóa địa chỉ thành công')
        setAddresses(addresses.filter(addr => addr._id !== deleteIdToConfirm))
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to delete address'
      errorToast(errorMsg)
    } finally {
      setIsConfirmOpen(false)
      setDeleteIdToConfirm(null)
    }
  }

  const handleSetDefault = async (id: string | undefined) => {
    if (!id) return

    try {
      const addressToUpdate = addresses.find(addr => addr._id === id)
      if (!addressToUpdate) return

      const response = await api.put(`/user/shipping-address/${id}`, {
        ...addressToUpdate,
        isDefault: true,
      })

      if (response.data.success) {
        successToast('Đặt làm địa chỉ mặc định thành công')
        // Update local state instead of refetching
        setAddresses(addresses.map(addr => ({
          ...addr,
          isDefault: addr._id === id
        })))
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to update address'
      errorToast(errorMsg)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleAddressTypeChange = (type: number | string) => {
    setFormData(prev => ({
      ...prev,
      name: String(type),
    }))
  }

  const handleProvinceChange = (provinceCode: number | string) => {
    const code = Number(provinceCode)
    setSelectedProvinceCode(code)
    setSelectedDistrictCode('')
    setSelectedWardCode('')
    const province = provinces.find(p => p.code === code)
    if (province) {
      setFormData(prev => ({
        ...prev,
        city: province.name,
        district: '',
        ward: '',
      }))
    }
  }

  const handleDistrictChange = (districtCode: number | string) => {
    const code = Number(districtCode)
    setSelectedDistrictCode(code)
    setSelectedWardCode('')
    const districts = getDistrictsByProvince(selectedProvinceCode as number)
    const district = districts.find(d => d.code === code)
    if (district) {
      setFormData(prev => ({
        ...prev,
        district: district.name,
        ward: '',
      }))
    }
  }

  const handleWardChange = (wardCode: number | string) => {
    const code = Number(wardCode)
    setSelectedWardCode(code)
    const wards = getWardsByDistrict(selectedDistrictCode as number)
    const ward = wards.find(w => w.code === code)
    if (ward) {
      setFormData(prev => ({
        ...prev,
        ward: ward.name,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.street || !formData.city || !formData.district || !formData.ward) {
      errorToast('Vui lòng điền đầy đủ thông tin')
      return
    }

    if (!selectedProvinceCode || !selectedDistrictCode || !selectedWardCode) {
      errorToast('Vui lòng chọn Tỉnh/Thành phố, Quận/Huyện và Phường/Xã')
      return
    }

    try {
      setIsSaving(true)

      if (editingId) {
        const response = await api.put(`/user/shipping-address/${editingId}`, formData)
        if (response.data.success) {
          successToast('Cập nhật địa chỉ thành công')
          // Update local state with the array from response
          const updatedAddresses = response.data.data.shippingAddresses || response.data.data
          setAddresses(Array.isArray(updatedAddresses) ? updatedAddresses : addresses)
          setShowForm(false)
          setSelectedProvinceCode('')
          setSelectedDistrictCode('')
          setSelectedWardCode('')
        }
      } else {
        const response = await api.post('/user/shipping-address', formData)
        if (response.data.success) {
          successToast('Thêm địa chỉ thành công')
          // Update local state with the array from response
          const updatedAddresses = response.data.data.shippingAddresses || response.data.data
          setAddresses(Array.isArray(updatedAddresses) ? updatedAddresses : addresses)
          setShowForm(false)
          setSelectedProvinceCode('')
          setSelectedDistrictCode('')
          setSelectedWardCode('')
        }
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to save address'
      errorToast(errorMsg)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main
      className="min-h-screen bg-slate-950 relative overflow-hidden"
      style={{
        backgroundImage: `
        radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(34, 211, 238, 0.08) 0%, transparent 50%),
        linear-gradient(135deg, 
          rgba(15, 23, 42, 1) 0%,
          rgba(30, 27, 75, 0.5) 25%,
          rgba(15, 23, 42, 1) 50%,
          rgba(30, 27, 75, 0.5) 75%,
          rgba(15, 23, 42, 1) 100%)
      `,
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `
          linear-gradient(0deg, transparent 24%, rgba(99, 102, 241, 0.05) 25%, rgba(99, 102, 241, 0.05) 26%, transparent 27%, transparent 74%, rgba(99, 102, 241, 0.05) 75%, rgba(99, 102, 241, 0.05) 76%, transparent 77%, transparent),
          linear-gradient(90deg, transparent 24%, rgba(99, 102, 241, 0.05) 25%, rgba(99, 102, 241, 0.05) 26%, transparent 27%, transparent 74%, rgba(99, 102, 241, 0.05) 75%, rgba(99, 102, 241, 0.05) 76%, transparent 77%, transparent)
        `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-12 flex gap-8">
          {/* LEFT SIDEBAR */}
          {user && <ProfileSidebar userName={user.name} memberLevel="Pro Member" avatar={user.avatar} />}

          {/* CENTER CONTENT */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
              <div>
                <h1 className="text-4xl font-black text-white mb-2">Sổ địa chỉ</h1>
                <p className="text-slate-300 max-w-lg">
                  Quản lý các địa chỉ giao hàng của bạn để thanh toán nhanh chóng hơn trên Voltrix.
                </p>
              </div>
              {!showForm && (
                <Button
                  onClick={handleAddNew}
                  variant="primary"
                  size="md"
                  className="flex-shrink-0"
                >
                  <Icon name="add" size="sm" />
                  Thêm địa chỉ mới
                </Button>
              )}
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="text-white text-lg mb-2 font-bold">Đang tải địa chỉ...</div>
                  <div className="text-slate-400 text-sm">Vui lòng chờ...</div>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Address Form */}
            {showForm && (
              <div className="bg-slate-900/30 border border-indigo-500/20 rounded-xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-white mb-6">
                  {editingId ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Address Type and Zip Code */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <CustomSelect
                      label="Loại địa chỉ"
                      value={formData.name}
                      options={addressTypeOptions}
                      onChange={handleAddressTypeChange}
                      placeholder="-- Chọn loại --"
                    />

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Mã bưu chính</label>
                      <input
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        placeholder="Nhập mã bưu chính"
                        className="w-full px-4 py-3 bg-slate-900/40 border border-indigo-500/40 rounded-lg text-white text-sm outline-none focus:border-indigo-400 focus:bg-slate-900/60 transition"
                      />
                    </div>
                  </div>

                  {/* Street Address */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Địa chỉ chi tiết *</label>
                    <input
                      type="text"
                      name="street"
                      value={formData.street}
                      onChange={handleInputChange}
                      placeholder="Ví dụ: 123 Đường ABC, Tòa nhà XYZ"
                      required
                      className="w-full px-4 py-3 bg-slate-900/40 border border-indigo-500/40 rounded-lg text-white text-sm outline-none focus:border-indigo-400 focus:bg-slate-900/60 transition"
                    />
                  </div>

                  {/* Province / City Selection */}
                  <CustomSelect
                    label="Tỉnh / Thành phố"
                    value={selectedProvinceCode}
                    options={provinces}
                    onChange={handleProvinceChange}
                    placeholder="-- Chọn Tỉnh / Thành phố --"
                    required
                  />

                  {/* District Selection */}
                  {selectedProvinceCode && (
                    <CustomSelect
                      label="Quận / Huyện"
                      value={selectedDistrictCode}
                      options={getDistrictsByProvince(selectedProvinceCode as number)}
                      onChange={handleDistrictChange}
                      placeholder="-- Chọn Quận / Huyện --"
                      required
                    />
                  )}

                  {/* Ward Selection */}
                  {selectedDistrictCode && (
                    <CustomSelect
                      label="Phường / Xã"
                      value={selectedWardCode}
                      options={getWardsByDistrict(selectedDistrictCode as number)}
                      onChange={handleWardChange}
                      placeholder="-- Chọn Phường / Xã --"
                      required
                    />
                  )}

                  {/* Default Address */}
                  <div className="p-4 bg-slate-900/30 border border-indigo-500/20 rounded-lg transition hover:border-indigo-400/50">
                    <Checkbox
                      id="isDefault"
                      label="Đặt làm địa chỉ mặc định"
                      checked={formData.isDefault}
                      onChange={(checked) => setFormData(prev => ({ ...prev, isDefault: checked }))}
                      className="w-full"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false)
                        setSelectedProvinceCode('')
                        setSelectedDistrictCode('')
                        setSelectedWardCode('')
                      }}
                      className="px-6 py-3 text-indigo-400 hover:bg-indigo-500/10 border border-indigo-500/30 rounded-lg transition text-sm font-bold"
                    >
                      Hủy
                    </button>
                    <Button
                      variant="primary"
                      size="md"
                      disabled={isSaving}
                      className="flex items-center gap-2"
                      type="submit"
                    >
                      {isSaving ? 'Đang lưu...' : (editingId ? 'Cập nhật' : 'Thêm mới')}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Addresses Bento Grid */}
            {!isLoading && !showForm && (
              <>
                <RadioGroup 
                  value={addresses.find(a => a.isDefault)?._id || ''} 
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
                >
                  {/* Address Cards */}
                  {addresses.map((address) => (
                    <label
                      key={address._id}
                      className="group bg-slate-900/30 border border-indigo-500/20 hover:border-indigo-500/40 rounded-xl p-8 transition-all duration-300 relative overflow-hidden cursor-pointer has-[:checked]:border-indigo-400"
                    >
                      {/* Header with Badge and Actions */}
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                          <RadioGroupItem 
                            value={address._id || ''} 
                            id={`address-${address._id}`}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className={cn(
                            'px-3 py-1 text-[10px] font-bold rounded-full tracking-widest uppercase',
                            address.name === 'HOME'
                              ? 'bg-indigo-500/20 text-indigo-300'
                              : address.name === 'OFFICE'
                              ? 'bg-slate-700/50 text-slate-300'
                              : 'bg-slate-700/50 text-slate-300'
                          )}>
                          {address.name === 'HOME' ? 'Nhà riêng' : address.name === 'OFFICE' ? 'Văn phòng' : 'Khác'}
                        </span>
                        </div>
                        
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!address.isDefault && (
                            <button
                              onClick={() => handleSetDefault(address._id)}
                              className="px-3 py-1 text-xs font-semibold text-indigo-300 hover:text-indigo-200 hover:bg-indigo-500/20 rounded-lg transition"
                              title="Set as Default"
                            >
                              Mặc định
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(address)}
                            className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition"
                            title="Edit"
                          >
                            <Icon name="edit" size="sm" />
                          </button>
                          <button
                            onClick={() => handleDelete(address._id)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                            title="Delete"
                          >
                            <Icon name="delete_outline" size="sm" />
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="space-y-4 mb-6">
                        <div>
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter mb-1">Địa chỉ</p>
                          <p className="text-sm text-white font-medium">
                            {address.street}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter mb-1">Địa điểm</p>
                          <p className="text-sm text-slate-300">
                            {address.ward}, {address.district}, {address.city}
                          </p>
                        </div>

                        {address.zipCode && (
                          <div>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter mb-1">Mã bưu chính</p>
                            <p className="text-sm text-slate-300">{address.zipCode}</p>
                          </div>
                        )}
                      </div>

                      {/* Default Badge */}
                      {address.isDefault && (
                        <div className="absolute bottom-4 right-4">
                          <span className="text-[10px] text-indigo-400 flex items-center gap-1 font-bold">
                            <Icon name="verified" size="xs" />
                            MẶC ĐỊNH
                          </span>
                        </div>
                      )}

                      {/* Set Default Badge */}
                      {address.isDefault && (
                        <div className="mt-4 pt-4 border-t border-indigo-500/20 text-center">
                          <p className="text-xs text-indigo-400 font-bold">✓ Địa chỉ mặc định</p>
                        </div>
                      )}
                    </label>
                  ))}

                  {/* Add New Address Card */}
                  <div
                    onClick={handleAddNew}
                    className="group bg-slate-900/20 border-2 border-dashed border-slate-700 hover:border-indigo-500/40 hover:bg-slate-900/40 rounded-xl flex flex-col items-center justify-center p-8 transition-all cursor-pointer"
                  >
                    <div className="h-16 w-16 rounded-full bg-slate-900/50 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-indigo-500/10 transition-all">
                      <Icon name="add_location" size="lg" className="text-indigo-400" />
                    </div>
                    <p className="font-bold text-slate-300 group-hover:text-indigo-300 transition-colors">Thêm địa chỉ mới</p>
                    <p className="text-xs text-slate-500 mt-1">Thiết lập điểm giao hàng mới</p>
                  </div>
                </RadioGroup>

                {/* Empty State */}
                {addresses.length === 0 && (
                  <div className="bg-slate-900/30 border border-indigo-500/20 rounded-xl p-12 text-center">
                    <Icon name="location_on" size="lg" className="text-slate-500 mx-auto mb-4" />
                    <p className="text-white font-bold text-lg mb-2">Chưa có địa chỉ nào</p>
                    <p className="text-slate-400 text-sm mb-6">Thêm địa chỉ giao hàng để thanh toán nhanh chóng hơn.</p>
                    <Button
                      onClick={handleAddNew}
                      variant="primary"
                      size="md"
                      className="mx-auto"
                    >
                      <Icon name="add" size="sm" />
                      Thêm địa chỉ đầu tiên
                    </Button>
                  </div>
                )}

                {/* Quick Insights Section */}
                {addresses.length > 0 && (
                  <section className="mt-16 grid grid-cols-12 gap-6">
                    <div className="col-span-12 lg:col-span-7 bg-slate-900/30 border border-indigo-500/20 p-10 rounded-xl">
                      <h3 className="text-2xl font-black text-white mb-8">Thống Kê Nhanh</h3>
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <p className="text-4xl font-black text-indigo-400">{addresses.length}</p>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
                            Địa chỉ đã lưu
                          </p>
                        </div>
                        <div>
                          <p className="text-4xl font-black text-indigo-400">
                            {addresses.filter(a => a.isDefault).length}
                          </p>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
                            Địa chỉ mặc định
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-span-12 lg:col-span-5 relative h-64 rounded-xl overflow-hidden shadow-lg shadow-indigo-500/10">
                      <div className="w-full h-full bg-gradient-to-br from-indigo-600/30 via-slate-900/50 to-slate-950 flex items-center justify-center">
                        <Icon name="location_on" size="xl" className="text-indigo-400/30" />
                      </div>
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Xóa địa chỉ"
        message="Bạn chắc chắn muốn xóa địa chỉ này? Hành động này không thể hoàn tác."
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsConfirmOpen(false)
          setDeleteIdToConfirm(null)
        }}
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
      />
    </main>
  )
}

export default AddressBookPage
