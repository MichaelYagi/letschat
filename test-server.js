const express = require('express');
const app = express();

app.get('/test', (req, res) => {
  res.json({ message: 'Test endpoint works' });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});