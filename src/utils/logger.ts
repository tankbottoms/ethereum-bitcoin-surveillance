/* eslint-disable import/no-duplicates */
import moment from 'moment';
// eslint-disable-next-line import/no-duplicates
import { format } from 'winston';
// eslint-disable-next-line no-duplicate-imports
import winston from 'winston';

process.on('SIGTERM', () => {
  process.stdout.write(`\n`);
  logger.info('received SIGTERM, exiting gracefully');
  process.exit(0);
});

const datetime = `${moment(new Date()).format('YYYYMMDD-HHmmssSS').toString()}`;

export const logger = winston.createLogger({
  level: 'verbose',
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
      format: format.combine(
        format.prettyPrint(),
        format.colorize({ all: true }),
        format.printf(info => {
          const { level, message, ...rest } = info;
          return JSON.stringify({}) === '{}'
            ? `[${level}][${moment(new Date()).format('YYYYMMDD-HHmmssSS').toString()}] ${message} `
            : `[${level}][${moment(new Date()).format('YYYYMMDD-HHmmssSS').toString()}] ${message} ${JSON.stringify(
                rest,
              )}`;
        }),
      ),
    }),
    /*
        new winston.transports.File({
            filename: `${datetime}.log`,
            format: format.combine(format.timestamp(), format.prettyPrint()),
            handleExceptions: true
        })
        */
  ],
});
