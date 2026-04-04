import React from 'react'
import { useAdminAuth } from '../../context/AdminAuthContext'
import NotificationBell from '../modules/NotificationBell'

const AdminHeader: React.FC = () => {
  const { user } = useAdminAuth()

  return (
    <header className="fixed top-0 left-64 right-0 z-30 flex items-center justify-between px-8 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm">
      {/* Search Bar */}
      <div className="flex items-center gap-6 flex-1">
        <div className="relative w-64">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Search analytics..."
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all text-sm"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-6">
        {/* System Status */}
        <div className="text-slate-400 font-medium text-sm">
          System Status:{' '}
          <span className="text-indigo-600 font-semibold">Online</span>
        </div>

        {/* Icons & Actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <NotificationBell />
          
          <button className="text-slate-500 hover:text-indigo-600 transition-all p-2 rounded-lg hover:bg-slate-50">
            <span className="material-symbols-outlined">help_outline</span>
          </button>

          {/* Divider */}
          <div className="h-4 w-[1px] bg-slate-200"></div>

          {/* User Profile Dropdown */}
          <div className="flex items-center gap-3 px-3 py-1">
            <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center font-bold text-indigo-700 text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">
                {user?.role === 'admin' ? 'Administrator' : 'Staff'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default AdminHeader
