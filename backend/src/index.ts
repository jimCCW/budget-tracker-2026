import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:3000' }));
app.use(express.json());

import authRoutes from './routes/authRoutes';
import categoryRoutes from './routes/categoryRoutes';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
// app.use('/api/income', incomeRoutes);
// app.use('/api/expenses', expenseRoutes);
// app.use('/api/summary', summaryRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
