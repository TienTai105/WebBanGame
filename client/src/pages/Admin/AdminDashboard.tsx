import React, { useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import 'react-datepicker/dist/react-datepicker.css'
import '../../styles/datepicker.css'
import AdminLayout from '../../components/admin/AdminLayout'
import AdminBreadcrumb from '../../components/admin/AdminBreadcrumb'
import { errorToast } from '../../utils/toast'
import adminApiCall from '../../utils/adminApi'

interface DashboardStats {
  revenue: {
    current: number
    percentChange: number
  }
  orders: {
    total: number
    pending: number
    processing: number
    shipped: number
    completed: number
    cancelled: number
    failed: number
  }
  customers: {
    total: number
    newToday: number
    newThisWeek: number
  }
  lowStockProducts: Array<{
    _id: string
    name: string
    sku: string
    stock: number
    image: string
  }>
  topSellingProducts: Array<{
    _id: string
    name: string
    quantity: number
    revenue: number
  }>
  recentOrders: Array<{
    _id: string
    orderNumber: string
    customerName: string
    totalAmount: number
    orderStatus: string
    createdAt: string
  }>
  revenueChart: {
    comparisonType?: string
    current: Array<{
      date: string
      revenue: number
    }>
    previous: Array<{
      date: string
      revenue: number
    }>
  }
  paymentMethods: Array<{
    name: string
    value: number
    revenue: number
  }>
  products: {
    total: number
    active: number
    inactive: number
  }
  blogPosts: {
    total: number
    published: number
    draft: number
  }
  promotions: {
    total: number
    active: number
    inactive: number
  }
}

const AdminDashboard: React.FC = () => {
  // Custom Tooltip Component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const current = data.current || 0
      const previous = data.previous || 0
      const difference = current - previous
      const percentChange = previous > 0 ? ((difference / previous) * 100).toFixed(1) : 0
      const isPositive = difference >= 0

      // Calculate compare date based on comparison type (always previousPeriod)
      const currentDate = new Date(data.date)
      let compareDate = new Date(currentDate)
      let comparisonLabel = ''

      // previousPeriod - use auto-calculated range
      const rangeDays = Math.floor((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24))
      compareDate = new Date(currentDate.getTime() - rangeDays * 24 * 60 * 60 * 1000)
      comparisonLabel = 'Kỳ trước'

      const compareDateStr = compareDate.toISOString().split('T')[0]

      const formatDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-')
        return `${day}/${month}/${year}`
      }

      return (
        <div 
          className="bg-slate-900 border border-slate-700 rounded-lg p-5 shadow-2xl backdrop-blur-sm"
          style={{ zIndex: 9999, minWidth: '320px', transform: 'translateY(20px)' }}
        >
          <div className="mb-4 pb-3 border-b border-slate-700">
            <p className="text-xs text-slate-500 mb-2 font-semibold">Ngày so sánh:</p>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Hiện tại:</span>
                <span className="text-sm font-bold text-indigo-400">{formatDate(data.date)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{comparisonLabel}:</span>
                <span className="text-sm font-bold text-slate-400">{formatDate(compareDateStr)}</span>
              </div>
            </div>
          </div>
          
          {/* Current Period */}
          <div className="mb-3 pb-3 border-b border-slate-700">
            <p className="text-xs text-slate-400 mb-1">Current Period</p>
            <p className="text-sm font-bold text-indigo-400">
              {current.toLocaleString('vi-VN')}₫
            </p>
          </div>

          {/* Previous Period */}
          <div className="mb-3 pb-3 border-b border-slate-700">
            <p className="text-xs text-slate-400 mb-1">Previous Period</p>
            <p className="text-sm font-bold text-slate-400">
              {previous.toLocaleString('vi-VN')}₫
            </p>
          </div>

          {/* Change */}
          <div>
            <p className="text-xs text-slate-400 mb-1">Change</p>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                {isPositive ? '+' : ''}{difference.toLocaleString('vi-VN')}₫
              </span>
              <span className={`text-xs px-2 py-1 rounded font-bold ${
                isPositive 
                  ? 'bg-emerald-500/20 text-emerald-300' 
                  : 'bg-red-500/20 text-red-300'
              }`}>
                {isPositive ? '↑' : '↓'} {Math.abs(Number(percentChange))}%
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {isPositive 
                ? `📈 Doanh thu tăng ${Math.abs(Number(percentChange))}% so với kỳ trước` 
                : `📉 Doanh thu giảm ${Math.abs(Number(percentChange))}% so với kỳ trước`}
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const comparisonType = 'previousPeriod' // Default comparison type
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // First day of month
    endDate: new Date(), // Today
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Format dates as ISO string for API
        const startDate = dateRange.startDate.toISOString().split('T')[0]
        const endDate = dateRange.endDate.toISOString().split('T')[0]

        const { data, error } = await adminApiCall<DashboardStats>(
          `/admin/dashboard/stats?startDate=${startDate}&endDate=${endDate}&comparisonType=${comparisonType}`
        )

        if (error) {
          throw error
        }

        setStats(data)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error loading dashboard'
        errorToast(message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [dateRange])

  return (
    <AdminLayout>
      {/* Header Section */}
      <div className="flex justify-between items-end mb-12 relative">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
            Dashboard Overview
          </h2>
          <AdminBreadcrumb items={[{ label: 'Analytics' }]} />
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          {/* Date Range Picker */}
          <div className="bg-white px-6 py-4 rounded-lg border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors relative z-40">
            <div className="flex items-center gap-6">
              {/* Calendar Icon */}
              <span className="material-symbols-outlined text-indigo-600 text-lg flex-shrink-0">
                today
              </span>
              
              {/* From Date */}
              <div className="flex flex-col gap-1.5 flex-1 min-w-0 relative">
                <label className="text-[9px] uppercase tracking-widest font-semibold text-slate-500">
                  From
                </label>
                <DatePicker
                  selected={dateRange.startDate}
                  onChange={(date: Date | null) => {
                    if (date) {
                      setDateRange((prev) => ({
                        ...prev,
                        startDate: date,
                      }))
                    }
                  }}
                  selectsStart
                  startDate={dateRange.startDate}
                  endDate={dateRange.endDate}
                  dateFormat="MMM dd"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  className="text-sm font-semibold text-slate-900 bg-transparent border-0 outline-none cursor-pointer hover:text-indigo-600 transition-colors p-0"
                  wrapperClassName="react-datepicker-wrapper"
                />
              </div>

              {/* Divider */}
              <div className="w-px h-8 bg-slate-200 flex-shrink-0"></div>

              {/* To Date */}
              <div className="flex flex-col gap-1.5 flex-1 min-w-0 relative">
                <label className="text-[9px] uppercase tracking-widest font-semibold text-slate-500">
                  To
                </label>
                <DatePicker
                  selected={dateRange.endDate}
                  onChange={(date: Date | null) => {
                    if (date) {
                      setDateRange((prev) => ({
                        ...prev,
                        endDate: date,
                      }))
                    }
                  }}
                  selectsEnd
                  startDate={dateRange.startDate}
                  endDate={dateRange.endDate}
                  minDate={dateRange.startDate}
                  dateFormat="MMM dd"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  className="text-sm font-semibold text-slate-900 bg-transparent border-0 outline-none cursor-pointer hover:text-indigo-600 transition-colors p-0"
                  wrapperClassName="react-datepicker-wrapper"
                />
              </div>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const today = new Date()
                const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
                yesterday.setHours(0, 0, 0, 0)
                const todayEnd = new Date(today)
                todayEnd.setHours(23, 59, 59, 999)
                setDateRange({
                  startDate: yesterday,
                  endDate: todayEnd,
                })
              }}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all"
            >
              Yesterday
            </button>
            <button
              onClick={() => {
                const today = new Date()
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
                setDateRange({
                  startDate: startOfMonth,
                  endDate: today,
                })
              }}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all"
            >
              This Month
            </button>
            <button
              onClick={() => {
                const today = new Date()
                const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
                const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
                setDateRange({
                  startDate: lastMonth,
                  endDate: endOfLastMonth,
                })
              }}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all"
            >
              Last Month
            </button>
            <button
              onClick={() => {
                const today = new Date()
                const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
                setDateRange({
                  startDate: sevenDaysAgo,
                  endDate: today,
                })
              }}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all"
            >
              Last 7 Days
            </button>
          </div>

          {/* Export Button */}
          <button className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 rounded-xl text-white font-bold text-sm transition-all shadow-sm hover:shadow-md flex items-center gap-2">
            <span className="material-symbols-outlined text-base">download</span>
            Export
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-slate-500">Loading dashboard data...</p>
        </div>
      ) : stats ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-12">
            {/* Total Revenue */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden group md:col-span-2">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-100/30 rounded-full -mr-8 -mt-8"></div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
                  Total Revenue
                </span>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                  stats.revenue.percentChange >= 0
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'bg-red-50 text-red-600'
                }`}>
                  {stats.revenue.percentChange >= 0 ? '+' : ''}{stats.revenue.percentChange.toFixed(1)}%
                </span>
              </div>
              <div className="flex flex-col items-center justify-center py-8 px-4 bg-gradient-to-br from-indigo-50/50 to-transparent rounded-lg">
                <div className="text-4xl font-extrabold text-indigo-600 tracking-tight leading-tight text-center">
                  <div className="flex flex-col items-center">
                    <span>
                      {(stats.revenue.current).toLocaleString('vi-VN')} 
                      <span className="text-3xl pl-2 mb-2 text-slate-500 font-normal mt-2">VNĐ</span>
                    </span>
                   
                  </div>
                </div>
              </div>
            </div>

            {/* Orders Volume */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 md:col-span-2">
              <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
                  Orders Volume
                </span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight mb-4">
                {stats.orders.total}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col">
                  <span className="text-indigo-600 font-bold text-sm">{stats.orders.completed}</span>
                  <span className="text-[10px] text-slate-500">Completed</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-blue-600 font-bold text-sm">{stats.orders.processing}</span>
                  <span className="text-[10px] text-slate-500">Processing</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-cyan-600 font-bold text-sm">{stats.orders.shipped}</span>
                  <span className="text-[10px] text-slate-500">Shipped</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-amber-600 font-bold text-sm">{stats.orders.pending}</span>
                  <span className="text-[10px] text-slate-500">Pending</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-orange-600 font-bold text-sm">{stats.orders.cancelled}</span>
                  <span className="text-[10px] text-slate-500">Cancelled</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-red-600 font-bold text-sm">{stats.orders.failed}</span>
                  <span className="text-[10px] text-slate-500">Failed</span>
                </div>
              </div>
            </div>

            {/* Total Customers */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
                  Total Customers
                </span>
                <span className="material-symbols-outlined text-indigo-600 text-lg">
                  people
                </span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {stats.customers.total}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                +{stats.customers.newThisWeek} new this week
              </p>
            </div>

            {/* Low Stock Products */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
                  Low Stock Items
                </span>
                <span className="material-symbols-outlined text-amber-500 text-lg">
                  warning
                </span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {stats.lowStockProducts.length}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Require immediate restock
              </p>
            </div>
          </div>

          {/* Secondary KPI Cards - Resources Management */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Total Products */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
                  Total Products
                </span>
                <span className="material-symbols-outlined text-blue-600 text-lg">
                  inventory_2
                </span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
                {stats.products.total}
              </div>
            </div>

            {/* Total News */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
                  News
                </span>
                <span className="material-symbols-outlined text-purple-600 text-lg">
                  article
                </span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
                {stats.blogPosts.total}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Published</span>
                  <span className="text-xs font-bold text-purple-600">{stats.blogPosts.published}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Draft</span>
                  <span className="text-xs font-bold text-slate-400">{stats.blogPosts.draft}</span>
                </div>
              </div>
            </div>

            {/* Total Promotions */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
                  Promotions
                </span>
                <span className="material-symbols-outlined text-orange-600 text-lg">
                  local_offer
                </span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
                {stats.promotions.total}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Active</span>
                  <span className="text-xs font-bold text-orange-600">{stats.promotions.active}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Inactive</span>
                  <span className="text-xs font-bold text-slate-400">{stats.promotions.inactive}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Charts & Orders Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Left Column - Revenue Chart + Recent Orders */}
            <div className="lg:col-span-2 space-y-8">
              {/* Revenue Chart */}
              <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-900">Revenue Trend</h3>
                </div>
                <ResponsiveContainer width="100%" height={420}>
                  <LineChart data={
                    stats.revenueChart.current.map((item, idx) => ({
                      date: item.date,
                      current: item.revenue,
                      previous: stats.revenueChart.previous[idx]?.revenue || 0,
                    }))
                  }>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#94a3b8"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="#94a3b8"
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => (value / 1000000).toFixed(0) + 'M'}
                    />
                    <Tooltip 
                      content={<CustomTooltip />}
                      cursor={{ stroke: '#94a3b8', strokeWidth: 2 }}
                      wrapperStyle={{ outline: 'none' }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                    <Line 
                      type="monotone" 
                      dataKey="current" 
                      stroke="#4f46e5" 
                      strokeWidth={3}
                      dot={{ fill: '#4f46e5', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Current Period"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="previous" 
                      stroke="#cbd5e1" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: '#cbd5e1', r: 3 }}
                      activeDot={{ r: 5 }}
                      name="Previous Period"
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                  <p className="text-xs text-blue-900">
                    <span className="font-semibold">💡 Cách đọc:</span> So sánh doanh thu khoảng thời gian hiện tại (xanh đậm) với kỳ trước có độ dài bằng nhau (xám nhạt). Giúp bạn nhận diện xu hướng bán hàng.
                  </p>
                </div>
              </div>

              {/* Recent Orders Section */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-900">Recent Orders</h3>
                  <button className="text-indigo-600 text-sm font-semibold hover:underline">
                    View All
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-4 text-left text-[10px] uppercase tracking-widest font-bold text-slate-400">Order ID</th>
                        <th className="px-6 py-4 text-left text-[10px] uppercase tracking-widest font-bold text-slate-400">Customer</th>
                        <th className="px-6 py-4 text-left text-[10px] uppercase tracking-widest font-bold text-slate-400">Amount</th>
                        <th className="px-6 py-4 text-left text-[10px] uppercase tracking-widest font-bold text-slate-400">Status</th>
                        <th className="px-6 py-4 text-right text-[10px] uppercase tracking-widest font-bold text-slate-400">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stats.recentOrders.map((order) => {
                        const getStatusColor = (status: string) => {
                          switch(status) {
                            case 'completed':
                              return { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-600', label: 'Completed', border: 'border-emerald-200' }
                            case 'processing':
                              return { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-600', label: 'Processing', border: 'border-blue-200' }
                            case 'shipped':
                              return { bg: 'bg-cyan-100', text: 'text-cyan-700', dot: 'bg-cyan-600', label: 'Shipped', border: 'border-cyan-200' }
                            case 'pending':
                              return { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-600', label: 'Pending', border: 'border-yellow-200' }
                            case 'cancelled':
                              return { bg: 'bg-rose-100', text: 'text-rose-700', dot: 'bg-rose-600', label: 'Cancelled', border: 'border-rose-200' }
                            case 'failed':
                              return { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-600', label: 'Failed', border: 'border-red-200' }
                            default:
                              return { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400', label: status, border: 'border-slate-200' }
                          }
                        }
                        
                        const statusColor = getStatusColor(order.orderStatus)
                        const initials = order.customerName
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()
                        
                        return (
                          <tr key={order._id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-5 font-bold text-sm text-slate-900">{order.orderNumber}</td>
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full ${statusColor.bg} flex items-center justify-center ${statusColor.text} font-bold text-xs`}>
                                  {initials}
                                </div>
                                <span className="text-sm font-medium text-slate-900">{order.customerName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-5 font-bold text-sm text-slate-900">
                              {(order.totalAmount).toLocaleString('vi-VN')}₫
                            </td>
                            <td className="px-6 py-5">
                              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${statusColor.bg} ${statusColor.text} border ${statusColor.border}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${statusColor.dot}`}></span>
                                {statusColor.label}
                              </span>
                            </td>
                            <td className="px-6 py-5 text-right">
                              <button className="text-slate-400 hover:text-slate-600 transition-colors">
                                <span className="material-symbols-outlined">more_vert</span>
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                      {stats.recentOrders.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                            No recent orders found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column - Payment Mix + Inventory Alerts */}
            <div className="space-y-8">
              {/* Payment Mix */}
              <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Payment Methods</h3>
                {stats.paymentMethods && stats.paymentMethods.length > 0 ? (
                  <div className="space-y-6">
                    <ResponsiveContainer width="100%" height={350}>
                      <PieChart>
                        <Pie
                          data={stats.paymentMethods}
                          cx="50%"
                          cy="45%"
                          innerRadius={60}
                          outerRadius={110}
                          paddingAngle={2}
                          labelLine={true}
                          label={({ name, value }) => {
                            const total = stats.paymentMethods.reduce((sum, m) => sum + m.value, 0)
                            const percent = ((value / total) * 100).toFixed(0)
                            return `${name} ${percent}%`
                          }}
                          fill="#8884d8"
                          dataKey="value"
                          animationBegin={0}
                          animationDuration={600}
                        >
                          <Cell fill="#4f46e5" />
                          <Cell fill="#06b6d4" />
                          <Cell fill="#10b981" />
                          <Cell fill="#f59e0b" />
                          <Cell fill="#ef4444" />
                          <Cell fill="#8b5cf6" />
                        </Pie>
                        <Tooltip 
                          formatter={(value, name) => {
                            if (name === 'value') return [`${value} orders`, 'Orders']
                            return value
                          }}
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '2px solid #4f46e5',
                            borderRadius: '10px',
                            padding: '12px',
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
                          }}
                          labelStyle={{ color: '#e0e7ff', fontWeight: 'bold' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    
                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-3 border-t border-slate-200 pt-4">
                      {stats.paymentMethods.map((method, idx) => {
                        const colors = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
                        const totalOrders = stats.paymentMethods.reduce((sum, m) => sum + m.value, 0)
                        const percentage = ((method.value / totalOrders) * 100).toFixed(1)
                        return (
                          <div key={idx} className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: colors[idx % colors.length] }}></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-700 truncate">{method.name}</p>
                              <p className="text-[10px] text-slate-500">{method.value} orders ({percentage}%)</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="h-64 bg-gradient-to-b from-slate-50 to-slate-100 rounded-lg flex items-center justify-center">
                    <p className="text-slate-400">No payment data available</p>
                  </div>
                )}
              </div>

              {/* Inventory Alerts */}
              {stats.lowStockProducts.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-6 bg-amber-50 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-500">warning</span>
                      Inventory Alerts
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {stats.lowStockProducts.length} items requiring immediate restock
                    </p>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {stats.lowStockProducts.map((product) => (
                      <div key={product._id} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-200">
                            {product.image ? (
                              <img 
                                src={product.image} 
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="material-symbols-outlined text-slate-400">image</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 truncate">{product.name}</h4>
                            <p className="text-xs text-slate-500 mb-2">SKU: {product.sku}</p>
                            <p className={`text-xs font-bold ${
                              product.stock === 0 ? 'text-red-600' : 'text-amber-600'
                            }`}>
                              Stock: {product.stock}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </AdminLayout>
  )
}

export default AdminDashboard
