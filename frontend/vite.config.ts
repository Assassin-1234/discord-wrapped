import { resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-refresh';

const root = resolve(__dirname, 'src');
const outDir = resolve(__dirname, 'dist');

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	preview: {
		port: 5173,
	},
	root,
	build: {
		outDir,
		emptyOutDir: true,
		rollupOptions: {
			input: {
				main: resolve(root, 'index.html'),
				generate: resolve(root, 'generate', 'index.html'),
				demo: resolve(root, 'demo', 'index.html'),
			},
		},
	},
});
