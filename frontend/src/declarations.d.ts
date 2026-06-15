// src/declarations.d.ts
declare module '@ckeditor/ckeditor5-react' {
    import React from 'react';
    export const CKEditor: React.FC<any>;
}

declare module 'ckeditor5' {
    export const ClassicEditor: any;
    export const Essentials: any;
    export const Bold: any;
    export const Italic: any;
    export const Link: any;
    export const List: any;
    export const Paragraph: any;
    export const Table: any;
    export const TableToolbar: any;
    export const Undo: any;
    export const Heading: any;
    export const Indent: any;
    export const IndentBlock: any;
}
