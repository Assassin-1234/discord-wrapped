import { Router } from 'express';
import { IRoute } from '../../types/global';

/**
 * Route
 */
class Route implements IRoute {

	/**
     * Router
     */
	public router: Router = Router();
}

export default Route;