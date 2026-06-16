import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import env from './config/env.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { MulterError } from 'multer';
import mainRouter from './routes/index.js';
import { CustomError } from './lib/custom-error.js';

const app = express();

//app.use(express.json());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//app.use(cors({
 // origin: (origin, callback) => {
 //   callback(null, true);
//  },
//  credentials: true,
//}))
app.use(cors({
  origin: true, 
  credentials: true
}));
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

//app.use('/api', mainRouter);
app.use(['/api', '/'], mainRouter);
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.log(error)
  if (error instanceof CustomError) {
    return res.status(error.status).json({
      success: false,
      message: error.message,
      errors: error.errors,
    });
  }

  if (error instanceof MulterError) {
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? 'File size too large. Maximum allowed size is 10MB.'
      : error.message;

    return res.status(400).json({
      success: false,
      message,
    });
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});


//app.listen(env.PORT, () => {
//  console.log(`Server is running on port ${env.PORT}`);
//});
if (process.env.NODE_ENV !== 'production') {
  app.listen(env.PORT || 5000, () => {
    console.log(`Server is running on port ${env.PORT || 5000}`);
  });
}

export default app;