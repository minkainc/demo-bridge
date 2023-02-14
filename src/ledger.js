import ledgerSdk from '@minka/ledger-sdk'

const { LedgerSdk } = ledgerSdk

// Populate this object with bank keys you have created previously
const bankKeyPair = {
  schema: 'ed25519',
  public: 'z8GMl1j5WA+se2bzp6zSTwdC7vgMSJ7QhcYZTPDNCI4=',
  secret: 'XRSFjrTNF9QGatin+PiOim2DnFgzZKiu5aebhGwDwgc=',
}

// Populate with Ledger public key data.
export const ledgerSigner = {
  schema: 'ed25519',
  public: 'MMawrEduwwwen5rVVQSwr11BurIhhu5sGO0nHreTnUg=',
}

// Configure the Ledger SDK.
const ledger = new LedgerSdk({
  // This is the ledger instance we are going to connect to.
  server: 'http://localhost:3000',
  // This is a public key of the ledger to verify requests sent
  // by the ledger to us, or responses returned by the ledger.
  key: ledgerSigner.public,
})

// Default record access.
const recordAccess = [
  {
    action: 'any',
    signer: bankKeyPair.public,
  },
  {
    action: 'any',
    bearer: bankKeyPair.public,
  },
]

// This function is used to notify Ledger of Entry processing final statuses.
export async function notifyLedger(entry, action, notifyStates) {
  const notifyAction = entry.actions[action]

  if (!notifyStates.includes(notifyAction.state)) {
    return
  }

  const custom = {
    handle: entry.handle,
    action: notifyAction.action,
    status: notifyAction.state,
    coreId: notifyAction.coreId,
    reason: notifyAction.error.reason,
    detail: notifyAction.error.detail,
    failId: notifyAction.error.failId,
  }
  const ledgerResponse = await ledger.intent
    .from(entry.data.intent)
    .hash()
    .sign([
      {
        keyPair: bankKeyPair,
        custom,
      },
    ])
    .send()
  console.log(`SENT signature to Ledger\n${JSON.stringify(custom, null, 2)}`)
}
