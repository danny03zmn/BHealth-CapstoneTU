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
    datetime: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    visittype: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    clinicid: {
      type: DataTypes.INTEGER,
      references: {
        model: "clinics", // Reference to the clinics table
        key: "id",
      },
      allowNull: false,
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
    doctorremarks: {
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
    modelName: "Visit",
    tableName: "visits",
    timestamps: false,
  }
);

export default Visit;
