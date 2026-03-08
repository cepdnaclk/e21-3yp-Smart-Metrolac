// src/api/authApi.js

export const loginUser = async (credentials) => {
  // TODO: REPLACE WITH ACTUAL BACKEND ENDPOINT
  // const response = await axios.post('http://localhost:5000/api/auth/login', credentials);
  // return response.data;

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const { email, password } = credentials;

      // Simple mock validation
      if (password !== 'password123') {
        reject(new Error('Invalid credentials'));
        return;
      }

      // Assign roles based on email for testing purposes
      let role = 'FARMER';
      let username = 'Saman Kumara';
      
      if (email.includes('admin')) {
        role = 'COMPANY_ADMIN';
        username = 'Admin Chief';
      } else if (email.includes('manager')) {
        role = 'CENTER_MANAGER';
        username = 'Kamal Perera';
      }

      resolve({
        id: Math.floor(Math.random() * 1000),
        username,
        email,
        role,
        token: 'mock-jwt-token-12345'
      });
    }, 1000); // 1-second simulated network delay
  });
};