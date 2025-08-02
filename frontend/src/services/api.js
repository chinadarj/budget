import axios from 'axios';

const API_BASE = 'https://gaqsyyz9t5.execute-api.ap-south-1.amazonaws.com';

const api = axios.create({
  baseURL: API_BASE,
});

export default api;