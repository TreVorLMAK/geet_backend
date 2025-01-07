require('dotenv').config();
const express = require('express');
const connectToDatabase = require('./db/database');
const cors = require('cors');
const authRoutes = require('./Routes/authRoutes');
const albumRoutes = require('./Routes/albumRoutes');
const app = express();

app.use(cors());
app.use(express.json());

// Connect to Database
connectToDatabase();

// Authentication routes
app.use('/api/auth', authRoutes);

// Album routes
app.use('/api/albums', albumRoutes);

// Server listening
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
