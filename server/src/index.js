require('dotenv').config({ path: '../.env' });
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_SERVER:', process.env.DB_SERVER);
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const { poolPromise } = require('./config/database');
const port = process.env.PORT || 3000;
const app = express();
const databaseRoutes = require('./routes/database');    
const { getTablesMetadataForDatabase } = require('./controllers/databaseController');

app.use(cors());
app.use(express.json());
app.use('/api/database', databaseRoutes);

// Wait for the connection pool to be ready before starting the server
poolPromise.then(() => {
    app.listen(port, () => {
        console.log(`DB Transformer API listening on port ${port}`);
    });
}).catch((err) => {
    console.error('Failed to start server due to database connection error:', err);
    process.exit(1);
});

app.get('/', (req, res) => {
    res.json({ message: 'DB Transformer API is running!' });
});
app.get("/my-er-model", (req, res) => {
  req.params.dbName = process.env.DB_NAME; // <-- nombre de la BD del .env
  getTablesMetadataForDatabase(req, res);
});poolPromise.then(() => {
  app.listen(port, () => {
    console.log(`DB Transformer API listening on port ${port}`);
  });
}).catch((err) => {
  console.error('Failed to start server due to database connection error:', err);
  process.exit(1);
});