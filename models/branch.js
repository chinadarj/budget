const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema(
    {
      name: { type: String, required: true },
      address: { type: String, required: true },
      phone: { type: String, required: true },
    },
    { collection: 'branch' }
  );
  
  const Branch = mongoose.model('Branch', branchSchema);
  
  module.exports = Branch;
  