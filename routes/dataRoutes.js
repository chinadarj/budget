const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const Branch = require('../models/branch');
const SalesReport = require('../models/salesReport'); // Corrected path
const WarehouseReport = require('../models/warehouseReport'); // Corrected path
const SalesOrderGeneration = require('../models/salesOrderGeneration');

const mongoose = require('mongoose');
const PriorityItems = require('../models/priorityItems');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Get all branches for dropdown
router.get('/branches', async (req, res) => {
    try {
        const branches = await Branch.find();

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



// Helper Functions

// Validates incoming request
const validateRequest = (branch_id, salesFilePath, warehouseFilePath) => {
    if (!branch_id || !salesFilePath || !warehouseFilePath) {
        throw new Error('Missing required fields');
    }

    if (!mongoose.Types.ObjectId.isValid(branch_id)) {
        throw new Error('Invalid branch ID');
    }
};

// Reads and parses an Excel file
const readExcelFile = (filePath, sheetIndex = 0, startRow = 0) => {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[sheetIndex]];
    return XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true }).slice(startRow);
};

// Creates a new Sales Order entry
const createSalesOrder = async (branch_id) => {
    return await SalesOrderGeneration.create({
        branch_id: new mongoose.Types.ObjectId(branch_id),
        created_at: new Date(),
        updated_at: new Date(),
        status: 1,
    });
};

// Processes sales data into the desired format
const processSalesReport = (salesData, headers, branch_id, salesOrderId) => {
    return salesData
        .filter(row => row[headers.indexOf('Product Name')]?.trim() !== '')
        .map(row => {
            const rowData = {};
            headers.forEach((header, index) => {
                rowData[header] = row[index] ?? null;
            });

            return {
                category: rowData['Category'] ?? 'Unknown',
                code: rowData['Code'] ?? 'Unknown',
                item_name: rowData['Product Name'],
                packs: rowData['Packs'] ?? 0,
                qty: rowData['SaleQty'] ?? 0,
                stock: rowData['CurrentStock'] ?? 0,
                bill_count: rowData['BillCount'] ?? 0,
                branch_id: new mongoose.Types.ObjectId(branch_id),
                sales_order_generation_id: salesOrderId,
            };
        });
};

// Processes warehouse data into the desired format
const processWarehouseReport = (warehouseData, branch_id, salesOrderId) => {

    const transformedWarehouseData = warehouseData.slice(1).map(row => ({
        '__EMPTY': row[1],          // BillNo
        '__EMPTY_1': row[2],        // Bill Date (Excel serial number)
        '__EMPTY_2': row[3],        // Product Name
        '__EMPTY_3': row[4],        // Packing
        '__EMPTY_4': row[5],        // Qty
        '__EMPTY_5': row[6],        // Free Qty
        '__EMPTY_6': row[7]         // Amount
    }));


    return transformedWarehouseData
        .map(row => {
            const billDate = new Date(row['__EMPTY_1']);
                return {
                    bill_no: row['__EMPTY'] || 'Unknown',
                    bill_date: billDate,
                    item_name: row['__EMPTY_2'] || 'Unknown Item',
                    packing: row['__EMPTY_3'] || 'N/A',
                    quantity: row['__EMPTY_4'] || 0,
                    free_quantity: row['__EMPTY_5'] || 0,
                    amount: row['__EMPTY_6'] || 0,
                    branch_id: new mongoose.Types.ObjectId(branch_id),
                    sales_order_generation_id: salesOrderId,
                };
            return null;
        })
        .filter(row => row);
};

