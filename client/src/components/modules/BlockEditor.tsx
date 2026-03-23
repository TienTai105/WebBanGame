import { FC, useState } from 'react'
import { Icon } from '../atomic'

interface Block {
  id?: string
  type: 'heading' | 'paragraph' | 'image' | 'image_grid' | 'list' | 'quote' | 'divider' | 'video' | 'code'
  level?: number
  text?: string
  items?: string[]
  url?: string
  alt?: string
  language?: string
  code?: string
  caption?: string
  columns?: number
  images?: Array<{
    url: string
    alt?: string
    caption?: string
  }>
}

interface BlockEditorProps {
  blocks: Block[]
  onChange: (blocks: Block[]) => void
}

export const BlockEditor: FC<BlockEditorProps> = ({ blocks, onChange }) => {
  const [editingId, setEditingId] = useState<string | null>(null)

  const addBlock = (type: Block['type']) => {
    const newBlock: Block = {
      id: `block_${Date.now()}`,
      type,
      ...(type === 'heading' && { level: 2, text: '' }),
      ...(type === 'paragraph' && { text: '' }),
      ...(type === 'list' && { items: [] }),
      ...(type === 'image' && { url: '', alt: '' }),
      ...(type === 'image_grid' && { columns: 2, images: [] }),
      ...(type === 'quote' && { text: '' }),
      ...(type === 'code' && { language: 'javascript', code: '' }),
      ...(type === 'video' && { url: '' }),
    }
    onChange([...blocks, newBlock])
  }

  const updateBlock = (id: string, updates: Partial<Block>) => {
    onChange(blocks.map(b => (b.id === id ? { ...b, ...updates } : b)))
  }

  const deleteBlock = (id: string) => {
    onChange(blocks.filter(b => b.id !== id))
  }

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    const idx = blocks.findIndex(b => b.id === id)
    if (idx === -1) return

    const newIdx = direction === 'up' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= blocks.length) return

    const newBlocks = [...blocks]
    ;[newBlocks[idx], newBlocks[newIdx]] = [newBlocks[newIdx], newBlocks[idx]]
    onChange(newBlocks)
  }

  return (
    <div className="space-y-4">
      {/* Block Type Buttons */}
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
        <p className="text-slate-300 text-sm font-medium mb-3">Add Block:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { type: 'heading', label: 'Heading', icon: 'title' },
            { type: 'paragraph', label: 'Paragraph', icon: 'description' },
            { type: 'list', label: 'List', icon: 'list' },
            { type: 'image', label: 'Image', icon: 'image' },
            { type: 'image_grid', label: 'Image Grid', icon: 'grid_3x3' },
            { type: 'quote', label: 'Quote', icon: 'format_quote' },
            { type: 'video', label: 'Video', icon: 'video_library' },
            { type: 'code', label: 'Code', icon: 'code' },
          ].map(({ type, label, icon }) => (
            <button
              key={type}
              onClick={() => addBlock(type as any)}
              className="p-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded text-xs font-medium transition flex items-center justify-center gap-1"
            >
              <Icon name={icon as any} size="sm" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Blocks List */}
      <div className="space-y-3">
        {blocks.map((block, idx) => (
          <BlockItem
            key={block.id}
            block={block}
            index={idx}
            total={blocks.length}
            isEditing={editingId === block.id}
            onEdit={() => setEditingId(block.id!)}
            onClose={() => setEditingId(null)}
            onUpdate={(updates) => updateBlock(block.id!, updates)}
            onDelete={() => deleteBlock(block.id!)}
            onMove={(dir) => moveBlock(block.id!, dir)}
          />
        ))}
      </div>

      {blocks.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <p>No blocks yet. Add one to get started!</p>
        </div>
      )}
    </div>
  )
}

interface BlockItemProps {
  block: Block
  index: number
  total: number
  isEditing: boolean
  onEdit: () => void
  onClose: () => void
  onUpdate: (updates: Partial<Block>) => void
  onDelete: () => void
  onMove: (dir: 'up' | 'down') => void
}

const BlockItem: FC<BlockItemProps> = ({
  block,
  index,
  total,
  isEditing,
  onEdit,
  onClose,
  onUpdate,
  onDelete,
  onMove,
}) => {
  const typeLabel = {
    heading: 'Heading',
    paragraph: 'Paragraph',
    list: 'List',
    image: 'Image',
    image_grid: 'Image Grid',
    quote: 'Quote',
    divider: 'Divider',
    video: 'Video',
    code: 'Code',
  }[block.type]

  const preview = {
    heading: block.text?.substring(0, 50) || '(no text)',
    paragraph: block.text?.substring(0, 50) || '(no text)',
    list: `${block.items?.length || 0} items`,
    image: block.url ? '(image set)' : '(no image)',
    image_grid: `${block.images?.length || 0} images`,
    quote: block.text?.substring(0, 50) || '(no text)',
    divider: '───────',
    video: block.url ? '(video set)' : '(no video)',
    code: block.language || 'code',
  }[block.type]

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div
        className="p-4 bg-slate-700/30 flex items-center justify-between cursor-pointer hover:bg-slate-700/50 transition"
        onClick={onEdit}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-slate-500 text-sm font-medium">{index + 1}.</span>
          <div className="min-w-0">
            <p className="text-white font-medium text-sm">{typeLabel}</p>
            <p className="text-slate-400 text-xs truncate">{preview}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onMove('up')
            }}
            disabled={index === 0}
            className="p-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Icon name="arrow_upward" size="sm" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onMove('down')
            }}
            disabled={index === total - 1}
            className="p-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Icon name="arrow_downward" size="sm" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            className="p-2 text-cyan-400 hover:text-cyan-300 transition"
          >
            <Icon name={isEditing ? 'expand_less' : 'expand_more'} size="sm" />
          </button>
        </div>
      </div>

      {/* Editor Panel */}
      {isEditing && (
        <div className="p-4 border-t border-slate-700/50 space-y-4">
          <BlockItemEditor
            block={block}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onClose={onClose}
          />
        </div>
      )}
    </div>
  )
}

