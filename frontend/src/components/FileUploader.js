import React, { useState } from 'react';
import api from '../services/api';
import {
  Button,
  Typography,
  Stack,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';

function FileUploader({ label, onUploaded }) {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setLoading(true);
    setFileName(file.name);

    try {
      const response = await api.post('/api/upload/temp', formData);
      onUploaded(response.data.tempFilePath);
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle1">{label}</Typography>
      <Button
        variant="outlined"
        component="label"
        startIcon={<UploadFileIcon />}
        disabled={loading}
      >
        {loading ? 'Uploading...' : 'Choose File'}
        <input type="file" hidden onChange={handleUpload} accept=".xls,.xlsx" />
      </Button>
      {fileName && (
        <Typography variant="body2" color="text.secondary">
          Selected: {fileName}
        </Typography>
      )}
    </Stack>
  );
}

export default FileUploader;