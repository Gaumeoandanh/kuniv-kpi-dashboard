// Usage: npm run hash-password -- "yourStrongPassword"
// Prints a value to put in DASHBOARD_PASSWORD_HASH (.env.local / hosting env vars).
// Never commit the plaintext password or this hash to a public repo.
import { randomBytes, scryptSync } from "crypto";

const password = process.argv[2];
if (!password) {
  console.error('Usage: npm run hash-password -- "yourStrongPassword"');
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const hash = scryptSync(password, salt, 64).toString("hex");
console.log(`${salt}:${hash}`);
