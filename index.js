import express from 'express';
import helloRoute from './src/routers/hello.js';
const app = express();
const PORT = process.env.PORT || 3000;

app.use(helloRoute)

app.get('/', (req, res) => {
  res.send('peter eniola ogungbe');
});

app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});

export default app;