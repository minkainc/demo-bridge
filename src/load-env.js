import { fileURLToPath } from "url";
import { dirname, resolve as pathResolve } from "path";
import { config as dotenvConfig } from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = pathResolve(__dirname, ".env");

const output = dotenvConfig({ path: envPath });
// console.log(`Configured process: ${JSON.stringify(process.env, null, 2)}`);
// console.log(`Dotenv config output:\n${JSON.stringify(output, null, 2)}`);
