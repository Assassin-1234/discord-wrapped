import { IConfig } from '../types/global';

const config: IConfig = {
	appname: process.env.APP_NAME || 'discordwrapped-backend',
	environment: process.env.APP_ENV || 'development',
	port: parseInt(process.env.APP_PORT || '3020'),
	url: process.env.APP_URL || 'https://discordwrapped.com',
};

export default config;