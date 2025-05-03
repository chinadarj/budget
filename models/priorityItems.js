const mongoose = require('mongoose');

const priorityItemsSchema = new mongoose.Schema(
    {
      name: { type: String, required: true },
    },
    { collection: 'priority_items' }
  );
  
  const PriorityItems = mongoose.model('PriorityItems', priorityItemsSchema);
  
  module.exports = PriorityItems;
  