import type {
  Failure,
  Invocation,
  ServiceMethod,
  UCANLink,
  DID,
} from '@ucanto/interface'
import type { API } from '@ucanto/server'

import {
  StoreAdd,
  StoreRemove,
  StoreList,
  UploadAdd,
  UploadRemove,
  UploadList
} from '@web3-storage/access/capabilities/types'

/** CID v0 or CID v1 */
export interface AnyLink extends API.Link<unknown, number, number, 0 | 1> {}

export interface Service {
  store: {
    add: ServiceMethod<StoreAdd, StoreAddResult, Failure>,
    remove: ServiceMethod<StoreRemove, void, Failure>,
    list: ServiceMethod<StoreList, ListResponse<StoreListItem>, Failure>,
  },
  upload: {
    add: ServiceMethod<UploadAdd, UploadAddResult, Failure>,
    remove: ServiceMethod<UploadRemove, void, Failure>,
    list: ServiceMethod<UploadList, ListResponse<UploadListItem>, Failure>,
  }
}

export interface StoreServiceContext {
  storeTable: StoreTable,
  carStoreBucket: CarStoreBucket,
  signer: Signer
  access: AccessClient
}

export interface UploadServiceContext {
  uploadTable: UploadTable,
  dudewhereBucket: DudewhereBucket
}

export interface UcantoServerContext extends StoreServiceContext, UploadServiceContext {}

export interface CarStoreBucket {
  has: (key: string) => Promise<boolean>
}

export interface DudewhereBucket {
  put: (dataCid: string, carCid: string) => Promise<void>
}

export interface StoreTable {
  exists: (space: DID, link: AnyLink) => Promise<boolean>
  insert: (item: StoreAddInput) => Promise<StoreAddOutput>
  remove: (space: DID, link: AnyLink) => Promise<void>
  list: (space: DID, options?: ListOptions) => Promise<ListResponse<StoreListItem>>
}

export interface UploadTable {
  exists: (space: DID, root: AnyLink) => Promise<boolean>
  insert: (item: UploadAddInput) => Promise<UploadAddResult>
  remove: (space: DID, root: AnyLink) => Promise<void>
  list: (space: DID, options?: ListOptions) => Promise<ListResponse<UploadListItem>>
}

export interface Signer {
  sign: (link: AnyLink) => { url: URL, headers: Record<string, string>}
}

export interface StoreAddInput {
  space: DID
  link: AnyLink
  size: number
  origin?: AnyLink
  issuer: DID
  invocation: UCANLink
}

export interface StoreAddOutput extends Omit<StoreAddInput, 'space' | 'issuer' | 'invocation'> {}

export interface StoreListItem extends StoreAddOutput {
  insertedAt: string
}

export interface StoreAddResult {
  status: 'upload' | 'done',
  with: API.URI<"did:">,
  link: AnyLink,
  url?: URL,
  headers?: Record<string, string>
}

export interface UploadAddInput {
  space: DID
  root: AnyLink
  shards?: AnyLink[] 
  issuer: DID
  invocation: UCANLink
}

export interface UploadAddResult extends Omit<UploadAddInput, 'space' | 'issuer' | 'invocation'> {}

export interface UploadListItem extends UploadAddResult {
  insertedAt: string
  updatedAt: string
}

export interface ListOptions {
  size?: number,
  cursor?: string
}

export interface ListResponse<R> {
  cursor?: string,
  size: number,
  results: R[]
}

export interface AccessClient {
  /**
   * Determines if the issuer of the invocation has received a delegation
   * allowing them to issue the passed invocation.
   */
  verifyInvocation: (invocation: Invocation) => Promise<boolean>
}

// would be generated by sst, but requires `sst build` to be run, which calls out to aws; not great for CI
declare module "@serverless-stack/node/config" {
  export interface SecretResources {
    "PRIVATE_KEY": {
      value: string;
    }
  }
}
