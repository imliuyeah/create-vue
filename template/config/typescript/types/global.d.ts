export {}
declare global {
  declare type VueNode = VNodeChild | JSX.Element

  type LocaleType = 'zh-CN' | 'en'

  type AxiosHeaders =
    | 'application/json'
    | 'application/x-www-form-urlencoded'
    | 'multipart/form-data'

  type AxiosMethod = 'get' | 'post' | 'delete' | 'put' | 'GET' | 'POST' | 'DELETE' | 'PUT'

  type AxiosResponseType = 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream'

  interface Fn<T = any> {
    (...arg: T[]): T
  }

  type Recordable<T = any, K = string> = Record<K extends null | undefined ? string : K, T>
  declare type Recordable<T = any> = Record<string, T>
  declare interface ViteEnv {
    VITE_USE_MOCK: Boolean
    VITE_USE_COMPRESS: Boolean
  }

  declare function parseInt(s: string | number, radix?: number): number

  declare function parseFloat(string: string | number): number
}

declare module 'vue' {
  export type JSXComponent<Props = any> =
    | { new (): ComponentPublicInstance<Props> }
    | FunctionalComponent<Props>
}

export interface IconTypes {
  className?: string
  iconName: string
}
