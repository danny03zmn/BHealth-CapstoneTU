// models/Doctor.js
import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  contactNumber: String,
  slotTime: Number,
  availableTimes: [{
    from: String,
    to: String
  }],
  availableDays: [String],
  hospitalId: { type: mongoose.Schema.Types.String, ref: 'Hospital' }
});

const Doctor = mongoose.model('Doctor', doctorSchema);

export default Doctor;
