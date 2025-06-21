import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

// ...require routes and middleware here...

app.use(express.json());

// Registration route
const registrationRoute = require('./routes/registrationRoute');
app.use('/api/register', registrationRoute);

// Example root route
app.get('/', (req, res) => {
  res.json({ status: 'success', message: 'API is running', data: null });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
