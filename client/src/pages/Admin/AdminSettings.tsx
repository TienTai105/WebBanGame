import React from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import AdminBreadcrumb from '../../components/admin/AdminBreadcrumb'

const AdminSettings: React.FC = () => {
  return (
    <AdminLayout>
      <div className="mb-8">
        <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
          System Settings
        </h2>
        <AdminBreadcrumb items={[{ label: 'Settings' }]} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-6xl text-slate-300 mb-4 block">
            settings
          </span>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">
            System Settings
          </h3>
          <p className="text-slate-500 mb-6">
            Configure system preferences and settings
          </p>
          <button className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg font-bold hover:opacity-90 transition-opacity">
            View Settings
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminSettings
