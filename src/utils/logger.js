const winston = require('winston');

// 로그 포맷 정의
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// 로거 생성
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'salesmap-calendar-sync' },
  transports: [
    // 콘솔 출력
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          info => `${info.timestamp} ${info.level}: ${info.message} ${info.stack || ''} ${
            Object.keys(info).filter(key => 
              !['timestamp', 'level', 'message', 'stack', 'service'].includes(key)
            ).length > 0 
              ? JSON.stringify(Object.fromEntries(
                  Object.entries(info).filter(([key]) => 
                    !['timestamp', 'level', 'message', 'stack', 'service'].includes(key)
                  )
                ))
              : ''
          }`
        )
      )
    }),
    
    // 파일 출력
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ]
});

module.exports = logger;