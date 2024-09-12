const eShramCardSchema = new mongoose.Schema({
  aadhar_number: { type: String, required: true },
  email: { type: String }, // Remove the unique constraint
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const E_Shram_Card = mongoose.model('E_Shram_Card', eShramCardSchema);
