import { verifyResponseSignature } from '@minka/ledger-sdk'
import { ledgerSigner } from './ledger.js'

// Populate this with the wallet handle you created
const BANK_WALLET = 'bank1'

// Factor for usd is 100
const USD_FACTOR = 100

// Address regex used for validation and component extraction
const ADDRESS_REGEX =
  /^(((?<schema>[a-zA-Z0-9_\-+.]+):)?(?<handle>[a-zA-Z0-9_\-+.]+))(@(?<parent>[a-zA-Z0-9_\-+.]+))?$/

// TODO: use SDK validation to check the following:
//  - hash of event
//  - signature of event
//  - public key of event signer
//  - hash of intent
//  - signature of intent
//  - public key of intent signer
export function validateEntity(entity, signer) {
  // let foundSigner = false
  // for (let signature in entity.meta.signatures) {
  //   verifyResponseSignature(entity, {
  //     public: signature.public,
  //     schema: signature.schema,
  //   })
  //   if (
  //     signature.public === signer.public &&
  //     signature.schema === signer.schema
  //   ) {
  //     foundSigner = true
  //   }
  // }
  //
  // if (signer && !foundSigner) {
  //   throw new Error(`Signer ${signer} missing from signatures.`)
  // }
}

export function extractAndValidateAddress(address) {
  const result = ADDRESS_REGEX.exec(address)
  if (!result) {
    throw new Error(`Invalid address, got ${address}`)
  }
  const { schema, handle: account, parent } = result.groups

  if (parent !== BANK_WALLET) {
    throw new Error(
      `Expected address parent to be ${BANK_WALLET}, got ${parent}`,
    )
  }
  if (schema !== 'account') {
    throw new Error(`Expected address schema to be account, got ${schema}`)
  }
  if (!account || account.length === 0) {
    throw new Error('Account missing from credit request')
  }

  return {
    schema,
    account,
    parent,
  }
}

export function extractAndValidateAmount(rawAmount) {
  const amount = Number(rawAmount)
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error(`Positive integer amount expected, got ${amount}`)
  }
  return amount / USD_FACTOR
}

export function extractAndValidateSymbol(symbol) {
  // In general symbols other than usd are possible, but
  // we only support usd in the tutorial
  if (symbol !== 'usd') {
    throw new Error(`Symbol usd expected, got ${symbol}`)
  }
  return symbol
}

export function validateAction(action, expected) {
  if (action !== expected) {
    throw new Error(`Action ${expected} expected, got ${action}`)
  }
}

export function validateSchema(schema, expected) {
  if (schema !== expected) {
    throw new Error(`Schema ${expected} expected, got ${schema}`)
  }
}

export function extractAndValidateData({ entry, schema }) {
  const data = entry?.data

  validateSchema(data?.schema, schema)

  const rawAddress = data?.schema === 'credit' ? data.target : data.source
  const address = extractAndValidateAddress(rawAddress)
  const amount = extractAndValidateAmount(data.amount)
  const symbol = extractAndValidateSymbol(data.symbol)

  return {
    address,
    amount,
    symbol,
  }
}
