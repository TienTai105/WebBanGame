import { FC, useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/atomic'
import Button from '../components/atomic/Button'
import Pagination from '../components/modules/Pagination'
import ChangePasswordModal from '../components/small/ChangePasswordModal'
import { cn } from '../utils/cn'
import api from '../services/api'
import { uploadAvatar } from '../services/uploadService'
import { successToast, errorToast, infoToast } from '../utils/toast'

interface UserProfileData {
    _id: string
    name: string
    email: string
    emailVerified: boolean
    phone?: string
    avatar?: string
    role: 'customer' | 'staff' | 'admin'
    shippingAddresses?: Array<{
        _id?: string
        name: string
        street: string
        city: string
        district: string
        ward: string
        zipCode: string
        isDefault: boolean
    }>
    createdAt: Date
    updatedAt: Date
}

interface OrderItem {
    _id: string
    orderId: string
    date: string
    total: number
    status: 'shipped' | 'completed' | 'processing' | 'pending'| 'failed'| 'cancelled'
}

/**
 * User Profile Page
 * Displays user account information, shipping addresses, order history, and membership status
 * @component
 */
const UserProfilePage: FC = () => {
    const navigate = useNavigate()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const [user, setUser] = useState<UserProfileData | null>(null)
    const [editForm, setEditForm] = useState({ name: '', phone: '' })

    const [orders, setOrders] = useState<OrderItem[]>([])
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)
    const itemsPerPage = 5

    // Fetch user data on component mount
    useEffect(() => {
        // Check if user is authenticated
        const token = localStorage.getItem('accessToken')
        if (!token) {
            navigate('/login')
            return
        }
        fetchUserData()
    }, [])

    const fetchUserData = async () => {
        try {
            setIsLoading(true)
            setError(null)

            // Fetch user data
            const userResponse = await api.get('/auth/me')
            const userData = userResponse.data.data.user
            setUser(userData)
            setEditForm({
                name: userData.name,
                phone: userData.phone || '',
            })

            // Fetch user orders
            const ordersResponse = await api.get(`/orders/my-orders?page=${currentPage}&limit=${itemsPerPage}`)
            const ordersData = Array.isArray(ordersResponse.data.data) ? ordersResponse.data.data : []
            const fetchedOrders: OrderItem[] = ordersData.map((order: any) => ({
                _id: order._id,
                orderId: order.orderCode,
                date: order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric' 
                }) : 'Unknown',
                total: order.finalPrice,
                status: order.orderStatus?.toLowerCase() ,
            }))
            setOrders(fetchedOrders)
            setTotalPages(ordersResponse.data.pages || 1)
        } catch (err: any) {
            console.error('Failed to fetch user data:', err)
            const errorMsg = err.response?.data?.message || err.message || 'Failed to load profile'
            setError(errorMsg)
            setUser(null)
            setOrders([])
        } finally {
            setIsLoading(false)
        }
    }

    const handleEditClick = () => {
        setIsEditing(true)
        setSuccess(false)
    }

    const handleCancel = () => {
        setIsEditing(false)
        if (user) {
            setEditForm({ name: user.name, phone: user.phone || '' })
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setEditForm(prev => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleAvatarClick = () => {
        fileInputRef.current?.click()
    }

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                errorToast('Please select an image file')
                return
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                errorToast('Image size must be less than 5MB')
                return
            }

            // Upload to Cloudinary via backend
            handleAvatarUpload(file)
        }
    }

    const handleAvatarUpload = async (file: File) => {
        try {
            infoToast('Uploading avatar...')
            
            // Upload to Cloudinary
            const uploadedUrl = await uploadAvatar(file)

            // Update user profile with Cloudinary URL
            const response = await api.put('/user/profile', {
                name: editForm.name || user?.name,
                phone: editForm.phone || user?.phone,
                avatar: uploadedUrl, // Just URL, not base64
            })

            const updatedUser = response.data.data.user
            setUser(updatedUser)
            successToast('Avatar updated successfully!')
        } catch (err: any) {
            const errorMsg = err.message || 'Failed to upload avatar'
            errorToast(errorMsg)
            console.error('Failed to upload avatar:', err)
        }
    }

    const handleSave = async () => {
        try {
            setIsSaving(true)
            setError(null)

            // Validation
            if (!editForm.name.trim() || !editForm.phone.trim()) {
                setError('Name and phone are required')
                return
            }

            const response = await api.put('/user/profile', {
                name: editForm.name,
                phone: editForm.phone,
            })

            const updatedUser = response.data.data.user
            setUser(updatedUser)
            setIsEditing(false)
            setSuccess(true)
            successToast('Profile updated successfully!')
            setTimeout(() => setSuccess(false), 3000)
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Failed to update profile'
            setError(errorMsg)
            errorToast(errorMsg)
            console.error('Failed to update profile:', err)
        } finally {
            setIsSaving(false)
        }
    }

    // Refetch orders when page changes
    useEffect(() => {
        if (user) {
            const token = localStorage.getItem('accessToken')
            if (token) {
                const fetchOrders = async () => {
                    try {
                        const ordersResponse = await api.get(`/orders/my-orders?page=${currentPage}&limit=${itemsPerPage}`)
                        const ordersData = Array.isArray(ordersResponse.data.data) ? ordersResponse.data.data : []
                        const fetchedOrders: OrderItem[] = ordersData.map((order: any) => ({
                            _id: order._id,
                            orderId: order.orderCode,
                            date: order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB', { 
                                day: '2-digit', 
                                month: 'short', 
                                year: 'numeric' 
                            }) : 'Unknown',
                            total: order.finalPrice,
                            status: order.orderStatus?.toLowerCase() ,
                        }))
                        setOrders(fetchedOrders)
                        setTotalPages(ordersResponse.data.pages || 1)
                    } catch (err) {
                        console.error('Failed to fetch orders:', err)
                    }
                }
                fetchOrders()
            }
        }
    }, [currentPage])

    if (isLoading) {
        return (
            <main className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-white text-xl mb-3">Loading profile...</div>
                    <div className="text-slate-400 text-sm">Please wait...</div>
                </div>
            </main>
        )
    }

    if (!user || error) {
        return (
            <main className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="bg-slate-900/50 border border-red-500/30 rounded-xl p-8 max-w-md text-center">
                    <div className="text-white text-xl mb-2 font-bold">Unable to Load Profile</div>
                    <div className="text-red-400 text-sm mb-6">{error || 'Failed to load your profile. Please try again later.'}</div>
                    <button
                        onClick={() => fetchUserData()}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition"
                    >
                        Retry
                    </button>
                </div>
            </main>
        )
    }

    const defaultAddress = user.shippingAddresses?.find(addr => addr.isDefault)
    const membershipTier = 'Pro Member'
    const coinsBalance = 12450

    return (
        <main className="min-h-screen bg-slate-950 relative overflow-hidden" style={{
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
                <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-12 flex gap-8">

                    {/* LEFT SIDEBAR */}
                    <aside className="hidden lg:block w-64 shrink-0">
                        <div className="sticky space-y-4">
                            {/* Profile Card */}
                            <div className="bg-gradient-to-br from-indigo-950/60 to-slate-900/60 backdrop-blur-sm border border-indigo-500/30 rounded-xl p-4 shadow-lg shadow-indigo-500/10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="relative">
                                        <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} alt={user.name} className="w-12 h-12 rounded-lg object-cover border border-indigo-500/30" />
                                        <button
                                            onClick={handleAvatarClick}
                                            className="absolute -bottom-1 -right-1 bg-indigo-500 hover:bg-indigo-600 text-white p-1 rounded-full shadow-lg transition text-[8px]"
                                            type="button"
                                            title="Change avatar"
                                        >
                                            <Icon name="add" size="xs" />
                                        </button>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-sm">{user.name}</h3>
                                        <p className="text-indigo-400 text-xs font-medium">{membershipTier}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Navigation Menu */}
                            <nav className="space-y-2 bg-slate-900/30 border border-indigo-500/20 rounded-xl p-2">
                                <button
                                    onClick={() => navigate('/profile')}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-indigo-400 font-bold bg-indigo-500/20 rounded-lg transition"
                                >
                                    <Icon name="person" size="sm" />
                                    <span className="text-sm">Account Settings</span>
                                </button>
                                <button
                                    onClick={() => navigate('/order-history')}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-slate-100 hover:bg-indigo-500/10 rounded-lg transition"
                                >
                                    <Icon name="history" size="sm" />
                                    <span className="text-sm">Order History</span>
                                </button>
                                <button
                                    onClick={() => navigate('/address-book')}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-slate-100 hover:bg-indigo-500/10 rounded-lg transition">
                                    <Icon name="location_on" size="sm" />
                                    <span className="text-sm">Address Book</span>
                                </button>
                                <button
                                    onClick={() => setShowChangePasswordModal(true)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-slate-100 hover:bg-indigo-500/10 rounded-lg transition">
                                    <Icon name="lock" size="sm" />
                                    <span className="text-sm">Change Password</span>
                                </button>
                                <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-slate-100 hover:bg-indigo-500/10 rounded-lg transition">
                                    <Icon name="military_tech" size="sm" />
                                    <span className="text-sm">Reward Points</span>
                                </button>
                            </nav>

                            {/* Status Card */}
                            <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl p-4 text-white shadow-lg shadow-indigo-500/20">
                                <p className="text-[10px] uppercase tracking-wider font-bold mb-1 opacity-80">Current Status</p>
                                <p className="text-base font-bold mb-3">{membershipTier}</p>
                                <Button variant="primary" size="sm" className="w-full">
                                    Upgrade to Elite
                                </Button>
                            </div>
                        </div>
                    </aside>

                    {/* CENTER & RIGHT CONTENT */}
                    <div className="flex-1 min-w-0">
                        {/* Two Column Layout: Personal Info + Elite Tier Progress */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* CENTER COLUMN - Personal Info */}
                            <div className="lg:col-span-2 space-y-8">
                                {/* Header Card */}
                                <div className="bg-gradient-to-br from-indigo-950/60 to-slate-900/60 backdrop-blur-sm border border-indigo-500/30 rounded-xl p-8 shadow-lg shadow-indigo-500/10">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                                    <div className="relative shrink-0">
                                            <img
                                                src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                                                alt={user.name}
                                                className="w-24 h-24 rounded-xl object-cover border-2 border-indigo-500/30 shadow-lg shadow-indigo-500/20"
                                            />
                                            <button
                                                onClick={handleAvatarClick}
                                                className="absolute -bottom-2 -right-2 bg-indigo-500 hover:bg-indigo-600 text-white p-2 rounded-lg shadow-lg transition"
                                                type="button"
                                                title="Change avatar"
                                            >
                                                <Icon name="add" size="sm" />
                                            </button>
                                            {user.emailVerified && (
                                                <div className="absolute -bottom-12 -right-2 bg-indigo-500 text-white p-2 rounded-lg shadow-lg">
                                                    <Icon name="verified" size="sm" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h1 className="text-4xl font-black text-white mb-2">{user.name}</h1>
                                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                                <div className="inline-block px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded-full border border-indigo-500/30">
                                                    Pro Member
                                                </div>
                                                <div className="text-slate-400 text-sm">•</div>
                                                <span className="text-slate-400 text-sm">Member since {new Date(user.createdAt).getFullYear()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Personal Information Section */}
                                <section>
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-black text-white flex items-center gap-2">
                                            <Icon name="contact_page" size="md" className="text-indigo-400" />
                                            Thông tin cá nhân
                                        </h2>
                                        {!isEditing && (
                                            <button
                                                onClick={handleEditClick}
                                                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition"
                                            >
                                                Chỉnh sửa thông tin
                                            </button>
                                        )}
                                    </div>

                                    {error && (
                                        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 text-red-400 text-xs rounded-lg">
                                            {error}
                                        </div>
                                    )}

                                    {success && (
                                        <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 text-green-400 text-xs rounded-lg">
                                            Cập nhật thông tin thành công!  
                                        </div>  
                                    )}

                                    <div className="bg-slate-900/30 border border-indigo-500/20 rounded-xl p-8">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            {/* Full Name */}
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Full Name</label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={editForm.name}
                                                    onChange={handleInputChange}
                                                    readOnly={!isEditing}
                                                    className={cn(
                                                        'w-full px-4 py-3 bg-slate-900/40 border rounded-lg text-white text-sm outline-none transition',
                                                        isEditing
                                                            ? 'border-indigo-500/40 focus:border-indigo-400 focus:bg-slate-900/60'
                                                            : 'border-indigo-500/20 cursor-not-allowed'
                                                    )}
                                                />
                                            </div>

                                            {/* Email */}
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Email Address</label>
                                                <input
                                                    type="email"
                                                    value={user.email}
                                                    readOnly
                                                    className="w-full px-4 py-3 bg-slate-900/40 border border-indigo-500/20 rounded-lg text-white text-sm outline-none cursor-not-allowed"
                                                />
                                            </div>

                                            {/* Phone */}
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Phone Number</label>
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={editForm.phone}
                                                    onChange={handleInputChange}
                                                    readOnly={!isEditing}
                                                    className={cn(
                                                        'w-full px-4 py-3 bg-slate-900/40 border rounded-lg text-white text-sm outline-none transition',
                                                        isEditing
                                                            ? 'border-indigo-500/40 focus:border-indigo-400 focus:bg-slate-900/60'
                                                            : 'border-indigo-500/20 cursor-not-allowed'
                                                    )}
                                                />
                                            </div>

                                            {/* Member Since */}
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Member Since</label>
                                                <input
                                                    type="text"
                                                    value={new Date(user.createdAt).getFullYear().toString()}
                                                    readOnly
                                                    className="w-full px-4 py-3 bg-slate-900/40 border border-indigo-500/20 rounded-lg text-white text-sm outline-none cursor-not-allowed"
                                                />
                                            </div>
                                        </div>

                                        {isEditing && (
                                            <div className="mt-6 flex gap-3 justify-end">
                                                <button
                                                    onClick={handleCancel}
                                                    className="px-4 py-2 text-indigo-400 hover:bg-indigo-500/10 border border-indigo-500/30 rounded-lg transition text-sm font-bold"
                                                >
                                                    Cancel
                                                </button>
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={handleSave}
                                                    disabled={isSaving}
                                                >
                                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* Recent Orders Section */}
                                <section>
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-black text-white flex items-center gap-2">
                                            <Icon name="shopping_bag" size="md" className="text-indigo-400" />
                                            Đơn hàng gần đây
                                        </h2>
                                        <button 
                                            onClick={() => navigate('/order-history')}
                                            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition">
                                            Xem tất cả
                                        </button>
                                    </div>

                                    <div className="bg-slate-900/30 border border-indigo-500/20 rounded-xl overflow-hidden shadow-lg shadow-indigo-500/10">
                                        {orders.length === 0 ? (
                                            <div className="p-8 text-center">
                                                <Icon name="shopping_bag" size="lg" className="text-slate-600 mx-auto mb-3" />
                                                <p className="text-slate-400 text-sm">No orders yet</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left text-sm">
                                                        <thead className="bg-slate-900/50 border-b border-indigo-500/20">
                                                            <tr>
                                                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Order ID</th>
                                                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Date</th>
                                                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Total</th>
                                                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-indigo-500/10">
                                                            {orders.map((order) => (
                                                                <tr 
                                                                    key={order._id} 
                                                                    onClick={() => navigate(`/orders/${order._id}`)}
                                                                    className="hover:bg-indigo-500/10 transition cursor-pointer"
                                                                >
                                                                    <td className="px-6 py-4 font-bold text-white">{order.orderId}</td>
                                                                    <td className="px-6 py-4 text-slate-400">{order.date}</td>
                                                                    <td className="px-6 py-4 font-bold text-white">{order.total.toLocaleString('vi-VN')} VNĐ</td>
                                                                    <td className="px-6 py-4">
                                                                        <span className={cn(
                                                                            'px-3 py-1 text-[12px] font-bold rounded-full capitalize',
                                                                            order.status === 'shipped' && 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
                                                                            order.status === 'completed' && 'bg-green-500/20 text-green-400 border border-green-500/30',
                                                                            order.status === 'processing' && 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
                                                                            order.status === 'pending' && 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
                                                                            order.status === 'failed' && 'bg-red-500/20 text-red-400 border border-red-500/30',
                                                                            order.status === 'cancelled' && 'bg-red-500/20 text-red-400 border border-red-500/30',
                                                                            !['shipped', 'completed', 'processing', 'pending', 'failed', 'cancelled'].includes(order.status) && 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                                                                        )}>
                                                                            {order.status}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                                <Pagination
                                                    currentPage={currentPage}
                                                    totalPages={totalPages}
                                                    onPageChange={setCurrentPage}
                                                />
                                            </>
                                        )}
                                    </div>
                                </section>
                            </div>

                            {/* RIGHT COLUMN */}
                            <div className="space-y-8 flex flex-col">
                                {/* Elite Tier Progress Card */}
                                <div>
                                    <div className="bg-gradient-to-br from-indigo-950/60 to-slate-900/60 backdrop-blur-sm border border-indigo-500/30 rounded-xl p-6 shadow-lg shadow-indigo-500/10">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between mb-6">
                                                <h2 className="text-xl font-black text-white flex items-center gap-2">
                                                    <Icon name="grade" size="md" className="text-indigo-400" />
                                                    Elite Tier Progress
                                                </h2>
                                                <span className="text-xs font-bold text-indigo-400">75% Complete</span>
                                            </div>
                                            <div className="text-xs font-bold text-slate-400 uppercase">Next Tier: Platinum</div>
                                            <div className="h-3 bg-slate-900/50 rounded-full overflow-hidden border border-indigo-500/20">
                                                <div
                                                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full"
                                                    style={{ width: '75%' }}
                                                />
                                            </div>
                                            <p className="text-xs text-slate-400 leading-relaxed">
                                                Earn <span className="font-bold text-indigo-300">2,550 more coins</span> to unlock Platinum benefits including free express shipping.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Voltrix Coins Card */}
                                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl p-8 text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden">
                                    <p className="text-indigo-200 text-sm font-medium mb-2">Voltrix Coins</p>
                                    <h2 className="text-4xl font-black mb-1">{coinsBalance.toLocaleString()}</h2>
                                    <p className="text-indigo-300 text-xs">≈ {(coinsBalance * 100).toLocaleString('vi-VN')} VNĐ</p>
                                    <div className="absolute top-4 right-4 opacity-10">
                                        <Icon name="wallet" size="lg" />
                                    </div>
                                </div>

                                {/* Default Shipping Address */}
                                <section>
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-black text-white flex items-center gap-2">
                                            <Icon name="home" size="md" className="text-indigo-400" />
                                            Default Shipping
                                        </h2>
                                        <button onClick={() => navigate('/address-book')} className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition">
                                            Manage
                                        </button>
                                    </div>

                                    {defaultAddress && (
                                        <div className="bg-slate-900/30 border-l-4 border-indigo-500 rounded-xl p-8">
                                            <p className="text-base font-bold text-white mb-2">{user.name}</p>
                                            <p className="text-base text-slate-400 leading-relaxed mb-4">
                                                {defaultAddress.street}, {defaultAddress.ward}
                                                <br />
                                                {defaultAddress.district}, {defaultAddress.city}, {defaultAddress.zipCode}
                                            </p>
                                            <p className="text-base text-slate-400">{user.phone}</p>
                                        </div>
                                    )}
                                </section>
                                {/* Promo Banner */}
                                <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 text-white overflow-hidden border border-indigo-500/20 shadow-lg shadow-indigo-500/10 mt-auto">
                                    <div className="relative z-10">
                                        <h4 className="text-lg font-black mb-2">Weekend Sale!</h4>
                                        <p className="text-xs text-slate-300 mb-4">Get 20% extra coins on all digital game purchases.</p>
                                        <Button variant="primary" size="sm">
                                            Shop Now
                                        </Button>
                                    </div>
                                    <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
                                        <Icon name="shopping_bag" size="lg" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Change Password Modal */}
            <ChangePasswordModal
                isOpen={showChangePasswordModal}
                onClose={() => setShowChangePasswordModal(false)}
            />

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                aria-label="Upload avatar"
            />
        </main>
    )
}

export default UserProfilePage
