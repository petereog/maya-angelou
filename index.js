import express from 'express';
import authRoute from './src/routers/auth.router.js';
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); // Parse JSON request bodies
app.use('/auth', authRoute); // Use the authentication routes

app.get('/', (req, res) => {
  res.send('app Running');
});

app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});

export default app;