// Importing Express and other libraries
import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import Admin from './models/Admin.js';
import Appointment from './models/Appointment.js';
import crypto from 'crypto';
import Doctor from './models/Doctor.js';

const app = express();
const port = process.env.PORT || 3000;


// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Determine the directory name by using fileURLToPath and path.dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve login.html for the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Serve static files after defining specific routes
app.use(express.static('.'));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});



const secret = crypto.randomBytes(32).toString('hex');

// Session configuration
app.use(session({
    secret: secret, // This is a secret key used for signing the session ID cookie
    resave: false, // Don't save session if unmodified
    saveUninitialized: true, // Don't create session until something is stored
    cookie: { secure: 'auto' } // Use 'true' if you serve your site over HTTPS, 'auto' to auto-detect
  }));
  
console.log(secret);
// Add this route to handle login submissions
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const admin = await Admin.findOne({ email: email });
      if (!admin || password !== admin.password) { // Use bcrypt for real password check
        res.status(401).json({ message: 'Invalid credentials' });
      } else {
        // Store hospitalId in session after successful login
        req.session.hospitalId = admin.hospitalId;
        res.json({ message: 'Login successful', redirect: '/index.html' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });

app.get('/appointments/', async (req, res) => {
    try {
      const hospitalId = req.session.hospitalId;
      const appointments = await Appointment.find({ hospitalId: hospitalId, status: 'Pending' });
      console.log(`Hospital ID ${hospitalId}`);
      console.log(`appointments ${appointments}`);
      res.json(appointments);
    } catch (error) {
      console.error(error);
      res.status(500).send('Server error fetching appointments');
    }
  });
  
  
  // Route to update appointment status to 'Cancelled'
app.post('/appointments/cancel', async (req, res) => {
  const { appointmentId } = req.body;
  try {
      const updatedAppointment = await Appointment.findByIdAndUpdate(appointmentId, { status: 'Cancelled' }, { new: true });
      if (updatedAppointment) {
          res.json({ message: 'Appointment cancelled successfully' });
      } else {
          res.status(404).send('Appointment not found');
      }
  } catch (error) {
      console.error(error);
      res.status(500).send('Error updating appointment status');
  }
});

// Route to update appointment status to 'Confirmed'
app.post('/appointments/confirm', async (req, res) => {
  const { appointmentId } = req.body;
  try {
      const updatedAppointment = await Appointment.findByIdAndUpdate(appointmentId, { status: 'Confirmed' }, { new: true });
      if (updatedAppointment) {
          res.json({ message: 'Appointment confirmed successfully' });
      } else {
          res.status(404).send('Appointment not found');
      }
  } catch (error) {
      console.error(error);
      res.status(500).send('Error updating appointment status');
  }
});


app.get('/appointments/today', async (req, res) => {
  // Get today's date and set time to 00:00:00 for comparison
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Set end of today for comparison (23:59:59)
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  try {
      const todayAppointments = await Appointment.find({
          appointmentDate: {
              $gte: startOfDay,
              $lte: endOfDay
          }
      });

      res.json(todayAppointments);
  } catch (error) {
      console.error(error);
      res.status(500).send('Server error fetching today\'s appointments');
  }
});


app.get('/appointments/upcoming', async (req, res) => {
  const today = new Date();
  today.setHours(0,0,0,0); // Set to start of today to exclude past appointments

  try {
      const upcomingAppointments = await Appointment.find({
          appointmentDate: { $gte: today }, // Greater than or equal to today
          status: 'Confirmed' // Only confirmed appointments
      }).sort('appointmentDate'); // Optional: Sort by date if needed

      res.json(upcomingAppointments);
  } catch (error) {
      console.error('Error fetching upcoming confirmed appointments:', error);
      res.status(500).send('Server error');
  }
});


app.get('/appointments/complete', async (req, res) => {
  // Get today's date at 00:00:00 in UTC
  const today = new Date(new Date().setUTCHours(0,0,0,0));
  console.log("Comparing appointments before:", today.toISOString());

  try {
      const completeAppointments = await Appointment.find({
          appointmentDate: { $lt: today }, // Appointments before today (in UTC)
          status: 'Confirmed'
      }).sort('-appointmentDate'); // Sorting by date in descending order

      res.json(completeAppointments);
  } catch (error) {
      console.error('Error fetching complete (past confirmed) appointments:', error);
      res.status(500).send('Server error');
  }
});


app.get('/appointments/cancelled', async (req, res) => {
  try {
      const cancelledAppointments = await Appointment.find({
          status: 'Cancelled'
      }).sort('-appointmentDate'); // Sorting by date in descending order to show the most recent first

      res.json(cancelledAppointments);
  } catch (error) {
      console.error('Error fetching cancelled appointments:', error);
      res.status(500).send('Server error during the retrieval of cancelled appointments');
  }
});


app.get('/api/getHospitalId', (req, res) => {
  if (req.session && req.session.hospitalId) {
    res.json({ hospitalId: req.session.hospitalId });
  } else {
    res.status(404).json({ message: 'Hospital ID not found in session' });
  }
});


app.post('/api/doctors', async (req, res) => {
  try {
      const hospitalId = req.session.hospitalId;
      const doctor = new Doctor({
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          department: req.body.department,
          email: req.body.email,
          contactNumber: req.body.contactNumber,
          slotTime: req.body.slotTime,
          availableTimes: req.body.availableTimes,
          availableDays: req.body.availableDays,
          hospitalId: hospitalId
      });

      await doctor.save();
      res.status(201).json({ message: 'Doctor added successfully', doctorId: doctor._id });
  } catch (error) {
      console.error('Failed to add doctor:', error);
      res.status(500).json({ message: 'Failed to add doctor' });
  }
});