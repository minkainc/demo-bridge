import {
  beginActionExisting,
  beginActionNew,
  endAction,
  saveIntent,
} from "./common.js";
import { ledgerSigner, notifyLedger } from "../ledger.js";
import {
  extractAndValidateData,
  validateAction,
  validateEntity,
} from "../validators.js";
import { transactionWrapper, updateEntry } from "../persistence.js";
import core from "../core.js";
import config from "../config.js";
import sleep from "sleep";

export async function prepareDebit(req, res) {
  const action = "prepare";

  console.log(`Preparing debit: instant signing is ${config.instantlySign}`);
  if (config.instantlySign) {
    // If the bridge is configured to instantly sign transactions,
    // we can skip the processing and return 202 Accepted to Ledger.
    res.sendStatus(202);

    await sleep.msleep(1000);

    // now we can also immediately sign the transaction by calling notifyLedger
    const entry = {
      handle: req.body.data.handle,
      hash: req.body.hash,
      data: req.body.data,
      meta: req.body.meta,
      schema: null,
      account: null,
      symbol: null,
      amount: null,
      state: null,
      previousState: null,
      actions: {
        prepare: {
          state: "prepared",
        },
      },
      processingAction: null,
      processingStart: null,
    };
    await notifyLedger(entry, action, ["prepared"]);
    return;
  }

  let { alreadyRunning, entry } = await beginActionNew({
    request: req,
    action,
  });

  res.sendStatus(202);

  if (!alreadyRunning) {
    await processPrepareDebit(entry);
    await endAction(entry);
  }

  await notifyLedger(entry, action, ["prepared", "failed"]);
}

async function processPrepareDebit(entry) {
  const action = entry.actions[entry.processingAction];
  let transaction;
  try {
    validateEntity(
      { hash: entry.hash, data: entry.data, meta: entry.meta },
      ledgerSigner
    );
    validateEntity(entry.data?.intent);
    validateAction(action.action, entry.processingAction);

    const { address, symbol, amount } = extractAndValidateData({
      entry,
      schema: "debit",
    });
    entry.schema = "debit";
    entry.account = address.account;
    entry.symbol = symbol;
    entry.amount = amount;

    await transactionWrapper(async (client) => {
      await updateEntry(client, entry);
    });
    await saveIntent(entry.data.intent);

    // Process the entry
    // Prepare for debit needs to check if the account exists, is active and hold the funds.
    // Since the core will throw an Error if the amount can not be put on hold for any reason, we
    // can try to hold the amount and catch the Error.
    transaction = core.hold(
      Number(entry.account),
      entry.amount,
      `${entry.handle}-hold`
    );
    action.coreId = transaction.id.toString();

    if (transaction.status !== "COMPLETED") {
      throw new Error(transaction.errorReason);
    }

    action.state = "prepared";
  } catch (error) {
    console.log(error);
    action.state = "failed";
    action.error = {
      reason: "bridge.unexpected-error",
      detail: error.message,
      failId: undefined,
    };
  }
}

export async function commitDebit(req, res) {
  const action = "commit";

  if (config.instantlySign) {
    // If the bridge is configured to instantly sign transactions,
    // we can skip the processing and return 202 Accepted to Ledger.
    res.sendStatus(202);

    // now we can also immediately sign the transaction by calling notifyLedger
    const entry = {
      handle: req.body.data.handle,
      hash: req.body.hash,
      data: req.body.data,
      meta: req.body.meta,
      schema: null,
      account: null,
      symbol: null,
      amount: null,
      state: null,
      previousState: null,
      actions: {
        commit: {
          state: "committed",
        },
      },
      processingAction: null,
      processingStart: null,
    };
    await notifyLedger(entry, action, ["committed"]);
    return;
  }

  let { alreadyRunning, entry } = await beginActionExisting({
    request: req,
    action,
    previousStates: ["prepared"],
  });

  res.sendStatus(202);

  if (!alreadyRunning) {
    await processCommitDebit(entry);
    await endAction(entry);
  }

  await notifyLedger(entry, action, ["committed"]);
}

async function processCommitDebit(entry) {
  const action = entry.actions[entry.processingAction];
  let transaction;
  try {
    validateEntity(
      { hash: action.hash, data: action.data, meta: action.meta },
      ledgerSigner
    );
    validateAction(action.action, entry.processingAction);

    transaction = core.release(
      Number(entry.account),
      entry.amount,
      `${entry.handle}-release`
    );
    action.coreId = transaction.id.toString();

    if (transaction.status !== "COMPLETED") {
      throw new Error(transaction.errorReason);
    }

    transaction = core.debit(
      Number(entry.account),
      entry.amount,
      `${entry.handle}-debit`
    );
    action.coreId = transaction.id.toString();

    if (transaction.status !== "COMPLETED") {
      throw new Error(transaction.errorReason);
    }

    action.state = "committed";
  } catch (error) {
    console.log(error);
    action.state = "error";
    action.error = {
      reason: "bridge.unexpected-error",
      detail: error.message,
      failId: undefined,
    };
  }
}

export async function abortDebit(req, res) {
  const action = "abort";
  let { alreadyRunning, entry } = await beginActionExisting({
    request: req,
    action,
    previousStates: ["prepared", "failed"],
  });

  res.sendStatus(202);

  if (!alreadyRunning) {
    await processAbortDebit(entry);
    await endAction(entry);
  }

  await notifyLedger(entry, action, ["aborted"]);
}

async function processAbortDebit(entry) {
  const action = entry.actions[entry.processingAction];
  let transaction;
  try {
    validateEntity(
      { hash: action.hash, data: action.data, meta: action.meta },
      ledgerSigner
    );
    validateAction(action.action, entry.processingAction);

    if (entry.previousState === "prepared") {
      transaction = core.release(
        Number(entry.account),
        entry.amount,
        `${entry.handle}-release`
      );
      action.coreId = transaction.id.toString();

      if (transaction.status !== "COMPLETED") {
        throw new Error(transaction.errorReason);
      }
    }

    action.state = "aborted";
  } catch (error) {
    console.log(error);
    action.state = "error";
    action.error = {
      reason: "bridge.unexpected-error",
      detail: error.message,
      failId: undefined,
    };
  }
}
