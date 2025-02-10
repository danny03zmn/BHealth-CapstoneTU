import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const caPath = path.resolve(process.env.DB_CA_CERT_PATH);
const ca = fs.readFileSync(caPath, "utf8");

const sequelize = new Sequelize(process.env.POSTGRES_URL, {
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
      ca: ca, // Use the CA certificate
    },
  },
});

export default sequelize;
