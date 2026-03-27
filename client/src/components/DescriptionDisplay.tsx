import React from 'react'
import DOMPurify from 'dompurify'

interface DescriptionDisplayProps {
  html: string
  className?: string
}

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
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  )
}

export default DescriptionDisplay
