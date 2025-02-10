import { Model, DataTypes } from "sequelize";
import sequelize from "../db.js";

class Medication extends Model {}

Medication.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    patientid: {
      type: DataTypes.INTEGER,
      references: {
        model: "patients", // Reference to the patients table
        key: "id",
      },
      allowNull: false,
    },
    medinfo: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    medname: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    datetofinish: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rowstatus: {
      type: DataTypes.TEXT,
      defaultValue: "Active",
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Medication",
    tableName: "medications",
    timestamps: false,
  }
);

export default Medication;
