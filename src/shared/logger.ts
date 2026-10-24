import { createLogger, format, transports } from 'winston'
import path from 'path'
import DailyRotateFile from 'winston-daily-rotate-file'

const { combine, timestamp, label, printf } = format

const myFormat = printf(info => {
  const { level, message, label, timestamp } = info
  const date = new Date(timestamp as string)
  const hour = date.getHours()
  const minutes = date.getMinutes()
  const seconds = date.getSeconds()

  let logMessage = `${date.toDateString()} ${hour}:${minutes}:${seconds} [${label}] ${level}: ${message}`

  const splat = info[Symbol.for('splat') as keyof typeof info] as any[]
  if (splat && splat.length) {
    logMessage += `\n${splat.join(' ')}`
  }

  return logMessage
})

const logger = createLogger({
  level: 'info',
  format: combine(label({ label: 'crstew05' }), timestamp(), myFormat),
  transports: [
    new transports.Console(),
    new DailyRotateFile({
      filename: path.join(
        process.cwd(),
        'logs',
        'winston',
        'successes',
        'crstew05-%DATE%-success.log',
      ),
      datePattern: 'YYYY-DD-MM-HH',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
})

const errorLogger = createLogger({
  level: 'error',
  format: combine(label({ label: 'crstew05' }), timestamp(), myFormat),
  transports: [
    new transports.Console(),
    new DailyRotateFile({
      filename: path.join(
        process.cwd(),
        'logs',
        'winston',
        'errors',
        'crstew05-%DATE%-error.log',
      ),
      datePattern: 'YYYY-DD-MM-HH',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
})

export { logger, errorLogger }
