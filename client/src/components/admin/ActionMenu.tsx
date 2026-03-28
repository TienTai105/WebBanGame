import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

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
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close on scroll
  useEffect(() => {
    if (!isOpen) return
    const handleScroll = () => setIsOpen(false)
    window.addEventListener('scroll', handleScroll, true)
    return () => window.removeEventListener('scroll', handleScroll, true)
  }, [isOpen])

  const handleToggle = useCallback(() => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const menuHeight = items.length * 44 + 8
      const spaceBelow = window.innerHeight - rect.bottom
      const openUp = spaceBelow < menuHeight + 8

      setPosition({
        top: openUp ? rect.top - menuHeight - 4 : rect.bottom + 4,
        left: rect.right - 224, // 224 = w-56 = 14rem
      })
    }
    setIsOpen((prev) => !prev)
  }, [isOpen, items.length])

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
    <div ref={menuRef}>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
      >
        <span className="material-symbols-outlined text-xl">more_vert</span>
      </button>

      {isOpen && position && createPortal(
        <div
          ref={dropdownRef}
          className="fixed w-56 bg-white rounded-lg shadow-lg border border-slate-200 z-[9999]"
          style={{ top: position.top, left: position.left }}
        >
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
        </div>,
        document.body
      )}
    </div>
  )
}

export default ActionMenu
