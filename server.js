const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); 
const connectDB = require('./config/db');
const adminRoutes = require('./routes/adminRoutes');
const dealerRoutes = require('./routes/dealerRoutes');


dotenv.config();
connectDB();

const app = express();

// Use CORS middleware
app.use(cors({
  origin: 'http://localhost:3000', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'], 
  allowedHeaders: ['Content-Type', 'Authorization'] 
}));

app.use(express.json());

app.use('/api/admin', adminRoutes);
app.use('/api/dealer', dealerRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
