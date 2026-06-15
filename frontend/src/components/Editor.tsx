import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  ClassicEditor,
  Essentials,
  Bold,
  Italic,
  Paragraph,
  Heading,
  List,
  Link,
  Table,
  TableToolbar,
  Undo,
  Indent,
  IndentBlock
} from 'ckeditor5';
import { Image, ImageToolbar, ImageCaption, ImageStyle, ImageUpload, ImageInsert, ImageBlock, ImageInline } from '@ckeditor/ckeditor5-image';
import { Base64UploadAdapter } from '@ckeditor/ckeditor5-upload';
import { TableProperties, TableCellProperties } from '@ckeditor/ckeditor5-table';
import { Underline } from '@ckeditor/ckeditor5-basic-styles';
import 'ckeditor5/ckeditor5.css';

const Editor = ({ value = '', onChange }: any) => {
  return (
    <div className="ck-editor-wrapper">
      <style>{`
        .ck-editor__editable_inline { min-height: 100px; padding: 0 20px !important; }
        .ck-content table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        .ck-content td { border: 1px solid #bfbfbf; padding: 8px; }
        .ck-content img { max-width: 100%; height: auto; display: block; margin: 10px 0; }
      `}</style>

      <CKEditor
        editor={ClassicEditor}
        config={{
          licenseKey: 'GPL',
          plugins: [
            Essentials, Bold, Italic, Underline, Paragraph, Heading, 
            List, Link, Table, TableToolbar, TableProperties, TableCellProperties,
            Undo, Indent, IndentBlock,
            Image, ImageToolbar, ImageCaption, ImageStyle, ImageUpload, 
            Base64UploadAdapter
          ],
          toolbar: [
            'undo', 'redo', '|', 'heading', '|', 
            'bold', 'italic', 'underline', '|',
            'link', 'insertTable', 'imageUpload', '|',
            'bulletedList', 'numberedList', 'indent', 'outdent'
          ],
          table: {
            contentToolbar: [
              'tableColumn', 'tableRow', 'mergeTableCells', 
              'tableProperties', 'tableCellProperties'
            ]
          },
          image: {
            toolbar: [
              'imageTextAlternative', '|', 
              'imageStyle:inline', 'imageStyle:block', 'imageStyle:side'
            ]
          }
        }}
        data={value}
        onChange={(_event: any, editor: any) => {
          onChange?.(editor.getData());
        }}
      />
    </div>
  );
};

export default Editor;
