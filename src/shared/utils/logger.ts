import chalk from 'chalk';
import winston, { format } from 'winston';

interface LoggerClass extends winston.Logger {
    new (namespace: string): winston.Logger;
}

// eslint-disable-next-line func-names
const LoggerClass = function () {} as unknown as LoggerClass;

const Logger = new Proxy(LoggerClass, {
    construct(_, [namespace]: [string]) {
        const logger = winston.createLogger({
            level: 'info',
            format: winston.format.json(),
            defaultMeta: { namespace },
            transports: [
                new winston.transports.File({
                    filename: `./logs/${namespace}.error.log`,
                    level: 'error',
                }),
                new winston.transports.File({
                    filename: `./logs/${namespace}.other.log`,
                }),
            ],
        });

        if (process.env.NODE_ENV !== 'production') {
            logger.add(
                new winston.transports.Console({
                    format: format.combine(
                        format.colorize(),
                        format.printf(
                            ({ level, message, namespace }) =>
                                `${chalk.yellow(`[${namespace}]`)} ${level}: ${message}`,
                        ),
                    ),
                }),
            );
        }

        return logger;
    },
});

type Logger = winston.Logger;

export default Logger;
