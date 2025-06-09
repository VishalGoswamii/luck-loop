const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/frames', require('./routes/frames'));
app.use('/api/game', require('./routes/game'));

// Serve frontend
app.use(express.static(path.join(__dirname, '../../frontend/public')));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
