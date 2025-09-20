import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { clerkMiddleware, requireAuth } from '@clerk/express'
import aiRouter from './routes/aiRoutes.js';
import connectCloudinary from './configs/cloudinary.js';
import userRouter from './routes/userRoutes.js';

const app = express();

await connectCloudinary();

// app.use(cors());
app.use(cors({
  origin: [
    "https://fast-ai-nine.vercel.app", // your frontend URL
    "http://localhost:5173"            // for local dev, optional
  ],
  credentials: true
}));
app.use(express.json());
app.use(clerkMiddleware());

app.get('/api/all', (req, res) => {
    res.send('Hello World!');
    }); 

app.use(requireAuth());

app.use('/api/ai', aiRouter)
app.use('/api/user', userRouter);

    const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server is running on port`), PORT;
});

const PORT = process.env.PORT || 8000;

// Only listen if not running on Vercel (i.e., not in serverless)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
