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
    // Check if file is uploaded
    if (!req.file) {
      return res.status(400).send('No file uploaded');
    }

    // Read the Excel file
    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Map the data to the required structure
    const medicines = data.map((row) => {
      const [key, value] = Object.entries(row)[0]; // Extract the key-value pair
      return {
        name: key
          };
    });

    // Save data to MongoDB
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
