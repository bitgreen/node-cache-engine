import winston from 'winston';

const logger = winston.createLogger({
  level: 'error', // Set the logging level to error
  format: winston.format.combine(
      winston.format.timestamp(), // Add timestamp to each log record
      winston.format.printf(({ level, message, timestamp }) => {
        return `[${timestamp}] [${level.toUpperCase()}]: ${message}`; // Include timestamp, log level, and message
      })
  ),
  transports: [
    new winston.transports.File({ filename: './error.log', level: 'error' }), // Log errors to a file named error.log
    new winston.transports.Console() // Log all messages to the console
  ],
});

export default logger;