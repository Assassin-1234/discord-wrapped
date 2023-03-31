import Express, { Application } from 'express';
import { initRoutes } from './routes';
import { IConfig } from '../types/global';

/**
 * Server
 */
class Server {

	private _app: Application = Express();
	public config: ServerOptions;

	constructor(options: ServerOptions) {
		this.config = options;
		initRoutes(this);
	}

	/**
     * Get Express application
     */
	public get application(): Application {
		return this._app;
	}
}

export interface ServerOptions
    extends IConfig {
        prefix: string;
}

export default Server;