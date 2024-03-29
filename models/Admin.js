// models/Admin.js
import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true }, // Note: Store hashed passwords in production
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' }
});

const Admin = mongoose.model('Admin', adminSchema);

export default Admin;
