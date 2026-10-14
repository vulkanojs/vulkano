// Ambient types for checkJs (tsconfig.json): @vulkano/core globals the
// backend gets at runtime but no installed package declares for the root.
// Template-owned — the same in every Vulkano project. Frontend ambient types:
// types/frontend.d.ts. Project globals: types/app.d.ts.

// @vulkano/core globals (core README § Built-in Global Libs) — keep oxlint.config.mts `globals` in sync
declare const app: any;
declare const io: any;
declare const ApiClient: any;
declare const Download: any;
declare const Crontab: any;
declare const Encrypter: any;
declare const Filter: any;
declare const i18n: any;
declare const Jwt: any;
declare const Merge: any;
declare const mongoose: any;
declare const Paginate: any;
declare const Upload: any;
declare const View: any;
declare const VSError: any;
declare const ABS_PATH: string;
declare const APP_PATH: string;
declare const CORE_PATH: string;
declare const PUBLIC_PATH: string;
