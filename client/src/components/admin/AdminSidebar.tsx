import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../../context/AdminAuthContext'

const AdminSidebar: React.FC = () => {
  const location = useLocation()
  const { logout, user, hasPermission } = useAdminAuth()

  const menuItems = [
    { label: 'Dashboard', icon: 'dashboard', path: '/admin/dashboard', permission: 'dashboard' },
    { label: 'Products', icon: 'inventory_2', path: '/admin/products', permission: 'products' },
    { label: 'Orders', icon: 'shopping_cart', path: '/admin/orders', permission: 'orders' },
    { label: 'Inventory', icon: 'warehouse', path: '/admin/inventory', permission: 'inventory' },
    { label: 'News', icon: 'newspaper', path: '/admin/news', permission: 'news' },
    { label: 'Settings', icon: 'settings', path: '/admin/settings', permission: 'settings' },
    { label: 'Users', icon: 'group', path: '/admin/users', adminOnly: true },
    { label: 'Promotions', icon: 'sell', path: '/admin/promotions', permission: 'promotions' },
    { label: 'Reviews', icon: 'rate_review', path: '/admin/reviews', permission: 'reviews' },  { label: 'Comments', icon: 'chat', path: '/admin/comments', permission: 'comments' },
  { label: 'Contacts', icon: 'contact_mail', path: '/admin/contacts', permission: 'contacts' },    { label: 'Audit Log', icon: 'history', path: '/admin/audit-log', adminOnly: true },
  ]

  const filteredMenuItems = menuItems.filter((item) => {
    // Admin-only items are visible only to admins
    if (item.adminOnly) return user?.role === 'admin'
    // Permission-based items
    if (item.permission) return hasPermission(item.permission)
    return true
  })

  const isActive = (path: string) => location.pathname === path

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col bg-slate-50 border-r border-slate-200 z-40">
      {/* Logo Section */}
      <div className="px-8 py-10 border-b border-slate-200">
        <Link to="/admin/dashboard" className="block">
          <h1 className="text-2xl font-bold tracking-tighter">
            <span className="text-slate-900">Volt</span>
            <span className="text-secondary">rix</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">
            Game Shop Admin
          </p>
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {filteredMenuItems.map((item) => {
          const active = isActive(item.path)
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                active
                  ? 'text-indigo-700 bg-indigo-50/50 font-bold border-r-4 border-indigo-600'
                  : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100'
              }`}
            >
              <span className="material-symbols-outlined text-lg" data-icon={item.icon}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer Section */}
      <div className="p-4 border-t border-slate-200 space-y-4">
        <button className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl font-bold text-sm shadow-sm hover:opacity-90 transition-opacity">
          Support Ticket
        </button>

        {/* Admin Profile */}
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-100 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-600 font-bold text-sm">
            {user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900 leading-none truncate">
              {user?.name || 'Admin Panel'}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {user?.role === 'admin' ? 'Administrator' : 'Staff'}
            </p>
          </div>
          <button
            onClick={logout}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            title="Logout"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
          </button>
        </div>
      </div>
    </aside>
  )
}

export default AdminSidebar
