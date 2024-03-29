// models/Appointment.js
import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  // Change the type from ObjectId to String
  hospitalId: { type: String, required: true, ref: 'Hospital' },
  patientName: { type: String, required: true },
  appointmentDate: { type: Date, required: true },
  status: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  timeslot: { type: String, required: true },
  assignedDoctor: { type: String, required: false }
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;
