import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

let ca;
if (process.env.CA_CERT_BASE64) {
  const decodedCert = Buffer.from(
    process.env.CA_CERT_BASE64,
    "base64"
  ).toString("utf-8");
  fs.writeFileSync("/tmp/ca-cert.crt", decodedCert); // Write to a temporary file
  ca = "/tmp/ca-cert.crt"; // Use the file path
} else {
  console.error(
    "⚠️ Warning: CA_CERT_BASE64 is not set in environment variables."
  );
}

const sequelize = new Sequelize(process.env.POSTGRES_URL, {
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
      ca: ca ? fs.readFileSync(ca, "utf8") : undefined, // Load certificate if available
    },
  },
});

export default sequelize;
