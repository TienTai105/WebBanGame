import React from 'react'
import DOMPurify from 'dompurify'

interface DescriptionDisplayProps {
  html: string
  className?: string
}

const baseStyles = `text-slate-300 leading-relaxed max-w-none
  [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-white [&_h1]:tracking-tight [&_h1]:mt-3 [&_h1]:mb-2
  [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-white [&_h2]:tracking-tight [&_h2]:mt-3 [&_h2]:mb-2
  [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-white [&_h3]:tracking-tight [&_h3]:mt-3 [&_h3]:mb-1.5
  [&_h4]:text-lg [&_h4]:font-bold [&_h4]:text-white [&_h4]:mt-3 [&_h4]:mb-1
  [&_p]:text-slate-300 [&_p]:leading-relaxed [&_p]:mb-3
  [&_a]:text-cyan-400 [&_a]:underline [&_a]:decoration-cyan-400/30 hover:[&_a]:decoration-cyan-400
  [&_strong]:text-white [&_strong]:font-bold
  [&_em]:text-slate-200
  [&_blockquote]:border-l-2 [&_blockquote]:border-cyan-500/50 [&_blockquote]:text-slate-400 [&_blockquote]:italic [&_blockquote]:bg-slate-800/30 [&_blockquote]:py-2 [&_blockquote]:px-4 [&_blockquote]:rounded-r-lg [&_blockquote]:my-4
  [&_code]:text-cyan-300 [&_code]:bg-slate-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm
  [&_pre]:bg-slate-900 [&_pre]:border [&_pre]:border-slate-700/50 [&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:my-4 [&_pre]:overflow-x-auto
  [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4
  [&_li]:text-slate-300 [&_li]:mb-1 [&_li]:marker:text-cyan-500
  [&_hr]:border-slate-700/50 [&_hr]:my-8
  [&_img]:rounded-xl [&_img]:max-w-full [&_img]:shadow-lg [&_img]:border [&_img]:border-slate-700/50 [&_img]:my-4
  [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_th]:bg-slate-800 [&_th]:text-white [&_th]:p-2 [&_th]:border [&_th]:border-slate-700 [&_td]:p-2 [&_td]:border [&_td]:border-slate-700/50`

export const DescriptionDisplay: React.FC<DescriptionDisplayProps> = ({
  html,
  className = ''
}) => {
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'img', 'a', 'video', 'table', 'thead',
      'tbody', 'tr', 'td', 'th', 'span', 'div', 'code', 'pre'
    ],
    ALLOWED_ATTR: [
      'href', 'title', 'target', 'rel', 'src', 'alt', 'width', 'height',
      'style', 'class', 'data-*'
    ],
    KEEP_CONTENT: true
  })

  return (
    <div
      className={`${baseStyles} ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  )
}

export default DescriptionDisplay