// Calculates required stock
const calculateRequiredStock = (salesReports, warehouseReports, removedData, predicationParams, priorityItems) => {
    const { predicationGT60, predicationLT60, predicationLT6 } = predicationParams;

    const outputData = [];
    for (const salesRow of salesReports) {
        let reason = "";

        if(salesRow.item_name == "" || salesRow.item_name == null) continue;
        const isRemoved = removedData.some(([removedName]) => removedName === salesRow.item_name);
        if (isRemoved) continue;

        const isPriority = priorityItems.some(item => item.name === salesRow.item_name);

        const warehouseRow = warehouseReports.find(w => w.item_name === salesRow.item_name);
        const currentStock = salesRow.stock;
        const salesQty = salesRow.qty;
        const billCount = salesRow.bill_count;
        const packing = salesRow.packs;
        const warehouseQty = (warehouseRow?.quantity * packing || 0);
        const actualStock = currentStock + warehouseQty;
        let requiredStock = 0;
        const category = salesRow.category;
        let roundedToPacksLoose = 0;
        let wholesalePacks = 0;
        let actualPacksRequired = 0;

        if (billCount > 1) {
            const stockPer = (actualStock / salesQty) * 100;
            if (salesQty > 60) {
                requiredStock = stockPer > predicationGT60 ? 0 : (salesQty * (18 / 61)) - actualStock;
            } else if (salesQty > 6) {
                requiredStock = stockPer > predicationLT60 ? 0 : (salesQty * (38 / 61)) - actualStock;
            } else {
                requiredStock = stockPer > predicationLT6 ? 0 : (salesQty * (55 / 61)) - actualStock;
            }

            requiredStock = Math.max(0, requiredStock);
            requiredStock = (packing > 1 && packing < 31)
                ? (requiredStock + currentStock < 4 ? 5 - currentStock : requiredStock)
                : requiredStock;

            const exactRequiredQty = requiredStock;

            if (category === 'GENERIC') {
                roundedToPacksLoose = Math.ceil(requiredStock / packing) * packing;
            } else {
                roundedToPacksLoose = Math.floor(requiredStock / packing) * packing;
            }
            actualPacksRequired = roundedToPacksLoose / packing;
            if (packing !== 1) {
                wholesalePacks = Math.ceil(actualPacksRequired / 10) * 10;
            } else {
                wholesalePacks = actualPacksRequired;
            }
        } else {
            reason += " |Bill Count <=1";
        }
        if(warehouseQty>0) {
            wholesalePacks = 0;
            reason+=" Recent transfer exist";
        }

        if (salesRow.item_name !== "") {
            outputData.push({
                category,
                code: salesRow.code,
                productName: salesRow.item_name,
                packing,
                salesQty,
                currentStock,
                billCount,
                'recent_transfer': warehouseQty,
                'actual_required': requiredStock,
                'rounded_to_packs': roundedToPacksLoose,
                'actual_pack_required': actualPacksRequired,
                'rounded_to_wholesales': wholesalePacks,
                'Reason': reason,
                'isPriority': isPriority
            });
        }
    }

    outputData.sort((a, b) => {
        // Highest priority: actual_required > 0 and isPriority === true
        if (a.actual_required > 0 && a.isPriority && !(b.actual_required > 0 && b.isPriority)) {
            return -1;
        }
        if (b.actual_required > 0 && b.isPriority && !(a.actual_required > 0 && a.isPriority)) {
            return 1;
        }
    
        // Fallback to original sorting logic
        return b.actual_required - a.actual_required || b.salesQty - a.salesQty;
    });

    const cleanedOutputData = outputData.map(({ isPriority, ...rest }) => rest);

    return cleanedOutputData;
};


// Generates an Excel file from data
const generateOutputFile = (data, sheetName = 'RequiredStock') => {
    const outputSheet = XLSX.utils.json_to_sheet(data);
    const outputWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(outputWorkbook, outputSheet, sheetName);
    const outputFilePath = `output/${sheetName}_${Date.now()}.xlsx`;
    XLSX.writeFile(outputWorkbook, outputFilePath);
    return outputFilePath;
};

// Main Route

router.post('/generate', async (req, res) => {
    try {
        const { branch_id, salesFilePath, warehouseFilePath, removedFilePath } = req.body;

        validateRequest(branch_id, salesFilePath, warehouseFilePath);
        
        const priorityItems = await PriorityItems.find({});
        const removedData = readExcelFile(removedFilePath, 0, 1);

        const salesOrder = await createSalesOrder(branch_id);

        const salesData = readExcelFile(salesFilePath, 0, 2);
        const salesHeaders = salesData.shift();
        const salesReports = processSalesReport(salesData, salesHeaders, branch_id, salesOrder._id);
        await SalesReport.insertMany(salesReports);

        const warehouseData = readExcelFile(warehouseFilePath, 0, 6);
        const warehouseReports = processWarehouseReport(warehouseData, branch_id, salesOrder._id);
        await WarehouseReport.insertMany(warehouseReports);
        const predicationParams = {
            predicationGT60: (12 / 61) * 100,
            predicationLT60: (15 / 61) * 100,
            predicationLT6: (29.9 / 61) * 100,
        };

        const outputData = calculateRequiredStock(salesReports, warehouseReports, removedData, predicationParams,priorityItems);
        const outputFilePath = generateOutputFile(outputData);

        res.status(200).json({
            message: 'Sales order generated successfully',
            outputFilePath,
        });
    } catch (err) {
        console.error('Error during generation:', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

module.exports = router;







module.exports = router;
