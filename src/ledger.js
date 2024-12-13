import ledgerSdk from "@minka/ledger-sdk";
import { config } from "./config.js";

const { LedgerSdk } = ledgerSdk;

// Populate this object with bank keys you have created previously
const bankKeyPair = {
  format: config.bankKeypairFormat,
  public: config.bankKeypairPublic,
  secret: config.bankKeypairSecret,
};

// Populate with Ledger public key data.
export const ledgerSigner = {
  format: config.ledgerKeypairFormat,
  public: config.ledgerKeypairPublic,
};

// Configure the Ledger SDK.
const ledger = new LedgerSdk({
  // This is the ledger instance we are going to connect to.
  ledger: config.ledgerHandle,
  server: config.ledgerUrl,
  secure: {
    aud: "demo",
    iss: "mint",
    keyPair: bankKeyPair,
    sub: bankKeyPair.public,
    exp: 3600,
  },
});

// This function is used to notify Ledger of Entry processing final statuses.
export async function notifyLedger(entry, action, notifyStates) {
  const notifyAction = entry.actions[action];

  if (!notifyStates.includes(notifyAction.state)) {
    return;
  }

  const custom = {
    handle: entry?.handle,
    status: notifyAction?.state,
    coreId: notifyAction?.coreId,
    reason: notifyAction?.error?.reason,
    detail: notifyAction?.error?.detail,
    failId: notifyAction?.error?.failId,
  };
  const ledgerResponse = await ledger.intent
    .from(entry.data.intent)
    .hash()
    .sign([
      {
        keyPair: bankKeyPair,
        custom,
      },
    ])
    .send();
  console.log(`SENT signature to Ledger\n${JSON.stringify(custom, null, 2)}`);
}
