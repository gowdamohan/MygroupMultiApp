import React, { useEffect, useRef } from 'react';
import $ from 'jquery';
import SummernoteLite from 'react-summernote-lite';
import 'react-summernote-lite/dist/summernote-lite.min.css';

interface SummernoteEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
  /**
   * Called when images are inserted via the editor toolbar or drag-and-drop.
   * Receives the raw File objects and an `insertImage(url, altText?)` callback
   * that embeds the resolved URL back into the editor.
   */
  onImageUpload?: (
    files: File[],
    insertImage: (url: string, altText?: string) => void
  ) => void;
}

export const SummernoteEditor: React.FC<SummernoteEditorProps> = ({
  value,
  onChange,
  placeholder,
  height = 260,
  onImageUpload
}) => {
  if (typeof window !== 'undefined') {
    (window as any).$ = $;
    (window as any).jQuery = $;
  }
  const noteRef = useRef<any>(null);

  useEffect(() => {
    if (noteRef.current && typeof noteRef.current.summernote === 'function') {
      const currentValue = noteRef.current.summernote('code');
      if (currentValue !== value) {
        noteRef.current.summernote('code', value || '');
      }
    }
  }, [value]);

  const buildCallbacks = () => {
    const callbacks: Record<string, any> = {
      onChange: (contents: string) => onChange(contents)
    };

    if (onImageUpload) {
      callbacks.onImageUpload = (files: File[]) => {
        const insertImage = (url: string, altText = 'image') => {
          if (noteRef.current && typeof noteRef.current.summernote === 'function') {
            noteRef.current.summernote('insertImage', url, altText);
          }
        };
        onImageUpload(files, insertImage);
      };
    }

    return callbacks;
  };

  return (
    <SummernoteLite
      ref={noteRef}
      defaultCodeValue={value}
      placeholder={placeholder}
      height={height}
      dialogsInBody={true}
      toolbar={[
        ['style', ['style']],
        ['font', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
        ['fontsize', ['fontsize']],
        ['color', ['color']],
        ['para', ['ul', 'ol', 'paragraph']],
        ['table', ['table']],
        ['insert', ['link', ...(onImageUpload ? ['picture'] : []), 'hr']],
        ['view', ['fullscreen', 'codeview']]
      ]}
      callbacks={buildCallbacks()}
    />
  );
};
