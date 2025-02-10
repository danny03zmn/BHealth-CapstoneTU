import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import os from "os"; // Import OS module

dotenv.config();

// Determine the correct temporary directory
const tempDir = os.tmpdir(); // Works on both Windows and Linux
const tempCaCertPath = path.join(tempDir, "ca-cert.crt");

let ca;
if (process.env.CA_CERT_BASE64) {
  // Running on DigitalOcean: Decode and write to a temp file
  const decodedCert = Buffer.from(
    process.env.CA_CERT_BASE64,
    "base64"
  ).toString("utf-8");
  fs.writeFileSync(tempCaCertPath, decodedCert);
  ca = tempCaCertPath;
} else if (process.env.CA_CERT_PATH) {
  // Running locally: Use provided CA certificate path
  ca = path.resolve(process.env.CA_CERT_PATH);
} else {
  console.warn("⚠️ Warning: No CA certificate found. SSL might not work.");
}

const sequelize = new Sequelize(process.env.POSTGRES_URL, {
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
      ca: ca ? fs.readFileSync(ca, "utf8") : undefined,
    },
  },
});

export default sequelize;
