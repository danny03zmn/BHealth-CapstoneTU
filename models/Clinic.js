import { Model, DataTypes } from "sequelize";
import sequelize from "../db.js"; // Adjust the import based on your project structure

const Clinic = sequelize.define(
  "Clinic",
  {
    id: {
      type: DataTypes.BIGINT, // Corresponds to bigserial in PostgreSQL
      autoIncrement: true,
      primaryKey: true,
    },
    clinicname: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    cliniccontactnum: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    location: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    countdoctors: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    rowstatus: {
      type: DataTypes.TEXT,
      defaultValue: "Active",
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Clinic",
    tableName: "clinics", // Ensure the table name matches the one in your database
    timestamps: false, // If you don't have createdAt and updatedAt columns
  }
);

export default Clinic;
