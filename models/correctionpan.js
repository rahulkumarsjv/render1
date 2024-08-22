const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const correctionPanSchema = new Schema({
  pannumber: String,
  category: String,
  date: Date,
  city: String,
  area_code: String,
  aotype: String,
  range_code: String,
  ao_no: String,
  title: String,
  last_name: String,
  first_name: String,
  middle_name: String,
  name_on_card: String,
  gender: String,
  dob: Date,
  single_parent: String,
  mother_last_name: String,
  mother_first_name: String,
  mother_middle_name: String,
  father_last_name: String,
  father_first_name: String,
  father_middle_name: String,
  name_on_card_parent: String,
  address_type: String,
  flat: String,
  building: String,
  street: String,
  locality: String,
  town: String,
  state: String,
  pincode: String,
  country: String,
  isd_code: String,
  mobile: String,
  email: String,
  aadhaar: String,
  income_source: String,
  pancard_proof: [String],
  identity_proof: [String],
  address_proof: [String],
  dob_proof: [String],
  declaration: String,
  Pan_Caed_CopyPaths: [String], // Array of file paths for Pan_Caed_Copy
  filePaths: [String], // Array of file paths for file
  signaturePaths: [String], // Array of file paths for signature
  documentsPaths: [String], // Array of file paths for documents
  verifier_name: String,
  verification_place: String,
  verification_date: Date,
  pan_option: String,
  uniqueNumber: String,
});

const CorrectionPan = mongoose.models.CorrectionPan || mongoose.model('CorrectionPan', correctionPanSchema);

module.exports = CorrectionPan;