interface BlockItemEditorProps {
  block: Block
  onUpdate: (updates: Partial<Block>) => void
  onDelete: () => void
  onClose: () => void
}

const BlockItemEditor: FC<BlockItemEditorProps> = ({ block, onUpdate, onDelete, onClose }) => {
  switch (block.type) {
    case 'heading':
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Level</label>
            <select
              value={block.level || 2}
              onChange={(e) => onUpdate({ level: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 text-white rounded text-sm"
            >
              {[1, 2, 3, 4, 5, 6].map((l) => (
                <option key={l} value={l}>
                  H{l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Text</label>
            <input
              type="text"
              value={block.text || ''}
              onChange={(e) => onUpdate({ text: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 text-white rounded text-sm"
              placeholder="Heading text..."
            />
          </div>
          <EditorActions onClose={onClose} onDelete={onDelete} />
        </div>
      )

    case 'paragraph':
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Text</label>
            <textarea
              value={block.text || ''}
              onChange={(e) => onUpdate({ text: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 text-white rounded text-sm resize-none"
              placeholder="Paragraph text..."
              rows={4}
            />
          </div>
          <EditorActions onClose={onClose} onDelete={onDelete} />
        </div>
      )

    case 'list':
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Items</label>
            <div className="space-y-2">
              {(block.items || []).map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const newItems = [...(block.items || [])]
                      newItems[idx] = e.target.value
                      onUpdate({ items: newItems })
                    }}
                    className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600/50 text-white rounded text-sm"
                    placeholder={`Item ${idx + 1}...`}
                  />
                  <button
                    onClick={() => {
                      const newItems = block.items?.filter((_, i) => i !== idx) || []
                      onUpdate({ items: newItems })
                    }}
                    className="px-2 py-2 text-red-400 hover:text-red-300"
                  >
                    <Icon name="delete" size="sm" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => onUpdate({ items: [...(block.items || []), ''] })}
              className="mt-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded text-sm transition"
            >
              + Add Item
            </button>
          </div>
          <EditorActions onClose={onClose} onDelete={onDelete} />
        </div>
      )

    case 'image':
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Image URL</label>
            <input
              type="text"
              value={block.url || ''}
              onChange={(e) => onUpdate({ url: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 text-white rounded text-sm"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Alt Text</label>
            <input
              type="text"
              value={block.alt || ''}
              onChange={(e) => onUpdate({ alt: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 text-white rounded text-sm"
              placeholder="Description..."
            />
          </div>
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Caption</label>
            <input
              type="text"
              value={block.caption || ''}
              onChange={(e) => onUpdate({ caption: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 text-white rounded text-sm"
              placeholder="Image caption..."
            />
          </div>
          <EditorActions onClose={onClose} onDelete={onDelete} />
        </div>
      )

    case 'quote':
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Quote Text</label>
            <textarea
              value={block.text || ''}
              onChange={(e) => onUpdate({ text: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 text-white rounded text-sm resize-none"
              placeholder="Quote text..."
              rows={3}
            />
          </div>
          <EditorActions onClose={onClose} onDelete={onDelete} />
        </div>
      )

    case 'code':
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Language</label>
            <input
              type="text"
              value={block.language || ''}
              onChange={(e) => onUpdate({ language: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 text-white rounded text-sm"
              placeholder="javascript"
            />
          </div>
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Code</label>
            <textarea
              value={block.code || ''}
              onChange={(e) => onUpdate({ code: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 text-white rounded text-sm resize-none font-mono text-xs"
              placeholder="Code..."
              rows={6}
            />
          </div>
          <EditorActions onClose={onClose} onDelete={onDelete} />
        </div>
      )

    case 'video':
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Video URL / Embed Code</label>
            <input
              type="text"
              value={block.url || ''}
              onChange={(e) => onUpdate({ url: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 text-white rounded text-sm"
              placeholder="https://youtube.com/embed/..."
            />
          </div>
          <EditorActions onClose={onClose} onDelete={onDelete} />
        </div>
      )

    case 'image_grid':
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Columns</label>
            <select
              value={block.columns || 2}
              onChange={(e) => onUpdate({ columns: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 text-white rounded text-sm"
            >
              {[1, 2, 3, 4].map((c) => (
                <option key={c} value={c}>
                  {c} Columns
                </option>
              ))}
            </select>
          </div>
          <EditorActions onClose={onClose} onDelete={onDelete} />
        </div>
      )

    default:
      return <EditorActions onClose={onClose} onDelete={onDelete} />
  }
}

interface EditorActionsProps {
  onClose: () => void
  onDelete: () => void
}

const EditorActions: FC<EditorActionsProps> = ({ onClose, onDelete }) => (
  <div className="flex gap-2 pt-2 border-t border-slate-700/50">
    <button
      onClick={onClose}
      className="flex-1 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded text-sm transition"
    >
      Done
    </button>
    <button
      onClick={onDelete}
      className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm transition"
    >
      <Icon name="delete" size="sm" />
    </button>
  </div>
)
