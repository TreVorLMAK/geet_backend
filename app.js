require('dotenv').config();
const express = require('express');
const connectToDatabase = require('./db/database');
const cors = require('cors');
const authRoutes = require('./Routes/authRoutes');
const albumRoutes = require('./Routes/albumRoutes');
const reviewRoutes = require('./Routes/reviewRoutes')
const { upload } = require('./middleware/multerConfig');
const artistRoutes = require('./Routes/artistRoutes');
const userRoutes = require('./Routes/userRoutes')
const khaltiRoutes = require('./Routes/khaltiRoutes');
const passport = require('./passport');

const app = express();

app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Connect to Database
connectToDatabase();

// Authentication routes
app.use('/api/auth', authRoutes);

// Album routes
app.use('/api/albums', albumRoutes);

// Review routes
app.use('/api/reviews', reviewRoutes);

// Artist routes
app.use('/api/artists', artistRoutes);

// User routes
app.use('/api/user', userRoutes);

// payment routes
app.use("/api/khalti", khaltiRoutes);

// Server listening
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
