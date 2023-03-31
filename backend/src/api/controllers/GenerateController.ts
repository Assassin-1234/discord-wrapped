import { Request, Response } from 'express';
import Controller from './Controller';
import wrap from '../../generator';
import { renameSync } from 'fs';
import WebSocket from 'ws';

/**
 * GenerateController
 * @extends Controller
 */
class GenerateController extends Controller {
	/**
     * Upload a data package
     * @param req Express request
     * @param res Express response
     * @returns {void}
     */
	public async upload(req: Request, res: Response): Promise<void> {
		const dataPackage = req.file?.path;
		if (!dataPackage) {
			res.status(400).send('No data package provided');
			return;
		}

		const id = Math.random().toString(36).substring(7);

		renameSync(dataPackage, `uploads/${id}.zip`);

		res.send({ id });
	}

	/**
     * Generate a wrapped
     * @param ws WebSocket
     * @param message WebSocket message
     */
	public async generate(ws: WebSocket.WebSocket, message: WebSocket.RawData): Promise<void> {
		const { id } = JSON.parse(message.toString());
		try {
			await wrap(id, (progress: number, info: string) => {
				try {
					ws.send(JSON.stringify({ progress, info }));
				} catch {
					return;
				}
			});
		} catch (e) {
			try {
				ws.send(JSON.stringify({ progress: 500, info: 'There went something wrong, are you sure your data package is complete or valid?' }));
			} catch {
				return;
			}
		} finally {
			ws.close();
		}
	}

	/**
     * Download the generated wrapped
     * @param req Express request
     * @param res Express response
     * @returns {void}
     */
	public async download(req: Request, res: Response): Promise<void> {
		const { id } = req.params;
		res.download(`${id}/wrapped.mp4`);
	}
}

export default GenerateController;