import Server from '../Server';
import cors from 'cors';
import GenerateRoute from './GenerateRoute';

/**
 * Initialise routes
 * @param server Express server instance
 */
export const initRoutes = ({ application, config }: Server): void => {
	application.use(cors());
	application.use(`${config.prefix}/generate`, new GenerateRoute().router);
};