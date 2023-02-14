import 'pinia'

declare module 'pinia' {
  export interface DefineStoreOptionsBase<S, Store> {
    // allow defining a number of ms for any of the actions
    debounce?: Partial<Record<keyof StoreActions<Store>, number>>,
    readOnly?: boolean,
    subKey?: string
  }
  export interface PiniaCustomProperties {
    ready: Promise<void>
  }
}
