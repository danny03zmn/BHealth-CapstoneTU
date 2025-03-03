import { Model, DataTypes } from "sequelize";
import sequelize from "../db.js";

class Visit extends Model {}

Visit.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    session: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    datetime: {
      type: DataTypes.DATE, // Change to DATE type
      allowNull: false,
    },
    visittype: {
      type: DataTypes.STRING, // Ensure proper string handling
      allowNull: false,
      defaultValue: "Unknown",
    },
    clinicid: {
      type: DataTypes.INTEGER,
      references: {
        model: "clinics",
        key: "id",
      },
      allowNull: false,
    },
    patientid: {
      type: DataTypes.INTEGER,
      references: {
        model: "patients",
        key: "id",
      },
      allowNull: false,
    },
    medinfo: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    medname: {
      type: DataTypes.TEXT, // Add missing field
      allowNull: true,
    },
    doctorremarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rowstatus: {
      type: DataTypes.STRING,
      defaultValue: "Active",
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Visit",
    tableName: "visits",
    timestamps: false,
  }
);

export default Visit;
