import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Server } from 'http';

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config();
import app from './app';

const DB = process.env.DATABASE?.replace(
  '<password>',
  process.env.DATABASE_PASSWORD!
)!;

let server: Server;
(async () => {
  await mongoose.connect(DB);

  console.log('Succesful DB Connection');
  const port = process.env.PORT || 3000;
  const host = process.env.HOST;
  server = app.listen(port, () => {
    console.log(`App running on port ${host}:${port} ...`);
  });
})().catch((err: Error) => {
  console.error(err);
  console.log('Unsccesful DB Connection');
});

process.on('unhandledRejection', (err: Error) => {
  console.log('UNHANDLED REJECTION!💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => process.exit(1));
});

// console.log(x) //! uncaughtException
