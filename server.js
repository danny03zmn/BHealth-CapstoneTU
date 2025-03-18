import express from "express";
import { Sequelize, Op } from "sequelize";
import session from "express-session";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import { ethers } from "ethers";
import os from "os";
import { Client, Account, Users } from "node-appwrite";
import Doctor from "./models/Doctor.js";
import Clinic from "./models/Clinic.js";
import Appointment from "./models/Appointment.js";
import Patient from "./models/Patient.js";
import Visit from "./models/Visit.js";
import cookieParser from "cookie-parser";
import moment from "moment-timezone";

Clinic.hasMany(Doctor, { foreignKey: "clinicid", as: "doctors" });
Doctor.belongsTo(Clinic, { foreignKey: "clinicid", as: "clinic" });
Doctor.hasMany(Appointment, { foreignKey: "doctorid", as: "appointments" });
Appointment.belongsTo(Doctor, { foreignKey: "doctorid", as: "doctor" });
Patient.hasMany(Appointment, { foreignKey: "patientid", as: "appointments" });
Appointment.belongsTo(Patient, { foreignKey: "patientid", as: "patient" });
Visit.belongsTo(Clinic, { foreignKey: "clinicid", as: "clinic" });

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const isProduction = process.env.NODE_ENV === "production";

// ----------------------
// Appwrite Client (No API Key for Authentication)
// ----------------------
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID);

const account = new Account(client);

// ----------------------
// CORS Configuration
// ----------------------
app.use(
  cors({
    origin: isProduction ? "https://bhealth.systems" : "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// ---------------------------
// Blockchain Configuration
// ---------------------------
const { JsonRpcProvider } = ethers.providers;
const provider = new JsonRpcProvider(process.env.ETH_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  JSON.parse(process.env.CONTRACT_ABI),
  wallet
);

// ---------------------------
// PostgreSQL Connection with SSL
// ---------------------------
const tempDir = os.tmpdir();
const tempCaCertPath = path.join(tempDir, "ca-cert.crt");

let ca;
if (process.env.CA_CERT_BASE64) {
  const decodedCert = Buffer.from(
    process.env.CA_CERT_BASE64,
    "base64"
  ).toString("utf-8");
  fs.writeFileSync(tempCaCertPath, decodedCert);
  ca = tempCaCertPath;
}

const sequelize = new Sequelize(process.env.POSTGRES_URL, {
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
      ca: ca ? fs.readFileSync(ca, "utf8") : undefined,
    },
  },
  logging: false,
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ PostgreSQL connected successfully");
  } catch (err) {
    console.error("❌ Error connecting to PostgreSQL:", err);
  }
})();

// ----------------------
// Middleware Setup
// ----------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/assets", express.static(path.join(process.cwd(), "assets")));

// ----------------------
// Session Configuration
// ----------------------
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      sameSite: isProduction ? "None" : "Lax",
    },
  })
);

// Serve static files from the public directory
const publicDir = path.resolve(".");
app.use(express.static(publicDir));

// ----------------------
// Config Route (Expose to Client)
// ----------------------
app.get("/config", (req, res) => {
  res.json({
    APPWRITE_ENDPOINT: process.env.APPWRITE_ENDPOINT,
    APPWRITE_PROJECT_ID: process.env.APPWRITE_PROJECT_ID,
    APPWRITE_API_KEY: process.env.APPWRITE_API_KEY,
  });
});

// ----------------------
// User Authentication
// ----------------------
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Authenticate user
    const session = await account.createEmailPasswordSession(email, password);

    // Store session ID in a cookie
    res.cookie("appwriteSession", session.$id, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "None" : "Lax",
    });

    res.json({ redirect: "/appointments.html", sessionId: session.$id });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(401).json({ message: "Invalid credentials. Please try again." });
  }
});

// GET /logout - Destroy session and clear cookies
app.post("/logout", async (req, res) => {
  try {
    const sessionId = req.cookies.appwriteSession;
    if (sessionId) {
      await account.deleteSession(sessionId);
    }

    res.clearCookie("appwriteSession");
    res.json({ redirect: "/login.html" });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({ message: "Error logging out" });
  }
});

// Serve static files (CSS, JS, images)
const rootDir = path.resolve(".");
app.use(express.static(rootDir));

// ----------------------
// Serve `appointments.html` as the default page
// ----------------------
app.get("/", (req, res) => {
  res.sendFile(path.join(rootDir, "appointments.html"));
});

