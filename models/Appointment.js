import { Model, DataTypes } from "sequelize";
import sequelize from "../db.js";
import Doctor from "./Doctor.js";
import Patient from "./Patient.js";

class Appointment extends Model {}

Appointment.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    doctorid: {
      type: DataTypes.INTEGER,
      references: {
        model: "doctors", // Reference to the doctors table
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
    scheduleddatetime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal("CURRENT_TIMESTAMP AT TIME ZONE 'UTC'"),
    },
    status: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        isIn: [["pending", "upcoming", "completed", "cancelled"]], // Valid statuses
      },
    },
    remarks: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    rowstatus: {
      type: DataTypes.TEXT,
      defaultValue: "Active",
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Appointment",
    tableName: "appointments",
    timestamps: false,
  }
);

export default Appointment;
