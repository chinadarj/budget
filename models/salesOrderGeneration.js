const mongoose = require('mongoose');

const salesOrderGenerationSchema = new mongoose.Schema({
    branch_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date },
    status: { type: Number },
}, { collection: 'sales_order_generation' });

module.exports = mongoose.model('SalesOrderGeneration', salesOrderGenerationSchema, 'sales_order_generation');
