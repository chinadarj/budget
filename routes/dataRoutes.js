const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const Branch = require('../models/branch');
const SalesReport = require('../models/salesReport'); // Corrected path
const WarehouseReport = require('../models/warehouseReport'); // Corrected path
const SalesOrderGeneration = require('../models/salesOrderGeneration');

const mongoose = require('mongoose');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Get all branches for dropdown
router.get('/branches', async (req, res) => {
    try {
        console.log('Fetching branches...');
        const branches = await Branch.find();
        console.log('Branches fetched:', branches);

        if (!branches || branches.length === 0) {
            console.log('No branches found in database');
            return res.status(404).json({ message: 'No branches found' });
        }

        res.json(branches);
    } catch (err) {
        console.error('Error in API:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

router.post('/upload/temp', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    res.status(200).json({ tempFilePath: req.file.path });
});

// Route to upload and process sales report
router.post('/upload/sales', upload.single('file'), async (req, res) => {
    try {
        console.log('Sales report upload route hit');
        if (!req.file) {
            console.error('No file uploaded');
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const filePath = req.file.path;
        console.log(`Uploaded file path: ${filePath}`);

        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(sheet, { header: 0, raw: true });
        const jsonData = rawData.slice(2);

        console.log('Parsed Excel data:', jsonData);

        for (const row of jsonData) {
            if (row['__EMPTY_1']) {
                const salesData = {
                    item_name: row['__EMPTY_1'],
                    packs: row['__EMPTY_2'] ?? 0,
                    qty: row['__EMPTY_3'] ?? 0,
                    stock: row['__EMPTY_4'] ?? 0,
                    bill_count: row['__EMPTY_5'] ?? 0,
                    code: row['__EMPTY'] ?? null, // Added code from the correct column

                };
                console.log("SALES DATA:", salesData);
                try {
                    await SalesReport.create(salesData);
                } catch (error) {
                    console.error("Error saving sales data:", error);
                    return res.status(500).json({ message: 'Error saving sales data', error: error.message });
                }
            }
        }
        res.status(200).json({ message: 'Sales report uploaded successfully' });
    } catch (err) {
        console.error('Error processing sales report:', err.message);
        res.status(500).json({ message: 'Error processing sales report', error: err.message });
    }
});

// Route to upload and process warehouse report
router.post('/upload/warehouse', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const filePath = req.file.path;

        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json(sheet, { header: 0, raw: true });
        const data = rawData.slice(2);

        // Parse and save data to warehouse_report collection
        const warehouseReports = data.map(row => {
            if (row['__EMPTY']) {
                return {
                    bill_no: row['__EMPTY'],
                    bill_date: row['__EMPTY_1'],
                    item_name: row['__EMPTY_2'],
                    packing: row['__EMPTY_3'],
                    quantity: row['__EMPTY_4'],
                    free_quantity: row['__EMPTY_5'],
                    amount: row['__EMPTY_6'],
                };
            }
        }).filter(Boolean);

        try {
            await WarehouseReport.insertMany(warehouseReports);
        } catch (error) {
            console.error("Error saving warehouse data:", error);
            return res.status(500).json({ message: 'Error saving warehouse data', error: error.message });
        }

        res.status(200).json({ message: 'Warehouse report uploaded and saved successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error processing warehouse report' });
    }
});



router.post('/generate', async (req, res) => {
    try {
        const { branch_id, salesFilePath, warehouseFilePath } = req.body;

        if (!branch_id || !salesFilePath || !warehouseFilePath) {
            console.error('Missing required fields:', { branch_id, salesFilePath, warehouseFilePath });
            return res.status(400).json({ message: 'Missing required fields' });
        }

        if (!mongoose.Types.ObjectId.isValid(branch_id)) {
            return res.status(400).json({ message: 'Invalid branch ID' });
        }

        console.log('Received request:', { branch_id, salesFilePath, warehouseFilePath });

        // Create a new entry in salesOrderGeneration collection
        const salesOrder = await SalesOrderGeneration.create({
            branch_id: new mongoose.Types.ObjectId(branch_id), // Use 'new' here
            created_at: new Date(),
            updated_at: new Date(),
            status: 1,
        });

        console.log('Sales order created:', salesOrder);

        // Process sales file
        const salesWorkbook = XLSX.readFile(salesFilePath);
        const salesSheet = salesWorkbook.Sheets[salesWorkbook.SheetNames[0]];
        const salesData = XLSX.utils.sheet_to_json(salesSheet, { header: 0, raw: true }).slice(2);

        const salesReports = salesData.map(row => ({
            item_name: row['__EMPTY_1'],
            packs: row['__EMPTY_2'] ?? 0,
            qty: row['__EMPTY_3'] ?? 0,
            stock: row['__EMPTY_4'] ?? 0,
            bill_count: row['__EMPTY_5'] ?? 0,
            code: row['__EMPTY'] ?? null,
            branch_id: new mongoose.Types.ObjectId(branch_id), // Use 'new' here
            sales_order_generation_id: salesOrder._id, // Link the generated ID
        }));
        await SalesReport.insertMany(salesReports);

        console.log('Sales data saved successfully.');

        // Process warehouse file
        const warehouseWorkbook = XLSX.readFile(warehouseFilePath);
        const warehouseSheet = warehouseWorkbook.Sheets[warehouseWorkbook.SheetNames[0]];
        const warehouseData = XLSX.utils.sheet_to_json(warehouseSheet, { header: 0, raw: true }).slice(2);

     
        const warehouseReports = warehouseData.map(row => {
            if (row['__EMPTY'] && row['__EMPTY_1'] && row['__EMPTY_2'] && row['__EMPTY_3'] && row['__EMPTY_4']) {
                return {
                    bill_no: row['__EMPTY'] || 'Unknown', // Add a fallback value if needed
                    bill_date: row['__EMPTY_1'] || null, // Ensure date is properly formatted
                    item_name: row['__EMPTY_2'] || 'Unknown Item',
                    packing: row['__EMPTY_3'] || 'N/A',
                    quantity: row['__EMPTY_4'] || 0,
                    free_quantity: row['__EMPTY_5'] || 0,
                    amount: row['__EMPTY_6'] || 0,
                    branch_id: new mongoose.Types.ObjectId(branch_id),
                    sales_order_generation_id: salesOrder._id,
                };
            } else {
                console.error('Incomplete row:', row); // Log incomplete rows for debugging
                return null; // Exclude incomplete rows
            }
        }).filter(Boolean); // Remove null entries

        await WarehouseReport.insertMany(warehouseReports);

        console.log('Warehouse data saved successfully.');

        res.status(200).json({ message: 'Sales order generated successfully' });
    } catch (err) {
        console.error('Error during generation:', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});




module.exports = router;
