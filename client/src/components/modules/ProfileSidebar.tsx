import { FC } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Icon } from '../atomic'
import Button from '../atomic/Button'
import { cn } from '../../utils/cn'

interface SidebarItem {
  label: string
  path: string
  icon: string
}

interface ProfileSidebarProps {
  userName: string
  memberLevel: string
  avatar?: string
}

const ProfileSidebar: FC<ProfileSidebarProps> = ({ userName, memberLevel, avatar }) => {
  const navigate = useNavigate()
  const location = useLocation()

  const sidebarItems: SidebarItem[] = [
    { label: 'Account Settings', path: '/profile', icon: 'person' },
    { label: 'Order History', path: '/order-history', icon: 'history' },
    { label: 'Address Book', path: '/address-book', icon: 'location_on' },
    { label: 'Reward Points', path: '/reward-points', icon: 'military_tech' },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <div className="sticky space-y-4">
        {/* Profile Card */}
        <div className="bg-gradient-to-br from-indigo-950/60 to-slate-900/60 backdrop-blur-sm border border-indigo-500/30 rounded-xl p-4 shadow-lg shadow-indigo-500/10">
          <div className="flex items-center gap-3">
            <img
              src={avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`}
              alt={userName}
              className="w-12 h-12 rounded-lg object-cover border border-indigo-500/30"
            />
            <div>
              <h3 className="text-white font-bold text-sm">{userName}</h3>
              <p className="text-indigo-400 text-xs font-medium">{memberLevel}</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-2 bg-slate-900/30 border border-indigo-500/20 rounded-xl p-2">
          {sidebarItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition',
                isActive(item.path)
                  ? 'text-indigo-400 font-bold bg-indigo-500/20'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-indigo-500/10'
              )}
            >
              <Icon name={item.icon} size="sm" />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Status Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl p-4 text-white shadow-lg shadow-indigo-500/20">
          <p className="text-[10px] uppercase tracking-wider font-bold mb-1 opacity-80">Current Status</p>
          <p className="text-base font-bold mb-3">{memberLevel}</p>
          <Button variant="primary" size="sm" className="w-full">
            Upgrade to Elite
          </Button>
        </div>
      </div>
    </aside>
  )
}

export default ProfileSidebar
