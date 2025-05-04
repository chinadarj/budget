const mongoose = require('mongoose');

const warehouseReportSchema = new mongoose.Schema({
    sales_order_generation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrderGeneration' },
    bill_no: { type: String, required: true },
    // bill_date: { type: Date, required: false }, // Change to optional
    item_name: { type: String, required: true },
    packing: { type: String, required: true },
    quantity: { type: String, required: true },
    free_quantity: { type: String },
    amount: { type: String },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date },
});

module.exports = mongoose.model('WarehouseReport', warehouseReportSchema, 'warehouse_report');