// ----------------------
// Middleware to Protect Routes
// ----------------------
const isAuthenticated = async (req, res, next) => {
  const sessionId = req.cookies.appwriteSession;

  if (!sessionId) {
    return res.redirect("/login.html");
  }

  try {
    // Ensure Appwrite client has API key
    client.setKey(process.env.APPWRITE_API_KEY);

    // Set session token before fetching user data
    client.setSession(sessionId);

    // Fetch user session
    const user = await account.get();

    if (!user) {
      throw new Error("User session invalid");
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Session Verification Failed:", error);
    res.clearCookie("appwriteSession");
    return res.redirect("/login.html");
  }
};

// ----------------------
// Secure Routes
// ----------------------
app.get("/", isAuthenticated, (req, res) => {
  res.sendFile(path.join(publicDir, "appointments.html"));
});

app.get("/:page.html", isAuthenticated, (req, res) => {
  res.sendFile(path.join(publicDir, `${req.params.page}.html`));
});

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

    // Log action to the blockchain (log doctor creation)
    const tx = await contract.logAction(newDoctor.id, "doctor", "INSERT", {
      gasLimit: 500000, // specify gas limit
      gasPrice: ethers.utils.parseUnits("20", "gwei"), // specify gas price
    });
    console.log("Transaction sent:", tx.hash);

    // Wait for the transaction to be mined and get the receipt
    const receipt = await tx.wait();
    console.log("Transaction receipt:", receipt);

    // Check the status of the transaction
    if (receipt.status === 1) {
      console.log("Blockchain transaction was successful!");
    } else {
      console.log("Blockchain transaction failed!");
    }

    res
      .status(201)
      .json({ message: "Doctor added successfully", doctorId: newDoctor.id });
  } catch (error) {
    console.error("Failed to add doctor:", error);
    res.status(500).json({ message: "Failed to add doctor" });
  }
});

