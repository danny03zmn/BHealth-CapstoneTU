import express from "express";
import { Sequelize, DataTypes, Op } from "sequelize"; // Import Op for querying
import session from "express-session";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import crypto from "crypto";
import Doctor from "./models/Doctor.js"; // Import the Doctor model
import Clinic from "./models/Clinic.js"; // Import the Doctor model
import Appointment from "./models/Appointment.js"; // Import the Doctor model
import Patient from "./models/Patient.js"; // Import the Doctor model
import moment from "moment-timezone";

Clinic.hasMany(Doctor, { foreignKey: "clinicid", as: "doctors" });
Doctor.belongsTo(Clinic, { foreignKey: "clinicid", as: "clinic" });
Doctor.hasMany(Appointment, { foreignKey: "doctorid", as: "appointments" });
Appointment.belongsTo(Doctor, { foreignKey: "doctorid", as: "doctor" });
Patient.hasMany(Appointment, { foreignKey: "patientid", as: "appointments" });
Appointment.belongsTo(Patient, { foreignKey: "patientid", as: "patient" });

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure the CA certificate is decoded and saved
let ca;
if (process.env.CA_CERT_BASE64) {
  const decodedCert = Buffer.from(
    process.env.CA_CERT_BASE64,
    "base64"
  ).toString("utf-8");
  fs.writeFileSync("/tmp/ca-cert.crt", decodedCert);
  ca = "/tmp/ca-cert.crt";
} else {
  console.error(
    "⚠️ Warning: CA_CERT_BASE64 is not set in environment variables."
  );
}
// Middleware for parsing JSON requests
app.use(express.json());

// Configure PostgreSQL connection
const sequelize = new Sequelize(process.env.POSTGRES_URL, {
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      ca: ca ? fs.readFileSync(ca, "utf8") : undefined, // Use the certificate
    },
  },
  logging: false,
});

// Test the database connection
(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ PostgreSQL connected successfully");
  } catch (err) {
    console.error("❌ Error connecting to PostgreSQL:", err);
  }
})();

// Sync models with the database
sequelize
  .sync({ alter: true }) // Use alter for development; use migrations in production
  .then(() => console.log("Database synced"))
  .catch((err) => console.error("Error syncing database:", err));

// Configure session
const secret = crypto.randomBytes(32).toString("hex");
app.use(
  session({
    secret: secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
    },
  })
);
console.log("Session secret:", secret);

// Serve static files from the 'public' directory
const publicDir = path.resolve(".");
app.use(express.static(publicDir));

// Default route: Serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

// Routes for managing doctor data

// GET /api/doctors - Fetch doctors with pagination and search
app.get("/api/doctors", async (req, res) => {
  const { search, limit = 10, page = 1 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const whereClause = { rowstatus: { [Op.ne]: "Deleted" } };

    if (search) {
      whereClause.doctorname = { [Op.iLike]: `%${search}%` };
    }

    const { count, rows } = await Doctor.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Clinic,
          as: "clinic",
          attributes: ["id", "clinicname"], // Fetch clinic name
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const formattedDoctors = rows.map((doctor) => ({
      id: doctor.id,
      doctorName: doctor.doctorname,
      docContactNum: doctor.doccontactnum,
      docEmail: doctor.docemail,
      clinicId: doctor.clinic ? doctor.clinic.id : null,
      clinicName: doctor.clinic ? doctor.clinic.clinicname : "N/A",
      countPending: doctor.countpending || 0,
      countConfirmed: doctor.countconfirmed || 0,
      countCompleted: doctor.countcompleted || 0,
    }));

    res.json({ doctors: formattedDoctors, total: count });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/doctors", async (req, res) => {
  const { doctorName, doctorEmail, doctorContactNum, workingClinic } = req.body;

  if (!doctorName || !doctorEmail || !doctorContactNum || !workingClinic) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const newDoctor = await Doctor.create({
      doctorname: doctorName,
      docemail: doctorEmail,
      doccontactnum: doctorContactNum,
      clinicid: workingClinic,
      countpending: 0,
      countconfirmed: 0,
      countcompleted: 0,
    });

    res
      .status(201)
      .json({ message: "Doctor added successfully", doctorId: newDoctor.id });
  } catch (error) {
    console.error("Failed to add doctor:", error);
    res.status(500).json({ message: "Failed to add doctor" });
  }
});

