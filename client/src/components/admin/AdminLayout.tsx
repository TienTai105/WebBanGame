import React, { ReactNode } from 'react'
import AdminSidebar from './AdminSidebar'
import AdminHeader from './AdminHeader'

interface AdminLayoutProps {
  children: ReactNode
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Header */}
      <AdminHeader />

      {/* Main Content */}
      <main className="ml-64 mt-16 p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-[calc(100vh-4rem)]">
        {children}
      </main>

      {/* Footer */}
      <footer className="ml-64 px-8 py-6 border-t border-slate-200 bg-slate-50 text-xs text-slate-400">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            <span>© 2024 Voltrix Game Shop. v1.0.0</span>
            <div className="flex gap-4">
              <a href="#" className="hover:text-indigo-600 underline transition-all">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-indigo-600 underline transition-all">
                Terms of Service
              </a>
              <a href="#" className="hover:text-indigo-600 underline transition-all">
                API Docs
              </a>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
            <span className="text-slate-500 font-medium">All systems operational</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default AdminLayout
