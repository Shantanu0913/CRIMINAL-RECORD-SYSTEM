const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', require('./routes/authRoutes'));
app.use('/api/criminals', require('./routes/criminalRoutes'));
app.use('/api/firs', require('./routes/firRoutes'));
app.use('/api/cases', require('./routes/caseFileRoutes'));
app.use('/api/evidence', require('./routes/evidenceRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/officers', require('./routes/officerRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/stations', require('./routes/stationRoutes'));
app.use('/api/courts', require('./routes/courtRoutes'));
app.use('/api/hearings', require('./routes/hearingRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Criminal Record Management System API is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🚔 Criminal Record Management System`);
  console.log(`   Server running on http://localhost:${PORT}`);
  console.log(`   API Health: http://localhost:${PORT}/api/health\n`);
});
