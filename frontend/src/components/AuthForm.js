import React, { useState } from 'react';
import api from '../services/api';
import {
  TextField,
  Button,
  Typography,
  Paper,
  Stack,
} from '@mui/material';

function AuthForm({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isLogin ? '/api/login' : '/api/register';
      const response = await api.post(endpoint, { username, password });

      if (isLogin && response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        onAuthSuccess();
      }

      setMessage(isLogin ? 'Login successful!' : 'Registration successful!');
    } catch (error) {
      setMessage(error.response?.data?.error || 'Something went wrong.');
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Typography variant="h6" gutterBottom>
        {isLogin ? 'Login' : 'Register'}
      </Typography>

      <form onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <TextField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
          />

          <Typography color={message.includes('successful') ? 'success.main' : 'error.main'}>
            {message}
          </Typography>

          <Button variant="contained" type="submit">
            {isLogin ? 'Login' : 'Register'}
          </Button>

          <Button variant="text" onClick={toggleForm}>
            {isLogin ? 'Switch to Register' : 'Switch to Login'}
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}

export default AuthForm;
