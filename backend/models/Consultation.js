const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['doctor', 'patient', 'system'], required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: true });

const ConsultationSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.Mixed, required: true },
  doctorId: { type: mongoose.Schema.Types.Mixed, required: true },
  patientId: { type: mongoose.Schema.Types.Mixed, required: true },
  doctorName: { type: String },
  patientName: { type: String },
  type: { 
    type: String, 
    enum: ['video', 'chat'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['waiting', 'active', 'completed', 'cancelled'], 
    default: 'waiting' 
  },
  // Session credentials (for video calls)
  sessionToken: { type: String },
  channelName: { type: String },
  // Chat history
  chatMessages: [ChatMessageSchema],
  // Post-consultation
  prescription: { type: String },
  notes: { type: String },
  diagnosis: { type: String },
  // Timing
  startedAt: { type: Date },
  endedAt: { type: Date },
  duration: { type: Number },  // in minutes
  createdAt: { type: Date, default: Date.now }
});

ConsultationSchema.index({ bookingId: 1 });
ConsultationSchema.index({ doctorId: 1, status: 1 });
ConsultationSchema.index({ patientId: 1 });

module.exports = mongoose.model('Consultation', ConsultationSchema);
