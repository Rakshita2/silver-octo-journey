// server.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Create a connection pool to your MySQL database
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',           // Use your MySQL username (typically 'root')
  password: 'newpassword',// Replace with your MySQL password
  database: 'markersDB',  // Ensure this database exists
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Create the markers table if it doesn't exist
const createTableQuery = `
CREATE TABLE IF NOT EXISTS markers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  lat DECIMAL(10,6) NOT NULL,
  lon DECIMAL(10,6) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
`;

pool.query(createTableQuery, (err, results) => {
  if (err) {
    console.error('Error creating markers table:', err);
  } else {
    console.log('Markers table is ready.');
  }
});

// API endpoint to receive marker data
app.post('/api/markers', (req, res) => {
  // Log incoming data to verify it's being received
  console.log('Received marker data:', req.body);

  const { name, lat, lon } = req.body;
  if (!name || lat === undefined || lon === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const insertQuery = 'INSERT INTO markers (name, lat, lon) VALUES (?, ?, ?)';
  pool.query(insertQuery, [name, lat, lon], (err, results) => {
    if (err) {
      console.error('Error inserting marker:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    // Return the inserted marker data including the new ID
    res.status(201).json({ id: results.insertId, name, lat, lon });
  });
});

// API endpoint to retrieve all markers
app.get('/api/markers', (req, res) => {
  pool.query('SELECT * FROM markers', (err, results) => {
    if (err) {
      console.error('Error retrieving markers:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// Start the server on port 3000 (or the port specified in process.env.PORT)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