// PUT /api/doctors/:id - Update doctor details
app.put("/api/doctors/:id", async (req, res) => {
  const { id } = req.params;
  const { doctorName, docContactNum, docEmail, clinicId } = req.body;

  try {
    const doctor = await Doctor.findByPk(id);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    await doctor.update({
      doctorname: doctorName || doctor.doctorname,
      doccontactnum: docContactNum || doctor.doccontactnum,
      docemail: docEmail || doctor.docemail,
      clinicid: clinicId || doctor.clinicid,
    });

    // Log action to the blockchain (log doctor update)
    const tx = await contract.logAction(doctor.id, "doctor", "UPDATE", {
      gasLimit: 500000, // specify gas limit
      gasPrice: ethers.utils.parseUnits("20", "gwei"), // specify gas price
    });
    console.log("Transaction sent:", tx.hash);

    // Wait for the transaction to be mined and get the receipt
    const receipt = await tx.wait();
    console.log("Transaction receipt:", receipt);

    // Check the status of the transaction
    if (receipt.status === 1) {
      console.log("Blockchain transaction was successful!");
    } else {
      console.log("Blockchain transaction failed!");
    }

    res.json({ message: "Doctor updated successfully", doctor });
  } catch (error) {
    console.error("Error updating doctor:", error);
    res.status(500).json({ message: "Failed to update doctor" });
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

    // Log action to the blockchain (log doctor deletion)
    const tx = await contract.logAction(id, "doctor", "DELETE", {
      gasLimit: 500000, // specify gas limit
      gasPrice: ethers.utils.parseUnits("20", "gwei"), // specify gas price
    });
    console.log("Transaction sent:", tx.hash);

    // Wait for the transaction to be mined and get the receipt
    const receipt = await tx.wait();
    console.log("Transaction receipt:", receipt);

    // Check the status of the transaction
    if (receipt.status === 1) {
      console.log("Blockchain transaction was successful!");
    } else {
      console.log("Blockchain transaction failed!");
    }

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

  let whereClause = { rowstatus: "Active" };

  if (status === "today") {
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0))
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
    const todayEnd = new Date(today.setHours(23, 59, 59, 999))
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
    whereClause.scheduleddatetime = { [Op.between]: [todayStart, todayEnd] };
  } else if (status && status !== "all") {
    whereClause.status = status;
  }

  if (search) {
    whereClause["$patient.patientname$"] = { [Op.iLike]: `%${search}%` };
  }

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
      order: [[sort, order === "desc" ? "DESC" : "ASC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const formattedAppointments = rows.map((appointment) => ({
      id: appointment.id,
      doctorName: appointment.doctor
        ? appointment.doctor.doctorname
        : "Unknown",
      docContactNum: appointment.doctor
        ? appointment.doctor.doccontactnum
        : "N/A",
      patientName: appointment.patient
        ? appointment.patient.patientname
        : "Unknown",
      patContactNum: appointment.patient
        ? appointment.patient.patcontactnum
        : "N/A",
      scheduleddatetime: appointment.scheduleddatetime, // ✅ No conversion
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

    // Convert DB timestamp (UTC) to Asia/Kuala Lumpur timezone
    const localDateTime = moment(appointment.scheduleddatetime)
      .tz("Asia/Kuala_Lumpur")
      .format("YYYY-MM-DDTHH:mm"); // Keep it in `datetime-local` format

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
      scheduleddatetime: localDateTime, // ✅ Now correctly converted
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
      doctorid: doctorId || appointment.doctorid,
      scheduleddatetime: scheduleddatetime, // ✅ No UTC conversion
      status: status || appointment.status,
      remarks: remarks !== undefined ? remarks : appointment.remarks,
    });

    // Log action to the blockchain (log appointment update)
    const tx = await contract.logAction(
      appointment.id,
      "appointment",
      "UPDATE",
      {
        gasLimit: 500000, // specify gas limit
        gasPrice: ethers.utils.parseUnits("20", "gwei"), // specify gas price
      }
    );
    console.log("Transaction sent:", tx.hash);

    // Wait for the transaction to be mined and get the receipt
    const receipt = await tx.wait();
    console.log("Transaction receipt:", receipt);

    // Check the status of the transaction
    if (receipt.status === 1) {
      console.log("Blockchain transaction was successful!");
    } else {
      console.log("Blockchain transaction failed!");
    }

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
        ? new Date(patient.lastvisit)
            .toISOString()
            .slice(0, 19)
            .replace("T", " ") // ✅ No Moment.js
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

    // Log action to the blockchain (log patient update)
    const tx = await contract.logAction(patient.id, "patient", "UPDATE", {
      gasLimit: 500000, // specify gas limit
      gasPrice: ethers.utils.parseUnits("20", "gwei"), // specify gas price
    });
    console.log("Transaction sent:", tx.hash);

    // Wait for the transaction to be mined and get the receipt
    const receipt = await tx.wait();
    console.log("Transaction receipt:", receipt);

    // Check the status of the transaction
    if (receipt.status === 1) {
      console.log("Blockchain transaction was successful!");
    } else {
      console.log("Blockchain transaction failed!");
    }

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

    // Log action to the blockchain (log patient creation)
    const tx = await contract.logAction(newPatient.id, "patient", "INSERT", {
      gasLimit: 500000, // specify gas limit
      gasPrice: ethers.utils.parseUnits("20", "gwei"), // specify gas price
    });
    console.log("Transaction sent:", tx.hash);

    // Wait for the transaction to be mined and get the receipt
    const receipt = await tx.wait();
    console.log("Transaction receipt:", receipt);

    // Check the status of the transaction
    if (receipt.status === 1) {
      console.log("Blockchain transaction was successful!");
    } else {
      console.log("Blockchain transaction failed!");
    }

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

    // Log action to the blockchain (log patient deletion)
    const tx = await contract.logAction(id, "patient", "DELETE", {
      gasLimit: 500000, // specify gas limit
      gasPrice: ethers.utils.parseUnits("20", "gwei"), // specify gas price
    });
    console.log("Transaction sent:", tx.hash);

    // Wait for the transaction to be mined and get the receipt
    const receipt = await tx.wait();
    console.log("Transaction receipt:", receipt);

    // Check the status of the transaction
    if (receipt.status === 1) {
      console.log("Blockchain transaction was successful!");
    } else {
      console.log("Blockchain transaction failed!");
    }

    res.json({ message: "Patient deleted successfully" });
  } catch (error) {
    console.error("Error deleting patient:", error);
    res.status(500).json({ message: "Failed to delete patient" });
  }
});

app.get("/api/visits", async (req, res) => {
  const { patientId } = req.query;

  if (!patientId) {
    return res.status(400).json({ error: "Patient ID is required" });
  }

  try {
    const visits = await Visit.findAll({
      where: { patientid: patientId },
      include: [
        {
          model: Clinic,
          as: "clinic",
          attributes: ["clinicname"], // Fetch only clinic name
        },
      ],
      attributes: [
        "session", // Explicitly select session
        "datetime",
        "visittype",
        "medinfo",
        "doctorremarks",
        "medname",
      ],
      order: [["session", "DESC"]], // Sort in descending order
    });

    const formattedVisits = visits.map((visit) => ({
      session: visit.session, // Ensure session is included
      datetime: visit.datetime,
      visittype: visit.visittype,
      clinicName: visit.clinic ? visit.clinic.clinicname : "Unknown", // Fetch clinic name
      medinfo: visit.medinfo,
      doctorremarks: visit.doctorremarks,
      medname: visit.medname,
    }));

    res.json(formattedVisits);
  } catch (error) {
    console.error("Error fetching visits:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
