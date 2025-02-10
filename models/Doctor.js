import { Model, DataTypes } from "sequelize";
import sequelize from "../db.js";

class Doctor extends Model {}

Doctor.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    doctorname: {
      type: DataTypes.TEXT,
      field: "doctorname", // Match database column name
      allowNull: false,
    },
    doccontactnum: {
      type: DataTypes.TEXT,
      field: "doccontactnum", // Match database column name
      allowNull: false,
    },
    docemail: {
      type: DataTypes.TEXT,
      field: "docemail", // Match database column name
      allowNull: false,
    },
    clinicid: {
      type: DataTypes.INTEGER,
      field: "clinicid", // Match database column name
      references: {
        model: "clinics", // If Clinics table exists
        key: "id",
      },
    },
    countpending: {
      type: DataTypes.INTEGER,
      field: "countpending",
      defaultValue: 0,
    },
    countconfirmed: {
      type: DataTypes.INTEGER,
      field: "countconfirmed",
      defaultValue: 0,
    },
    countcompleted: {
      type: DataTypes.INTEGER,
      field: "countcompleted",
      defaultValue: 0,
    },
    rowstatus: {
      type: DataTypes.TEXT,
      field: "rowstatus", // Match database column name
      defaultValue: "Active", // Default value as per your schema
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Doctor",
    tableName: "doctors",
    timestamps: false,
  }
);

export default Doctor;
