import React, { useRef, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react'
// @ts-ignore
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  height?: string
}

export interface RichTextEditorHandle {
  getHtml: () => string
}

const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(({
  value,
  onChange,
  placeholder = 'Enter product description...',
  height = '300px'
}, ref) => {
  const quillRef = useRef<any>(null)
  
  useImperativeHandle(ref, () => ({
    getHtml: () => {
      if (!quillRef.current) return ''
      const quill = quillRef.current.getEditor?.()
      if (!quill) return ''
      return quill.root.innerHTML || ''
    }
  }), [])

  // Upload image from clipboard paste
  const uploadImageFromFile = async (file: File, quill: any) => {
    try {
      const formData = new FormData()
      formData.append('images', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`,
        }
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('Upload failed:', result.message)
        return
      }

      if (result.data && result.data.length > 0) {
        const range = quill.getSelection()
        const index = range ? range.index : quill.getLength()
        quill.insertEmbed(index, 'image', result.data[0].url, 'user')
        quill.setSelection(index + 1, 0)
      }
    } catch (err) {
      console.error('Error uploading image:', err)
    }
  }

  // Memoize modules to prevent ReactQuill re-creating toolbar on every render
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'video'],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['clean']
    ]
  }), [])

  const formats = useMemo(() => [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'script',
    'color', 'background',
    'align',
    'blockquote', 'code-block',
    'link', 'image', 'video',
    'indent',
    'size'
  ], [])

  // Handle image paste from clipboard
  useEffect(() => {
    if (!quillRef.current) return

    const quill = quillRef.current.getEditor?.()
    if (!quill) return

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault()
          const file = items[i].getAsFile()
          if (file) {
            await uploadImageFromFile(file, quill)
          }
        }
      }
    }

    quill.root.addEventListener('paste', handlePaste)
    return () => {
      quill.root.removeEventListener('paste', handlePaste)
    }
  }, [])

  // ReactQuill onChange: (content: string, delta, source, editor)
  // content is already HTML string - just pass it through
  const handleChange = (content: string) => {
    onChange(content)
  }

  return (
    <div className="space-y-2">
      <style>
        {`
          .ql-container.ql-snow {
            border-bottom-left-radius: 0.5rem;
            border-bottom-right-radius: 0.5rem;
            font-size: 1rem;
            background: white;
          }
          .ql-toolbar.ql-snow {
            border-top-left-radius: 0.5rem;
            border-top-right-radius: 0.5rem;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
          }
          .ql-toolbar.ql-snow button:hover,
          .ql-toolbar.ql-snow button:focus,
          .ql-toolbar.ql-snow button.ql-active,
          .ql-toolbar.ql-snow .ql-picker-label:hover,
          .ql-toolbar.ql-snow .ql-picker-item:hover,
          .ql-toolbar.ql-snow .ql-picker-item.ql-selected {
            color: #4f46e5;
          }
          .ql-container.ql-snow {
            border: 1px solid #e2e8f0;
            border-top: none;
          }
          .ql-editor {
            min-height: ${height};
            padding: 1rem;
            font-family: inherit;
          }
          .ql-editor.ql-blank::before {
            color: #94a3b8;
            font-style: normal;
          }
        `}
      </style>
      {React.createElement(ReactQuill as any, {
        ref: quillRef,
        theme: 'snow',
        value: value || '',
        onChange: handleChange,
        modules,
        formats,
        placeholder
      })}
      <p className="text-xs text-slate-500 mt-2">
        Tip: Ban co the paste hinh anh truc tiep tu clipboard hoac su dung nut "Image" o toolbar
      </p>
    </div>
  )
})

RichTextEditor.displayName = 'RichTextEditor'

export default RichTextEditor
