const express = require('express');
const cors = require('cors');
require('dotenv').config();

const routes = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/', routes);

app.get('/health', (req, res) => {
  res.json({ message: 'Mail Manager API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
