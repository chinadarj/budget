const mongoose = require('mongoose');

const removedMedicinesSchema = new mongoose.Schema(
    {
      name: { type: String, required: true },
      code: { type: String, required: true },
    },
    { collection: 'removed_medicines' }
  );
  
  const RemovedMedicines = mongoose.model('RemovedMedicines', removedMedicinesSchema);
  
  module.exports = RemovedMedicines;
  