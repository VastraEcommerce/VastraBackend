import cors from 'cors';
import express from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import globalErrorHandler from './controllers/errorController';
import indexRouter from './routes';
import AppError from './utils/AppError';

const app = express();

// todo 1) GLOBAL MIDDLEWARES
app.use(cors()); // Access-Control-Allow-Origin

app.use(helmet()); // Set security HTTP headers
app.use(helmet.xssFilter()); // XSS-Protection
// Development logging
if (process.env.NODE_ENV === 'development') {
  console.log('Start Development');
  app.use(morgan('dev'));
} else {
  console.log('Strat Production');
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Allow cross origins
app.use(cors());

// todo 2) ROUTES
app.use('/api/v1', indexRouter);

// Global route
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// todo 3) GLOBAL ERROR HANDLER MIDDLEWARE
app.use(globalErrorHandler);

export default app;
