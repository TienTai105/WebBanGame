import React from 'react'
import { Link } from 'react-router-dom'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface AdminBreadcrumbProps {
  items: BreadcrumbItem[]
}

const AdminBreadcrumb: React.FC<AdminBreadcrumbProps> = ({ items }) => {
  return (
    <nav className="flex text-sm text-slate-500 gap-2">
      <Link to="/admin/dashboard" className="hover:text-indigo-600 transition-colors">
        Dashboard
      </Link>
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <span>/</span>
          {item.href ? (
            <Link to={item.href} className="hover:text-indigo-600 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-indigo-600 font-semibold">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}

export default AdminBreadcrumb
