import React from 'react'
import AdminLayout from '../../components/admin/AdminLayout'

const AdminProducts: React.FC = () => {
  return (
    <AdminLayout>
      <div className="mb-8">
        <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
          Products Management
        </h2>
        <nav className="flex text-sm text-slate-500 gap-2">
          <a href="/admin/dashboard" className="hover:text-indigo-600">
            Admin Dashboard
          </a>
          <span>/</span>
          <span className="text-indigo-600 font-semibold">Products</span>
        </nav>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-6xl text-slate-300 mb-4 block">
            inventory_2
          </span>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">
            Products Management
          </h3>
          <p className="text-slate-500 mb-6">
            Manage your game products, inventory, and pricing
          </p>
          <button className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg font-bold hover:opacity-90 transition-opacity">
            Add New Product
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminProducts
