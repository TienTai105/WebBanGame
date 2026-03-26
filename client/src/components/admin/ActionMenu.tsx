import React, { useState, useRef, useEffect } from 'react'

export interface ActionMenuItem {
  icon: string
  label: string
  color?: 'default' | 'indigo' | 'red'
  onClick: () => void
}

interface ActionMenuProps {
  items: ActionMenuItem[]
}

const ActionMenu: React.FC<ActionMenuProps> = ({ items }) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getColorClass = (color?: string) => {
    switch (color) {
      case 'indigo':
        return 'text-indigo-600 hover:bg-indigo-50'
      case 'red':
        return 'text-red-600 hover:bg-red-50'
      default:
        return 'text-slate-700 hover:bg-slate-50'
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
      >
        <span className="material-symbols-outlined text-xl">more_vert</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 z-40">
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick()
                setIsOpen(false)
              }}
              className={`w-full px-4 py-2.5 text-left flex items-center gap-3 transition-all ${
                index === 0 ? 'first:rounded-t-lg' : ''
              } ${index === items.length - 1 ? 'last:rounded-b-lg' : ''} ${getColorClass(item.color)}`}
            >
              <span
                className="material-symbols-outlined text-lg"
                style={item.color === 'indigo' ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ActionMenu
