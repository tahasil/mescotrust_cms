"use client";

import dynamic from "next/dynamic";
import { useMemo, useId } from "react";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

import "react-quill-new/dist/quill.snow.css";

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, false] }],
  ["bold", "italic", "underline", "strike"],
  [{ list: "ordered" }, { list: "bullet" }],
  ["blockquote", "code-block"],
  ["link", "image"],
  [{ align: [] }],
  ["clean"],
];

export default function RichTextEditor({ value, onChange, placeholder, textColor }) {
  const uid = useId().replace(/:/g, "");
  const className = `ql-custom-${uid}`;

  const modules = useMemo(
    () => ({
      toolbar: TOOLBAR_OPTIONS,
    }),
    []
  );

  return (
    <div style={{ marginBottom: 16 }}>
      {textColor && (
        <style>{`
          .${className} .ql-editor,
          .${className} .ql-editor p,
          .${className} .ql-editor span,
          .${className} .ql-editor span[style] {
            color: ${textColor} !important;
          }
          .${className} .ql-editor.ql-blank::before {
            color: ${textColor} !important;
            opacity: 0.5;
          }
        `}</style>
      )}
      <ReactQuill
        theme="snow"
        value={value || ""}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder || "Write content..."}
        className={textColor ? className : undefined}
        style={{ minHeight: 200 }}
      />
    </div>
  );
}
