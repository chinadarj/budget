const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const RemovedMedicines = require('../models/removedMedicines');

const router = express.Router();

// Configure Multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Route to handle Excel uploads
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded');
    }

    // Read the Excel file
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Save data to MongoDB
    const medicines = data.map((row) => ({
      name: row['name'],
      code: row['code'],
    }));

    await RemovedMedicines.insertMany(medicines);

    res.status(200).send('File uploaded and data saved successfully');
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});

module.exports = router;