// PATCH /api/doctors/:id - Mark a doctor as deleted by updating rowstatus
app.patch("/api/doctors/:id", async (req, res) => {
  try {
    const doctorId = req.params.id;

    // Update rowstatus to 'Deleted'
    const updatedDoctor = await Doctor.update(
      { rowstatus: "Deleted" },
      { where: { id: doctorId } }
    );

    if (!updatedDoctor[0]) {
      // Sequelize update returns [numberOfAffectedRows]
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json({ message: "Doctor marked as deleted successfully" });
  } catch (error) {
    console.error("Failed to mark doctor as deleted:", error);
    res.status(500).json({ message: "Failed to mark doctor as deleted" });
  }
});

// DELETE /api/doctors/:id - Soft delete a doctor by updating rowstatus
app.delete("/api/doctors/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const doctor = await Doctor.findByPk(id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Mark the doctor as deleted by updating rowstatus
    await doctor.update({ rowstatus: "Deleted" });

    res.json({ message: "Doctor deleted successfully" });
  } catch (error) {
    console.error("Error deleting doctor:", error);
    res.status(500).json({ message: "Failed to delete doctor" });
  }
});

// Add API endpoint for clinics in server.js
app.get("/api/clinics", async (req, res) => {
  const { search, limit = 5, page = 1 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const whereClause = {
      rowstatus: { [Op.ne]: "Deleted" },
    };

    if (search) {
      whereClause.clinicname = { [Op.iLike]: `%${search}%` };
    }

    const { count, rows } = await Clinic.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const formattedClinics = rows.map((clinic) => ({
      id: clinic.id,
      clinicName: clinic.clinicname,
      clinicContactNum: clinic.cliniccontactnum,
      location: clinic.location,
      countDoctors: clinic.countdoctors || 0,
    }));

    res.json({ clinics: formattedClinics, total: count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/api/clinics/:id", async (req, res) => {
  const { id } = req.params;
  const { clinicName, clinicContactNum, location, countDoctors } = req.body;

  try {
    const clinic = await Clinic.findByPk(id); // Find the clinic by ID

    if (!clinic) {
      return res.status(404).json({ message: "Clinic not found" });
    }

    // Update the clinic details
    await clinic.update({
      clinicname: clinicName,
      cliniccontactnum: clinicContactNum,
      location: location,
      countdoctors: countDoctors,
    });

    res.json({
      message: "Clinic updated successfully",
      clinic,
    });
  } catch (error) {
    console.error("Error updating clinic:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/clinics - Add a new clinic
app.post("/api/clinics", async (req, res) => {
  const { clinicName, clinicContactNum, location } = req.body;

  if (!clinicName || !clinicContactNum || !location) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const newClinic = await Clinic.create({
      clinicname: clinicName,
      cliniccontactnum: clinicContactNum,
      location: location,
      countdoctors: 0, // Default to 0 doctors initially
    });

    res
      .status(201)
      .json({ message: "Clinic added successfully", clinicId: newClinic.id });
  } catch (error) {
    console.error("Failed to add clinic:", error);
    res.status(500).json({ message: "Failed to add clinic" });
  }
});

// GET /api/appointments - Fetch appointments with filtering by status
app.get("/api/appointments", async (req, res) => {
  const {
    status,
    sort = "id",
    order = "asc",
    limit = 5,
    page = 1,
    search,
  } = req.query;
  const offset = (page - 1) * limit;
  const todayStart = moment().startOf("day").utc().toISOString();
  const todayEnd = moment().endOf("day").utc().toISOString();

  let whereClause = { rowstatus: "Active" };

  if (status === "today") {
    whereClause.status = "upcoming";
    whereClause.scheduleddatetime = { [Op.between]: [todayStart, todayEnd] };
  } else if (status && status !== "all") {
    whereClause.status = status;
  }

  // Search filter for patient name
  if (search) {
    whereClause["$patient.patientname$"] = { [Op.iLike]: `%${search}%` };
  }

  // Ensure only valid sortable columns are used
  const validSortColumns = ["id", "scheduleddatetime"];
  const sortColumn = validSortColumns.includes(sort) ? sort : "id";
  const sortOrder = order === "desc" ? "DESC" : "ASC";

  try {
    const { count, rows } = await Appointment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Doctor,
          as: "doctor",
          attributes: ["id", "doctorname", "doccontactnum"],
        },
        {
          model: Patient,
          as: "patient",
          attributes: ["id", "patientname", "patcontactnum"],
        },
      ],
      order: [[sortColumn, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const formattedAppointments = rows.map((appointment) => ({
      id: appointment.id,
      doctorId: appointment.doctor ? appointment.doctor.id : null,
      doctorName: appointment.doctor
        ? appointment.doctor.doctorname
        : "Unknown",
      docContactNum: appointment.doctor
        ? appointment.doctor.doccontactnum
        : "N/A",
      patientId: appointment.patient ? appointment.patient.id : null,
      patientName: appointment.patient
        ? appointment.patient.patientname
        : "Unknown",
      patContactNum: appointment.patient
        ? appointment.patient.patcontactnum
        : "N/A",
      scheduleddatetime: appointment.scheduleddatetime,
      status: appointment.status,
      remarks: appointment.remarks || "",
    }));

    res.json({ appointments: formattedAppointments, total: count });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/appointments/:id - Fetch a single appointment by ID
app.get("/api/appointments/:id", async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        {
          model: Doctor,
          as: "doctor",
          attributes: ["id", "doctorname", "doccontactnum"],
        },
        {
          model: Patient,
          as: "patient",
          attributes: ["id", "patientname", "patcontactnum"],
        },
      ],
    });

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    res.json({
      id: appointment.id,
      doctorId: appointment.doctor ? appointment.doctor.id : null,
      doctorName: appointment.doctor
        ? appointment.doctor.doctorname
        : "Unknown",
      docContactNum: appointment.doctor
        ? appointment.doctor.doccontactnum
        : "N/A",
      patientId: appointment.patient ? appointment.patient.id : null,
      patientName: appointment.patient
        ? appointment.patient.patientname
        : "Unknown",
      patContactNum: appointment.patient
        ? appointment.patient.patcontactnum
        : "N/A",
      scheduleddatetime: appointment.scheduleddatetime,
      status: appointment.status,
      remarks: appointment.remarks || "",
    });
  } catch (error) {
    console.error("Error fetching appointment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/api/appointments/:id", async (req, res) => {
  const { doctorId, scheduleddatetime, status, remarks } = req.body;

  try {
    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    await appointment.update({
      doctorid: doctorId || appointment.doctorid, // Keep existing doctor if not changed
      scheduleddatetime: moment
        .utc(scheduleddatetime)
        .format("YYYY-MM-DD HH:mm:ss"), // Store in UTC
      status: status || appointment.status,
      remarks: remarks !== undefined ? remarks : appointment.remarks,
    });

    res.json({ message: "Appointment updated successfully" });
  } catch (error) {
    console.error("Error updating appointment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/patients - Fetch patients with pagination and search
app.get("/api/patients", async (req, res) => {
  const { search, limit = 10, page = 1 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const whereClause = { rowstatus: { [Op.ne]: "Deleted" } };

    if (search) {
      whereClause.patientname = { [Op.iLike]: `%${search}%` };
    }

    const { count, rows } = await Patient.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const formattedPatients = rows.map((patient) => ({
      id: patient.id,
      patientName: patient.patientname,
      contactNumber: patient.patcontactnum,
      lastVisit: patient.lastvisit
        ? moment(patient.lastvisit).toISOString()
        : null,
    }));

    res.json({ patients: formattedPatients, total: count });
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/patients/:id - Update patient details
app.put("/api/patients/:id", async (req, res) => {
  const { id } = req.params;
  const { patientName, patientContactNum } = req.body;

  try {
    const patient = await Patient.findByPk(id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    await patient.update({
      patientname: patientName,
      patcontactnum: patientContactNum,
    });

    res.json({ message: "Patient updated successfully", patient });
  } catch (error) {
    console.error("Error updating patient:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/patients - Add a new patient
app.post("/api/patients", async (req, res) => {
  const { patientName, patientContactNum } = req.body;

  if (!patientName || !patientContactNum) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const newPatient = await Patient.create({
      patientname: patientName,
      patcontactnum: patientContactNum,
      lastvisit: null, // No last visit initially
      rowstatus: "Active",
    });

    res.status(201).json({
      message: "Patient added successfully",
      patientId: newPatient.id,
    });
  } catch (error) {
    console.error("Failed to add patient:", error);
    res.status(500).json({ message: "Failed to add patient" });
  }
});

// DELETE /api/patients/:id - Soft delete a patient by updating rowstatus
app.delete("/api/patients/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const patient = await Patient.findByPk(id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Mark the patient as deleted by updating rowstatus
    await patient.update({ rowstatus: "Deleted" });

    res.json({ message: "Patient deleted successfully" });
  } catch (error) {
    console.error("Error deleting patient:", error);
    res.status(500).json({ message: "Failed to delete patient" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
