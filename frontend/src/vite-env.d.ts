// / <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_APP_URL: string;
    readonly VITE_APP_ENV: string;
    readonly VITE_BACKEND_PORT: number;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}