import winston from 'winston';
import { config } from '../config';

const { combine, timestamp, errors, printf } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

export const logger = winston.createLogger({
  level: config.logging.level,
  format: combine(errors({ stack: true }), timestamp(), logFormat),
  transports: [
    new winston.transports.Console({
      format: combine(winston.format.colorize(), timestamp(), logFormat),
    }),
    new winston.transports.File({
      filename: config.logging.file,
      format: combine(timestamp(), logFormat),
    }),
  ],
});
