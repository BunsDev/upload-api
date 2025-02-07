import pRetry from 'p-retry'
import * as Server from '@ucanto/server'
import * as Upload from '@web3-storage/access/capabilities/upload'

/**
 * @typedef {import('@web3-storage/access/types').UploadAdd} UploadAddCapability
 * @typedef {import('@ucanto/interface').Failure} Failure
 * @typedef {import('../types').UploadAddResult} UploadAddResult
 */

/**
 * @param {import('../types').UploadServiceContext} context
 * @returns {import('@ucanto/interface').ServiceMethod<UploadAddCapability, UploadAddResult, Failure>}
 */
export function uploadAddProvider(context) {
  return Server.provide(
    Upload.add,
    async ({ capability, invocation }) => {
      const { root, shards } = capability.nb

      // Only use capability account for now to check if account is registered.
      // This must change to access account/info!!
      // We need to use https://github.com/web3-storage/w3protocol/blob/9d4b5bec1f0e870233b071ecb1c7a1e09189624b/packages/access/src/agent.js#L270
      const space = Server.DID.parse(capability.with).did()

      const [res] = await Promise.all([
        // Store in Database
        context.uploadTable.insert({
          space,
          root,
          shards,
          issuer: invocation.issuer.did(),
          invocation: invocation.cid
        }),
        writeDataCidToCarCidsMapping(
          context.dudewhereBucket,
          root,
          shards
        )
      ])

      return res
  })
}


/**
 * Writes to a "bucket DB" the mapping from a data CID to the car CIDs it is composed of.
 * Retries up to 3 times, in case of failures.
 *
 * @param {import("../types").DudewhereBucket} dudewhereStore
 * @param {Server.API.Link<unknown, number, number, 0 | 1>} root
 * @param {Server.API.Link<unknown, 514, number, 1>[] | undefined} shards
 */
 async function writeDataCidToCarCidsMapping(
  dudewhereStore,
  root,
  shards
) {
  const dataCid = root.toString()
  const carCids = shards?.map((/** @type {{ toString: () => any; }} */ s) => s.toString()) || []

  return Promise.all(carCids.map(async (/** @type {string} */ carCid) => {
    await pRetry(
      () => dudewhereStore.put(dataCid, carCid),
      { retries: 3 }
    )
  }))
}