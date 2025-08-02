import React, { useState, useEffect } from 'react';
import AuthForm from '../components/AuthForm';
import BranchDropdown from '../components/BranchDropdown';
import FileUploader from '../components/FileUploader';
import api from '../services/api';

import {
  Container,
  Box,
  Typography,
  Button,
  Stack,
  Paper,
} from '@mui/material';

function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [branchId, setBranchId] = useState('');
  const [salesPath, setSalesPath] = useState(null);
  const [warehousePath, setWarehousePath] = useState(null);
  const [removedPath, setRemovedPath] = useState(null);

  const checkAuth = () => {
    const token = localStorage.getItem('authToken');
    setIsAuthenticated(!!token);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
  };

  const handleGenerate = async () => {
    if (!branchId || !salesPath || !warehousePath) {
      alert('Please select branch and upload required files');
      return;
    }

    try {
      const response = await api.post(
        '/api/generate',
        {
          branch_id: branchId,
          salesFilePath: salesPath,
          warehouseFilePath: warehousePath,
          removedFilePath: removedPath || null,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );

      if (response.data.outputFilePath) {
        alert(response.data.message || 'Generated successfully!');
        const link = document.createElement('a');
        link.href = `${api.defaults.baseURL}/${response.data.outputFilePath}`;
        link.download = '';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert(response.data.error || 'Error generating file');
      }
    } catch (error) {
      console.error('Generate failed:', error);
      alert('An error occurred');
    }
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="sm" sx={{ mt: 5 }}>
        <AuthForm onAuthSuccess={checkAuth} />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 5 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Upload & Generate Report
        </Typography>

        <Box mb={2}>
          <BranchDropdown onSelect={setBranchId} />
        </Box>

        <Box mb={2}>
          <FileUploader label="Upload Sales Report" onUploaded={setSalesPath} />
        </Box>

        <Box mb={2}>
          <FileUploader label="Upload Warehouse Report" onUploaded={setWarehousePath} />
        </Box>

        <Box mb={3}>
          <FileUploader label="Upload Removed Items (optional)" onUploaded={setRemovedPath} />
        </Box>

        <Stack direction="row" spacing={2}>
          <Button variant="contained" onClick={handleGenerate}>
            Generate
          </Button>
          <Button variant="outlined" color="secondary" onClick={handleLogout}>
            Logout
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}

export default Home;