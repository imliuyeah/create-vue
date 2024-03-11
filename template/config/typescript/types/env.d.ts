/// <reference types="vite/client" />
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const vueComponent: DefineComponent<{}, {}, any>
  export default vueComponent
}

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_BASE_URL: string
  readonly VITE_API_URL: string
  readonly VITE_BASE_PATH: string
}

declare global {
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}
