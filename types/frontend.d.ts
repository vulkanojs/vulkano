/// <reference types="vite-plus/client" />

// Ambient types for checkJs (tsconfig.json): frontend/ code. vite-plus/client
// covers import.meta.env/glob/hot and style/asset imports; only the SFC shim
// is hand-written. Template-owned.

declare module '*.vue' {
  const component: any;
  export default component;
}
