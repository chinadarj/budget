import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';

function BranchDropdown({ onSelect }) {
  const [branches, setBranches] = useState([]);
  const [selected, setSelected] = useState('');

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await api.get('/api/branches', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        setBranches(response.data);
      } catch (error) {
        console.error('Error fetching branches:', error);
      }
    };

    fetchBranches();
  }, []);

  const handleChange = (e) => {
    const branchId = e.target.value;
    setSelected(branchId);
    onSelect(branchId);
  };

  return (
    <FormControl fullWidth>
      <InputLabel>Select Branch</InputLabel>
      <Select value={selected} onChange={handleChange} label="Select Branch">
        <MenuItem value="">-- Select --</MenuItem>
        {branches.map(branch => (
          <MenuItem key={branch._id} value={branch._id}>
            {branch.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default BranchDropdown;