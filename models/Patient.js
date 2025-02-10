import { Model, DataTypes } from "sequelize";
import sequelize from "../db.js";

class Patient extends Model {}

Patient.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    patientname: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    patcontactnum: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    lastvisit: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rowstatus: {
      type: DataTypes.TEXT,
      defaultValue: "Active", // Default value as per your schema
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Patient",
    tableName: "patients",
    timestamps: false, // Disable timestamps if not needed
  }
);

export default Patient;
