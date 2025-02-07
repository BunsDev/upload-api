import {
  S3Client
} from '@aws-sdk/client-s3'

import parseSqsEvent from '../utils/parse-sqs-event.js'

import { writeSatnavIndex } from '../index.js'

/**
 * Get EventRecord from the SQS Event triggering the handler
 *
 * @param {import('aws-lambda').SQSEvent} event
 */
export function handler (event) {
  const {
    SATNAV_BUCKET_NAME,
  } = getEnv()

  const record = parseSqsEvent(event)
  if (!record) {
    throw new Error('Unexpected sqs record format')
  }

  const s3Client = new S3Client({ region: record.bucketRegion })

  return writeSatnavIndex({
    record,
    s3Client,
    satnavBucketName: SATNAV_BUCKET_NAME
  })
}

/**
 * Get Env validating it is set.
 */
 function getEnv() {
  return {
    SATNAV_BUCKET_NAME: mustGetEnv('SATNAV_BUCKET_NAME'),
  }
}

/**
 * 
 * @param {string} name 
 * @returns {string}
 */
function mustGetEnv (name) {
  if (!process.env[name]) {
    throw new Error(`Missing env var: ${name}`)
  }

  // @ts-expect-error there will always be a string there, but typescript does not believe
  return process.env[name]
}
