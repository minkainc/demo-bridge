export const config = {
  /**
   * If true, the bridge will sign the transactions instantly without checking anything
   * or saving anything into the database.
   */
  instantlySign: process.env.INSTANTLY_SIGN === "true",
  port: process.env.PORT || 3150,
  bankName: process.env.BANK_NAME || "Demo bank",
  dbPassword: process.env.DB_PASSWORD || "bridge-service",
  dbUsername: process.env.DB_USERNAME || "bridge-service",
  dbName: process.env.DB_NAME || "bridge-service",
  dbPort: process.env.DB_PORT || 5433,
  dbHost: process.env.DB_HOST || "localhost",
  ledgerUrl: process.env.LEDGER_URL || "http://localhost:3000/v2",
  ledgerHandle: process.env.LEDGER_HANDLE || "demo",
  bankKeypairSecret: process.env.BANK_KEYPAIR_SECRET,
  bankKeypairPublic: process.env.BANK_KEYPAIR_PUBLIC,
  bankKeypairFormat: process.env.BANK_KEYPAIR_FORMAT,
  ledgerKeypairPublic: process.env.LEDGER_KEYPAIR_PUBLIC,
  ledgerKeypairFormat: process.env.LEDGER_KEYPAIR_FORMAT,
};

export default config;
