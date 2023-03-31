import moment from 'moment';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const MAGENTA = '\x1b[35m';
const RESET = '\x1b[0m';

/**
 * Logger
 */
class Logger {

	constructor() {
		throw new Error('Logger class should not be an instance.');
	}

	/**
     * Info log
     * @param message Log message
     */
	public static info(message: string, enable = true): void {
		if (enable) console.info(`[${moment().format('DD/MM/YYYY HH:mm:ss')}] ${MAGENTA}Info${RESET} - ${message}`);
	}

	/**
     * Ready log
     * @param message Log message
     */
	public static ready(message: string, enable = true): void {
		if (enable) console.info(`[${moment().format('DD/MM/YYYY HH:mm:ss')}] ${GREEN}Ready${RESET} - ${message}`);
	}

	/**
     * Error log
     * @param message Log message
     */
	public static error(message: string, enable = true): void {
		if (enable) console.error(`[${moment().format('DD/MM/YYYY HH:mm:ss')}] ${RED}Error${RESET} - ${message}`);
	}
}

export default Logger;