import { FC, useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Wallet, Plus, Clock, QrCode } from 'lucide-react'
import { useCart } from '../context/CartContext'
import Button from '../components/atomic/Button'
import Checkbox from '../components/atomic/Checkbox'
import Stepper from '../components/modules/Stepper'
import { RadioGroup, RadioGroupItem } from '../components/ui/radio'
import { successToast, warningToast, errorToast } from '../utils/toast'
import { useProvinces } from '../hooks/useProvinces'
import api from '../services/api'

type PaymentMethod = 'cash' | 'momo'

interface ShippingAddress {
  _id?: string
  name: string
  street: string
  city: string
  district: string
  ward: string
  zipCode?: string
  isDefault?: boolean
}

const CheckoutPage: FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { items, updateQuantity, clearCart } = useCart()
  const { provinces, getDistrictsByProvince, getWardsByDistrict } = useProvinces()

  // User & Address states
  const [user, setUser] = useState<any>(null)
  const [savedAddresses, setSavedAddresses] = useState<ShippingAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | ''>('')
  const [isEditingAddress, setIsEditingAddress] = useState(false)
  const [shouldSaveAddress, setShouldSaveAddress] = useState(false)
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<number | ''>('')
  const [selectedDistrictCode, setSelectedDistrictCode] = useState<number | ''>('')

  // Check authentication on mount and load user data
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      warningToast('Vui lòng đăng nhập để tiếp tục thanh toán')
      navigate('/login', { replace: true, state: { from: location.pathname } })
    } else {
      const userData = localStorage.getItem('user')
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData)
          setUser(parsedUser)
          if (parsedUser.shippingAddresses && parsedUser.shippingAddresses.length > 0) {
            setSavedAddresses(parsedUser.shippingAddresses)
            // Select default address or first address
            const defaultAddr = parsedUser.shippingAddresses.find((addr: ShippingAddress) => addr.isDefault)
            if (defaultAddr?._id) {
              setSelectedAddressId(defaultAddr._id)
            } else if (parsedUser.shippingAddresses[0]?._id) {
              setSelectedAddressId(parsedUser.shippingAddresses[0]._id)
            }
          }
        } catch (e) {
          console.error('Failed to parse user data:', e)
        }
      }
    }
  }, [navigate, location.pathname])

  // Form states
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    ward: '',
    note: '',
  })

  // Auto-fill form when address is selected
  useEffect(() => {
    if (selectedAddressId) {
      const selectedAddr = savedAddresses.find(addr => addr._id === selectedAddressId)
      if (selectedAddr) {
        setFormData(prev => ({
          ...prev,
          fullName: selectedAddr.name || '',
          address: selectedAddr.street || '',
          city: selectedAddr.city || '',
          district: selectedAddr.district || '',
          ward: selectedAddr.ward || '',
        }))
        // Set province code
        const provinceCode = provinces.find(p => p.name === selectedAddr.city)?.code
        if (provinceCode) {
          setSelectedProvinceCode(provinceCode)
          
          // Set district code
          const districts = getDistrictsByProvince(provinceCode)
          const districtCode = districts.find(d => d.name === selectedAddr.district)?.code
          if (districtCode) {
            setSelectedDistrictCode(districtCode)
          }
        }
        setIsEditingAddress(false)
      }
    }
  }, [selectedAddressId, savedAddresses, provinces, getDistrictsByProvince])

  // Auto-fill email and phone from user data
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        email: prev.email || user.email,
        phone: prev.phone || user.phone,
        fullName: prev.fullName || user.name,
      }))
    }
  }, [user])

  // Debug: Log form visibility state
  useEffect(() => {
    console.log('📋 Address Form State:')
    console.log('  - isEditingAddress:', isEditingAddress)
    console.log('  - savedAddresses.length:', savedAddresses.length)
    console.log('  - Should show form?', isEditingAddress || savedAddresses.length === 0)
  }, [isEditingAddress, savedAddresses.length])

  // ── Checkout Hold (15-min stock reservation) ──────────────────────────
  const [holdId, setHoldId] = useState<string | null>(null)
  const [holdExpiresAt, setHoldExpiresAt] = useState<Date | null>(null)
  const [holdSecondsLeft, setHoldSecondsLeft] = useState<number | null>(null)
  const holdCreated = useRef(false)

  const createCheckoutHold = useCallback(async () => {
    if (holdCreated.current || items.length === 0) return
    holdCreated.current = true
    try {
      const res = await api.post('/checkout/hold', {
        items: items.map(i => ({
          productId: i.productId,
          variantSku: i.variantSku ?? null,
          quantity: i.quantity,
        })),
      })
      setHoldId(res.data.data.holdId)
      setHoldExpiresAt(new Date(res.data.data.reservedUntil))
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Không thể giữ hàng'
      warningToast(msg)
      // If stock check failed, go back to cart
      if (err?.response?.status === 409) {
        navigate('/cart')
      }
    }
  }, [items, navigate])

  // Create hold once items + user are loaded
  useEffect(() => {
    if (user && items.length > 0 && !holdCreated.current) {
      createCheckoutHold()
    }
  }, [user, items, createCheckoutHold])

  // Release hold when user leaves checkout without placing order
  useEffect(() => {
    return () => {
      if (holdId) {
        navigator.sendBeacon(`/api/checkout/hold/${holdId}`, '') // best-effort on unmount
        api.delete(`/checkout/hold/${holdId}`).catch(() => {})
      }
    }
  }, [holdId])

  // Countdown timer
  useEffect(() => {
    if (!holdExpiresAt) return
    const tick = () => {
      const diff = Math.max(0, Math.floor((holdExpiresAt.getTime() - Date.now()) / 1000))
      setHoldSecondsLeft(diff)
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [holdExpiresAt])

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }
  // ─────────────────────────────────────────────────────────────────────

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('momo')
  const [discountCode, setDiscountCode] = useState('')
  const [appliedCodes, setAppliedCodes] = useState<{ code: string; amount: number; type: 'discount' | 'shipping' }[]>([])

  // Calculate totals
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shippingFee = 30000

  // Separate discount and shipping codes
  const productDiscountAmount = appliedCodes
    .filter(item => item.type === 'discount')
    .reduce((sum, item) => sum + item.amount, 0)
  
  const shippingDiscountAmount = appliedCodes
    .filter(item => item.type === 'shipping')
    .reduce((sum, item) => sum + item.amount, 0)

  const finalShippingFee = Math.max(0, shippingFee - shippingDiscountAmount)
  const finalTotal = totalPrice - productDiscountAmount + finalShippingFee

  // Handle apply discount code
  const handleApplyDiscount = () => {
    // Discount codes mapping with type
    const discountMap: Record<string, { amount: number; type: 'discount' | 'shipping' }> = {
      'SAVE10': { amount: totalPrice * 0.1, type: 'discount' }, // 10% discount on products
      'SAVE20': { amount: totalPrice * 0.2, type: 'discount' }, // 20% discount on products
      'FREESHIP': { amount: shippingFee, type: 'shipping' }, // Free shipping
      'SUMMER50': { amount: 50000, type: 'discount' }, // Fixed 50k discount on products
    }

    const code = discountCode.toUpperCase().trim()
    if (!code) {
      warningToast('Vui lòng nhập mã giảm giá')
      return
    }

    // Check if code already applied
    if (appliedCodes.some(item => item.code === code)) {
      warningToast(`Mã ${code} đã được áp dụng rồi`)
      return
    }

    const discountInfo = discountMap[code]
    if (discountInfo) {
      setAppliedCodes([...appliedCodes, { code, amount: discountInfo.amount, type: discountInfo.type }])
      const typeLabel = discountInfo.type === 'shipping' ? 'miễn phí vận chuyển' : 'giảm giá'
      successToast(`Áp dụng mã ${code} thành công! ${typeLabel} ${discountInfo.amount.toLocaleString('vi-VN')} ₫`)
      setDiscountCode('')
    } else {
      warningToast('Mã giảm giá không hợp lệ')
    }
  }

  // Handle remove discount code
  const handleRemoveCode = (codeToRemove: string) => {
    setAppliedCodes(appliedCodes.filter(item => item.code !== codeToRemove))
    successToast(`Đã xóa mã ${codeToRemove}`)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleContinue = async () => {
    // Validate form
    if (!formData.fullName || !formData.email || !formData.phone || !formData.address) {
      warningToast('Vui lòng điền đầy đủ thông tin')
      return
    }

    // Validate address fields
    if (!selectedProvinceCode || !selectedDistrictCode || !formData.ward) {
      warningToast('Vui lòng chọn Tỉnh/Thành phố, Quận/Huyện và Phường/Xã')
      return
    }

    // Save address to profile if checkbox is checked
    if (shouldSaveAddress && (isEditingAddress || savedAddresses.length === 0)) {
      const saved = await saveAddressToProfile()
      if (!saved) return
    }

    // Build orderItems from cart
    const orderItems = items.map(item => ({
      product: item.productId,
      variantSku: item.variantSku || null,
      quantity: item.quantity,
      name: item.name,
      image: item.image,
      priceAtPurchase: item.price,
      price: item.price,
    }))

    const totalPriceCalc = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const discountAmt = appliedCodes.reduce((sum, c) => sum + c.amount, 0)
    const shippingAmt = appliedCodes.some(c => c.type === 'shipping') ? 0 : 30000

    // Map frontend payment method to backend enum
    const paymentMethodMap: Record<PaymentMethod, string> = {
      cash: 'COD',
      momo: 'Momo',
    }

    try {
      const res = await api.post('/orders', {
        orderItems,
        totalPrice: totalPriceCalc,
        discountAmount: discountAmt,
        finalPrice: totalPriceCalc - discountAmt + shippingAmt,
        paymentMethod: paymentMethodMap[paymentMethod],
        holdId: holdId ?? undefined, // pass hold so backend inherits reserved time
        shippingAddress: {
          name: formData.fullName,
          address: formData.address,
          city: formData.city,
          phone: formData.phone,
          ward: formData.ward || '',
          district: formData.district || '',
          email: formData.email || '',
        },
      })

      // Hold is consumed by backend — prevent release on unmount
      setHoldId(null)

      const { data: order } = res.data

      // For Momo: init payment and redirect to Momo, after success Momo will redirect to order-confirm
      if (paymentMethod === 'momo') {
        successToast(`Đơn hàng ${order.orderCode} đã được tạo!`)
        clearCart()
        try {
          const payRes = await api.post('/payment/momo/init', { orderId: order._id })
          // Redirect to Momo payment URL
          if (payRes.data.data.payUrl) {
            window.location.href = payRes.data.data.payUrl
          }
        } catch (err: any) {
          errorToast(err?.response?.data?.message || 'Lỗi khởi tạo thanh toán Momo')
        }
        return
      }

      // For COD: redirect to order-confirm with orderId
      clearCart()
      successToast(`Đơn hàng ${order.orderCode} đã được tạo!`)
      navigate(`/order-confirm?orderId=${order._id}`)
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Không thể tạo đơn hàng, vui lòng thử lại'
      errorToast(msg, 'Lỗi đặt hàng')
    }
  }

  const saveAddressToProfile = async () => {
    if (!formData.fullName || !formData.address || !formData.city || !formData.district || !formData.ward) {
      warningToast('Vui lòng điền đầy đủ thông tin địa chỉ')
      return false
    }

    try {
      const token = localStorage.getItem('accessToken')
      
      // Check if token exists
      if (!token) {
        warningToast('Vui lòng đăng nhập lại')
        navigate('/login')
        return false
      }

      console.log('Saving address with token:', token?.substring(0, 20) + '...') // Log token existence

      const response = await fetch('/api/user/shipping-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.fullName,
          street: formData.address,
          city: formData.city,
          district: formData.district,
          ward: formData.ward,
          zipCode: '',
          isDefault: true,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('API Error:', response.status, error)
        
        if (response.status === 401) {
          warningToast('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại')
          localStorage.removeItem('accessToken')
          localStorage.removeItem('user')
          // Dispatch event to notify Header about logout
          window.dispatchEvent(new Event('userLoggedOut'))
          navigate('/login')
          return false
        }
        
        warningToast(error.message || 'Không thể lưu địa chỉ')
        return false
      }

      const result = await response.json()
      if (result.data.shippingAddresses) {
        setSavedAddresses(result.data.shippingAddresses)
        const updatedUser = { ...user, shippingAddresses: result.data.shippingAddresses }
        localStorage.setItem('user', JSON.stringify(updatedUser))
        setUser(updatedUser)
      }
      successToast('Địa chỉ đã được lưu')
      return true
    } catch (error) {
      console.error('Error saving address:', error)
      warningToast('Lỗi kết nối, vui lòng thử lại')
      return false
    }
  }

  const handleSaveAddressOnly = async () => {
    // Validate form
    if (!formData.fullName || !formData.email || !formData.phone || !formData.address) {
      warningToast('Vui lòng điền đầy đủ thông tin')
      return
    }

    // Validate address fields
    if (!selectedProvinceCode || !selectedDistrictCode || !formData.ward) {
      warningToast('Vui lòng chọn Tỉnh/Thành phố, Quận/Huyện và Phường/Xã')
      return
    }

    // Save address to profile
    const saved = await saveAddressToProfile()
    if (saved) {
      // Reset form on success
      setIsEditingAddress(false)
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        district: '',
        ward: '',
        note: '',
      })
      setSelectedProvinceCode('')
      setSelectedDistrictCode('')
      setShouldSaveAddress(false)
      setSelectedAddressId('')
    }
  }

  const paymentOptions: { id: PaymentMethod; label: string; icon: React.ReactNode; description: string }[] = [
    {
      id: 'cash',
      label: 'Thanh Toán Khi Nhận',
      icon: <Wallet className="w-6 h-6" />,
      description: 'Trả tiền khi nhận hàng',
    },
    {
      id: 'momo',
      label: 'Ví Momo',
      icon: <QrCode className="w-6 h-6" />,
      description: 'Thanh toán qua Momo',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden" style={{
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
    }}>
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(0deg, transparent 24%, rgba(99, 102, 241, 0.05) 25%, rgba(99, 102, 241, 0.05) 26%, transparent 27%, transparent 74%, rgba(99, 102, 241, 0.05) 75%, rgba(99, 102, 241, 0.05) 76%, transparent 77%, transparent),
          linear-gradient(90deg, transparent 24%, rgba(99, 102, 241, 0.05) 25%, rgba(99, 102, 241, 0.05) 26%, transparent 27%, transparent 74%, rgba(99, 102, 241, 0.05) 75%, rgba(99, 102, 241, 0.05) 76%, transparent 77%, transparent)
        `,
        backgroundSize: '50px 50px',
      }} />

      {/* Content */}
      <div className="relative z-10">
        {/* ==================== STEPPER ==================== */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Stepper
            steps={[
              { label: 'Giỏ hàng', description: 'Kiểm tra sản phẩm' },
              { label: 'Thanh toán', description: 'Nhập thông tin' },
              { label: 'Hoàn thành', description: 'Xác nhận đơn hàng' },
            ]}
            currentStep={1}
            onStepClick={(stepIndex) => {
              if (stepIndex === 0) navigate('/cart')
            }}
          />
        </div>

        {/* ==================== MAIN CONTENT ==================== */}
        <div className="w-full max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">

          {/* Reservation Countdown Banner (only for non-COD) */}
          {holdSecondsLeft !== null && paymentMethod !== 'cash' && (
            <div className={`flex items-center gap-3 p-4 rounded-lg border mb-6 ${
              holdSecondsLeft === 0
                ? 'bg-red-900/30 border-red-500/40 text-red-300'
                : holdSecondsLeft < 120
                ? 'bg-yellow-900/30 border-yellow-500/40 text-yellow-300'
                : 'bg-indigo-900/30 border-indigo-500/40 text-indigo-200'
            }`}>
              <Clock className="w-5 h-5 flex-shrink-0" />
              {holdSecondsLeft === 0 ? (
                <span className="font-semibold">Hết thời gian giữ hàng! Vui lòng <button onClick={() => { holdCreated.current = false; createCheckoutHold() }} className="underline font-bold">giữ lại</button> hoặc quay về giỏ hàng.</span>
              ) : (
                <span>
                  Hàng được giữ cho bạn trong{' '}
                  <span className="font-black text-lg tabular-nums">{formatCountdown(holdSecondsLeft)}</span>
                  {' '}— vui lòng hoàn tất đặt hàng trước khi hết giờ.
                </span>
              )}
            </div>
          )}

          {/* Title Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-6">
            <div className="lg:col-span-2">
              <h1 className="text-3xl font-black text-white">Thông tin thanh toán</h1>
            </div>
            <div className="lg:col-span-1">
              <h2 className="text-3xl font-black text-white">Tóm tắt đơn hàng</h2>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ==================== LEFT COLUMN ==================== */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Info */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-bold text-white">Thông tin giao hàng</h3>
                  <p className="text-sm text-slate-400">
                    Bạn đã có tài khoản?{' '}
                    <button 
                      onClick={() => navigate('/login')} 
                      className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                    >
                      Đăng nhập
                    </button>
                  </p>
                </div>

                {/* Address Selector - Show only if user has saved addresses and not in edit mode */}
                {savedAddresses.length > 0 && !isEditingAddress && (
                  <div className="mb-4 p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                    <label className="block text-sm font-semibold text-slate-300 mb-3">
                      Chọn địa chỉ giao hàng
                    </label>
                    <RadioGroup value={selectedAddressId} onValueChange={(value) => setSelectedAddressId(value)}>
                      <div className="space-y-2 mb-3">
                        {savedAddresses.map(address => (
                          <label key={address._id} className="flex items-start gap-3 cursor-pointer p-2 rounded hover:bg-slate-700/50 transition-colors">
                            <RadioGroupItem value={address._id || ''} className="mt-1" />
                            <div className="flex-1">
                              <p className="text-white font-semibold text-sm">{address.name}</p>
                              <p className="text-slate-400 text-xs">{address.street}, {address.ward}, {address.district}, {address.city}</p>
                              {address.isDefault && <span className="text-xs text-indigo-400 mt-1 inline-block">✓ Mặc định</span>}
                            </div>
                          </label>
                        ))}
                      </div>
                    </RadioGroup>
                    <button
                      type="button"
                      onClick={() => {
                        console.log('Clicking "Thêm địa chỉ mới" - setting isEditingAddress to true')
                        setIsEditingAddress(true)
                        setSelectedAddressId('') // Clear selected address to avoid auto-fill
                        setShouldSaveAddress(false)
                        // Reset address selection dropdowns
                        setSelectedProvinceCode('')
                        setSelectedDistrictCode('')
                        setFormData(prev => ({
                          ...prev,
                          fullName: user?.name || '',
                          email: user?.email || '',
                          phone: user?.phone || '',
                          city: '',
                          district: '',
                          ward: '',
                        }))
                      }}
                      className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Thêm địa chỉ mới
                    </button>
                  </div>
                )}

                {/* Address Form - Show when editing or no saved addresses */}
                {isEditingAddress || savedAddresses.length === 0 ? (
                  <>
                    {savedAddresses.length > 0 && (
                      <div className="mb-4 p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setIsEditingAddress(false)}
                          className="text-slate-400 hover:text-white text-sm mb-3 transition-colors"
                        >
                          ← Quay lại chọn địa chỉ
                        </button>
                      </div>
                    )}

                    <div className="space-y-3">
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Họ và tên"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    style={{
                      WebkitAutofillBoxShadow: '0 0 0 1000px rgb(30, 27, 75) inset',
                      WebkitAutofillTextFillColor: '#ffffff',
                      colorScheme: 'dark',
                    } as any}
                  />

                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    style={{
                      WebkitAutofillBoxShadow: '0 0 0 1000px rgb(30, 27, 75) inset',
                      WebkitAutofillTextFillColor: '#ffffff',
                      colorScheme: 'dark',
                    } as any}
                  />

                  <input
                    type="tel"
                    name="phone"
                    placeholder="Số điện thoại"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    style={{
                      WebkitAutofillBoxShadow: '0 0 0 1000px rgb(30, 27, 75) inset',
                      WebkitAutofillTextFillColor: '#ffffff',
                      colorScheme: 'dark',
                    } as any}
                  />

                  <input
                    type="text"
                    name="address"
                    placeholder="Địa chỉ"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    style={{
                      WebkitAutofillBoxShadow: '0 0 0 1000px rgb(30, 27, 75) inset',
                      WebkitAutofillTextFillColor: '#ffffff',
                      colorScheme: 'dark',
                    } as any}
                  />

                  <div className="grid grid-cols-3 gap-3">
                    {/* Province Select */}
                    <select
                      value={selectedProvinceCode || ''}
                      onChange={(e) => {
                        const value = e.target.value
                        if (!value) {
                          setSelectedProvinceCode('')
                          setSelectedDistrictCode('')
                          setFormData(prev => ({ ...prev, city: '', district: '', ward: '' }))
                          return
                        }
                        
                        const numValue = Number(value)
                        let found = provinces.find(p => p.code === numValue) || 
                                   provinces.find(p => String(p.code) === value)
                        let provinceName = found?.name || value
                        
                        setSelectedProvinceCode(numValue || '')
                        setSelectedDistrictCode('')
                        setFormData(prev => ({ ...prev, city: provinceName, district: '', ward: '' }))
                      }}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                    >
                      <option value="">-- Tỉnh/Thành phố --</option>
                      {provinces.map(province => (
                        <option key={province.code} value={province.code}>
                          {province.name}
                        </option>
                      ))}
                    </select>

                    {/* District Select */}
                    <select
                      value={selectedDistrictCode || ''}
                      onChange={(e) => {
                        const value = e.target.value
                        if (!value) {
                          setSelectedDistrictCode('')
                          setFormData(prev => ({ ...prev, district: '', ward: '' }))
                          return
                        }
                        
                        const numValue = Number(value)
                        const district = getDistrictsByProvince(selectedProvinceCode as number).find(d => d.code === numValue)
                        const districtName = district?.name || ''
                        
                        setSelectedDistrictCode(numValue || '')
                        setFormData(prev => ({ ...prev, district: districtName, ward: '' }))
                      }}
                      disabled={selectedProvinceCode === ''}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">-- Quận/Huyện --</option>
                      {selectedProvinceCode && 
                        getDistrictsByProvince(selectedProvinceCode as number).map(district => (
                          <option key={district.code} value={district.code}>
                            {district.name}
                          </option>
                        ))
                      }
                    </select>

                    {/* Ward Select */}
                    <select
                      value={formData.ward || ''}
                      onChange={(e) =>
                        setFormData(prev => ({ ...prev, ward: e.target.value }))
                      }
                      disabled={selectedDistrictCode === ''}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">-- Phường/Xã --</option>
                      {selectedDistrictCode && 
                        getWardsByDistrict(selectedDistrictCode as number).map(ward => (
                          <option key={ward.code} value={ward.name}>
                            {ward.name}
                          </option>
                        ))
                      }
                    </select>
                  </div>

                  <textarea
                    name="note"
                    placeholder="Ghi chú (tùy chọn)"
                    value={formData.note}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  />

                  {/* Save Address Checkbox - Show when adding new address or no saved addresses */}
                  {(isEditingAddress || savedAddresses.length === 0) && (
                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/20 transition-colors">
                      <Checkbox
                        checked={shouldSaveAddress}
                        onChange={(checked) => setShouldSaveAddress(checked)}
                        label={<span className="text-indigo-300 text-sm font-semibold">Lưu địa chỉ này làm mặc định</span>}
                      />
                    </div>
                  )}

                  {/* Save Address Buttons - Show only when editing */}
                  {isEditingAddress && savedAddresses.length > 0 && (
                    <div className="flex gap-3">
                      <Button
                        onClick={handleSaveAddressOnly}
                        variant="primary"
                        size="sm"
                        className="flex-1"
                      >
                        ✓ Lưu địa chỉ
                      </Button>
                      <Button
                        onClick={() => {
                          setIsEditingAddress(false)
                          setFormData({
                            fullName: user?.name || '',
                            email: user?.email || '',
                            phone: user?.phone || '',
                            address: '',
                            city: '',
                            district: '',
                            ward: '',
                            note: '',
                          })
                          setSelectedProvinceCode('')
                          setSelectedDistrictCode('')
                          setShouldSaveAddress(false)
                        }}
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                      >
                        ✕ Hủy
                      </Button>
                    </div>
                  )}
                    </div>
                  </>
                ) : null}
              </div>

              {/* Payment Methods */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
                <h3 className="text-xl font-bold text-white">Phương thức thanh toán</h3>

                <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
                  <div className="space-y-3">
                    {paymentOptions.map((option) => (
                      <label
                        key={option.id}
                        className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          paymentMethod === option.id
                            ? 'border-indigo-500 bg-indigo-500/10'
                            : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                        }`}
                      >
                        <RadioGroupItem value={option.id} className="flex-shrink-0" />
                        <div className="flex items-center gap-3 flex-1">
                          <div className={paymentMethod === option.id ? 'text-indigo-400' : 'text-slate-400'}>
                            {option.icon}
                          </div>
                          <div>
                            <p className="font-bold text-white">{option.label}</p>
                            <p className="text-xs text-slate-400">{option.description}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </RadioGroup>

                {/* Payment Details Section */}
                {paymentMethod === 'cash' && (
                  <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-2 mt-4">
                    <h4 className="font-bold text-white text-sm">Thông tin thanh toán</h4>
                    <p className="text-slate-300 text-sm">
                      ✓ Thanh toán khi nhận hàng (COD)<br/>
                      Bạn sẽ thanh toán toàn bộ số tiền khi nhân viên giao hàng đến
                    </p>
                    <div className="bg-slate-700/50 border-l-4 border-indigo-400 rounded p-3 mt-3">
                      <p className="text-xs text-slate-300">
                        <span className="font-semibold text-indigo-400">Lưu ý:</span> Vui lòng chuẩn bị tiền mặt sẵn sàng
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ==================== RIGHT COLUMN - SUMMARY ==================== */}
            <div className="lg:col-span-1">
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 sticky top-20 space-y-4">

                {/* Order Items */}
                <div className="space-y-4 max-h-96 overflow-y-auto pb-4 border-b border-slate-800">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4 bg-slate-800/50 rounded p-4">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-24 h-24 rounded object-cover border border-slate-700"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-base truncate">{item.name}</p>
                        {item.variant && (
                          <p className="text-sm text-slate-400 mb-2">{item.variant}</p>
                        )}
                        <p className="text-sm text-indigo-400 font-bold mb-3">
                          {item.price.toLocaleString('vi-VN')} ₫
                        </p>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 bg-slate-900 rounded w-fit p-2">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                Math.max(1, item.quantity - 1)
                              )
                            }
                            className="w-6 h-6 flex items-center justify-center text-slate-400 hover:bg-slate-700 rounded transition-colors font-bold text-sm"
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-white font-bold text-sm">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                item.quantity + 1
                              )
                            }
                            className="w-6 h-6 flex items-center justify-center text-slate-400 hover:bg-slate-700 rounded transition-colors font-bold text-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Discount Code */}
                <div className="space-y-2 py-4 border-b border-slate-800">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nhập mã giảm giá"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                    />
                    <button
                      onClick={handleApplyDiscount}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold transition-colors text-sm"
                    >
                      Áp dụng
                    </button>
                  </div>

                  {/* Applied Codes List */}
                  {appliedCodes.length > 0 && (
                    <div className="space-y-2">
                      {appliedCodes.map((item) => (
                        <div
                          key={item.code}
                          className="flex justify-between items-center bg-lime-900/20 border border-lime-600/30 rounded p-2"
                        >
                          <div className="flex-1">
                            <p className="text-xs text-slate-400 mb-1">
                              {item.type === 'shipping' ? 'Voucher vận chuyển' : 'Voucher giảm giá'}
                            </p>
                            <div className="flex justify-between">
                              <p className="text-sm font-bold text-lime-400">{item.code}</p>
                              <p className="text-sm font-bold text-lime-400">
                                {item.type === 'shipping' ? 'Miễn phí' : `-${item.amount.toLocaleString('vi-VN')} ₫`}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveCode(item.code)}
                            className="ml-2 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold transition-colors self-start"
                          >
                            Xóa
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pricing */}
                <div className="space-y-3 py-4 border-b border-slate-800">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Tạm tính:</span>
                    <span className="text-white font-bold">
                      {totalPrice.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                  {productDiscountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-lime-400">Giảm giá:</span>
                      <span className="text-lime-400 font-semibold">
                        -{productDiscountAmount.toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Vận chuyển:</span>
                    <div className="text-right">
                      {shippingDiscountAmount > 0 ? (
                        <>
                          <div className="line-through text-slate-500 text-xs">
                            {shippingFee.toLocaleString('vi-VN')} ₫
                          </div>
                          <span className="text-lime-400 font-semibold">
                            Miễn phí
                          </span>
                        </>
                      ) : (
                        <span className="text-cyan-400 font-semibold">
                          {finalShippingFee.toLocaleString('vi-VN')} ₫
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center py-4 border-b border-slate-800">
                  <span className="text-white font-bold">Tổng cộng:</span>
                  <span className="text-2xl font-black text-cyan-400">
                    {finalTotal.toLocaleString('vi-VN')} ₫
                  </span>
                </div>

                {/* Buttons */}
                <Button
                  onClick={handleContinue}
                  variant="primary"
                  size="md"
                  className="w-full"
                >
                  Xác nhận thanh toán →
                </Button>

                <Button
                  onClick={() => navigate('/cart')}
                  variant="secondary"
                  size="md"
                  className="w-full"
                >
                  ← Quay lại giỏ hàng
                </Button>

                <div className="bg-slate-800 rounded p-3 text-center text-xs text-slate-400">
                  ✓ Thanh toán bảo mật 100%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage
