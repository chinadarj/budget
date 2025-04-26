const mongoose = require('mongoose');

const salesReportSchema = new mongoose.Schema({
    item_name: String,
    code: String,
    packs: Number,
    qty: Number,
    stock: Number,
    bill_count: Number,
    sales_order_generation_id: mongoose.Schema.Types.ObjectId
},{ collection: 'sales_report' });


module.exports = mongoose.model('SalesReport', salesReportSchema);
