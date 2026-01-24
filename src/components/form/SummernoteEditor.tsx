import React, { useEffect, useRef } from 'react';
import $ from 'jquery';
import SummernoteLite from 'react-summernote-lite';
import 'react-summernote-lite/dist/summernote-lite.min.css';

interface SummernoteEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
}

export const SummernoteEditor: React.FC<SummernoteEditorProps> = ({
  value,
  onChange,
  placeholder,
  height = 260
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

  return (
    <SummernoteLite
      ref={noteRef}
      defaultCodeValue={value}
      placeholder={placeholder}
      height={height}
      callbacks={{
        onChange: (contents: string) => onChange(contents)
      }}
    />
  );
};
