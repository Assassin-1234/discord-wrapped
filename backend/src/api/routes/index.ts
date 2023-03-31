import Server from '../Server';
import { ModulesMiddleware } from '../middleware';
import GenerateRoute from './GenerateRoute';

/**
 * Initialise routes
 * @param server Express server instance
 */
export const initRoutes = ({ application, config }: Server): void => {
	ModulesMiddleware.register(application);
	application.use(`${config.prefix}/generate`, new GenerateRoute().router);
};