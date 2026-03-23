import { FC } from 'react'

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

interface BlockRendererProps {
  block: Block
}

export const BlockRenderer: FC<BlockRendererProps> = ({ block }) => {
  switch (block.type) {
    case 'heading': {
      const level = (block.level || 1) as 1 | 2 | 3 | 4 | 5 | 6
      const headingClasses = {
        1: 'text-4xl font-black',
        2: 'text-3xl font-bold',
        3: 'text-2xl font-bold',
        4: 'text-xl font-bold',
        5: 'text-lg font-bold',
        6: 'text-base font-bold',
      }
      const Heading = `h${level}` as keyof JSX.IntrinsicElements

      return (
        <Heading className={`${headingClasses[level]} text-white my-6 leading-tight`}>
          {block.text}
        </Heading>
      )
    }

    case 'paragraph':
      return (
        <p className="text-slate-300 text-lg leading-8 my-4 whitespace-pre-wrap break-words">
          {block.text}
        </p>
      )

    case 'list':
      return (
        <ul className="list-disc list-inside space-y-3 my-6 ml-4">
          {block.items?.map((item, idx) => (
            <li key={idx} className="text-slate-300 text-base leading-relaxed">
              <span className="ml-2">{item}</span>
            </li>
          ))}
        </ul>
      )

    case 'image':
      return (
        <figure className="my-8">
          <img
            src={block.url}
            alt={block.alt || 'Article image'}
            className="w-full h-auto rounded-xl object-cover shadow-lg"
          />
          {block.caption && (
            <figcaption className="text-slate-400 text-sm text-center mt-3 italic">
              {block.caption}
            </figcaption>
          )}
        </figure>
      )

    case 'image_grid': {
      const columns = block.columns || 2
      const gridClass = {
        1: 'grid-cols-1',
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-3',
        4: 'grid-cols-2 md:grid-cols-4',
      }[Math.min(columns, 4)] || 'grid-cols-2'

      return (
        <div className={`grid ${gridClass} gap-6 my-8`}>
          {block.images?.map((img, idx) => (
            <figure key={idx}>
              <img
                src={img.url}
                alt={img.alt || `Image ${idx + 1}`}
                className="w-full h-64 object-cover rounded-xl shadow-lg"
              />
              {img.caption && (
                <figcaption className="text-slate-400 text-xs text-center mt-2 italic">
                  {img.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )
    }

    case 'quote':
      return (
        <blockquote className="border-l-4 border-cyan-500 pl-6 py-4 my-8 italic text-slate-300 bg-slate-800/30 rounded">
          {block.text}
        </blockquote>
      )

    case 'divider':
      return <hr className="my-8 border-slate-700" />

    case 'video':
      return (
        <div className="my-8 aspect-video rounded-xl overflow-hidden shadow-lg">
          <iframe
            src={block.url}
            title={block.caption || 'Video'}
            className="w-full h-full"
            allowFullScreen
            loading="lazy"
          />
        </div>
      )

    case 'code':
      return (
        <pre className="bg-slate-900 rounded-lg p-6 overflow-x-auto my-8 border border-slate-700">
          <code className={`text-slate-300 text-sm font-mono language-${block.language || 'plaintext'}`}>
            {block.code}
          </code>
        </pre>
      )

    default:
      return null
  }
}

interface BlocksRendererProps {
  blocks?: Block[]
}

export const BlocksRenderer: FC<BlocksRendererProps> = ({ blocks }) => {
  if (!blocks || blocks.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {blocks.map((block, idx) => (
        <BlockRenderer key={block.id || idx} block={block} />
      ))}
    </div>
  )
}
