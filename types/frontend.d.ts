// Ambient types for checkJs (tsconfig.json): what Vite provides to frontend/
// code at runtime (SFC/style imports, import.meta.env). Template-owned.

declare module '*.vue' {
  const component: any;
  export default component;
}

declare module '*.scss';

interface ImportMeta {
  readonly env: Record<string, any> & { readonly DEV: boolean; readonly PROD: boolean };
}
