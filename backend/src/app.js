const express = require('express');
const cors = require('cors');
require('dotenv').config();

const routes = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

app.use('/', routes);

app.get('/health', (req, res) => {
  res.json({ message: 'Mail Manager API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
