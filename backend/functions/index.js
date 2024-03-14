const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb+srv://capstone_project:jDwOGLIKSPaiYsEz@bhealth.lvuoiew.mongodb.net/?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log("Connected successfully to MongoDB");
});

// Define Schemas
const HospitalSchema = new mongoose.Schema({
    name: String,
    services: [String],
    location: String,
    openHours: String,
    workingDays: [String],
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }],
    doctors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }]
});

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    appointments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' }]
});

const AdminSchema = new mongoose.Schema({
    name: String,
    email: String,
    contactNumber: String,
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' }
});

const DoctorSchema = new mongoose.Schema({
    name: String,
    email: String,
    contactNumber: String,
    department: String,
    availableDays: [String],
    slotsTime: Number,
    availableTime: { from: String, to: String },
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' }
});

const AppointmentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    date: Date,
    timeSlot: String,
    // any other relevant fields
});

const Appointment = mongoose.model('Appointment', AppointmentSchema);


// Compile models from the schemas
const Hospital = mongoose.model('Hospital', HospitalSchema);
const User = mongoose.model('User', UserSchema);
const Admin = mongoose.model('Admin', AdminSchema);
const Doctor = mongoose.model('Doctor', DoctorSchema);
