import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './pages/Home';
import './index.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Generate from './pages/Generate';
import NotFoundPage from './pages/404';
import Demo from './pages/Demo';

const router = createBrowserRouter([
	{
		path: '/',
		element: <App />,
		errorElement: <NotFoundPage />,
	},
	{
		path: '/generate',
		element: <Generate />,
		errorElement: <NotFoundPage />,
	},
	{
		path: '/demo',
		element: <Demo />,
		errorElement: <NotFoundPage />,
	},
]);

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

root.render(
	<React.StrictMode>
		<RouterProvider router={router} />
	</React.StrictMode>
);