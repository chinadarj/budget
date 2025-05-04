const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const PriorityItems = require('../models/priorityItems');

const router = express.Router();

// Configure Multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Route to handle Excel uploads
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded');
    }

    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 }); // Read as a 2D array

    // Remove the header row (if present) and map the first column
    const medicines = data.map((row) => ({
      name: row[0], // Use the first column value
    }));

    // Save the data to MongoDB
    await PriorityItems.insertMany(medicines);

    // Clean up the uploaded file
    fs.unlinkSync(filePath);

    res.status(200).send('File uploaded and data saved successfully');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    res.status(500).send(`Error: ${error.message}`);
  }
});


module.exports = router;
