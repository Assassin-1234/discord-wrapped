import { createServer, Server as HTTPServer } from 'http';
import { config as insertEnv } from 'dotenv';
insertEnv();

import Server from './api/Server';
import Logger from './utils/Logger';
import config from './constants/config';
import { WebSocketServer } from 'ws';

const exServer: Server = new Server({
	...config,
	prefix: '/api',
});
const server: HTTPServer = createServer(exServer.application);
const wss = new WebSocketServer({ server });

Logger.info(`Initialing back-end service on ${config.environment} environment...`);

server.timeout = 600000;

server.listen(config.port, (): void => {
	Logger.ready(`Back-end service is running on port ${config.port}`);
});

server.on('close', (): void => {
	Logger.info('Closing back-end service...');
});

export { wss };