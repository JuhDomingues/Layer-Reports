import { config } from '../config';

export class Logger {
  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const formattedMessage = args.length > 0 ? `${message} ${JSON.stringify(args)}` : message;
    return `[${timestamp}] ${level.toUpperCase()}: ${formattedMessage}`;
  }

  info(message: string, ...args: any[]): void {
    console.log(this.formatMessage('info', message, ...args));
  }

  error(message: string, ...args: any[]): void {
    console.error(this.formatMessage('error', message, ...args));
  }

  warn(message: string, ...args: any[]): void {
    console.warn(this.formatMessage('warn', message, ...args));
  }

  debug(message: string, ...args: any[]): void {
    if (config.isDevelopment) {
      console.debug(this.formatMessage('debug', message, ...args));
    }
  }
}

export const logger = new Logger();