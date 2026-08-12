import React, { useRef, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'code-block'],
    ['clean'],
  ],
};

const formats = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'list',
  'bullet',
  'blockquote',
  'code-block',
];

const RichTextEditor = ({ value, onChange, placeholder = 'Write your note content here...' }) => {
  const quillRef = useRef(null);

  // Sync Quill instance when value changes externally (e.g. when editing a note)
  useEffect(() => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      if (editor && value !== undefined) {
        const currentHTML = editor.root.innerHTML;
        // If editor is empty or out of sync and not focused, sync HTML
        if ((currentHTML === '<p><br></p>' || currentHTML === '') && value) {
          editor.clipboard.dangerouslyPasteHTML(value);
        } else if (value && currentContentNotEqual(currentHTML, value) && !editor.hasFocus()) {
          editor.clipboard.dangerouslyPasteHTML(value);
        }
      }
    }
  }, [value]);

  const currentContentNotEqual = (html1, html2) => {
    if (!html1 || !html2) return html1 !== html2;
    return html1.trim() !== html2.trim();
  };

  return (
    <div className="rich-text-editor-container bg-white border border-slate-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value || ''}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="text-slate-900"
      />
      <style>{`
        .rich-text-editor-container .ql-toolbar.ql-snow {
          border: none;
          border-bottom: 1px solid #e2e8f0;
          background-color: #f8fafc;
        }
        .rich-text-editor-container .ql-container.ql-snow {
          border: none;
          min-height: 160px;
          font-family: inherit;
          font-size: 0.875rem;
        }
        .rich-text-editor-container .ql-editor {
          min-height: 160px;
          padding: 0.75rem 0.875rem;
        }
        .rich-text-editor-container .ql-editor.ql-blank::before {
          color: #94a3b8;
          font-style: normal;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
