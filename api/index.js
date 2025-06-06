import express from 'express';
import cors from 'cors';
import serverless from 'serverless-http';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'API funcionando na Vercel!' });
});

export default serverless(app);
