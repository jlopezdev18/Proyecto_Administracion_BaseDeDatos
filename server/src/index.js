require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { poolPromise } = require('./config/database');
const port = process.env.PORT || 3000;
const app = express();
const databaseRoutes = require('./routes/database');

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
