import GenerateController from '../controllers/GenerateController';
import Route from './Route';
import multer from 'multer';
import path from 'path';
const storage = multer.diskStorage({
	destination: function(req, file, cb) {
		const uploadsDir = path.join(process.cwd(), 'uploads');
		cb(null, uploadsDir);
	},
	filename: function(req, file, cb) {
		cb(null, Date.now() + '.zip');
	},
});

const upload = multer({ storage: storage });

/**
 * GenerateRoute
 * @extends Route
 */
class GenerateRoute extends Route {

	private readonly controller: GenerateController = new GenerateController();

	constructor() {
		super();
		this.init();
	}

	/**
     * Initialise routes
     */
	private init(): void {
		this.router.post('/upload', upload.single('file'), (req, res) => this.controller.upload(req, res));
		this.router.get('/download/:id', (req, res) => this.controller.download(req, res));

		import('../../app').then(({ wss }) => {
			wss.on('connection', (ws) => {
				ws.on('message', (message) => {
					this.controller.generate(ws, message);
				});
			});
		});
	}
}

export default GenerateRoute;