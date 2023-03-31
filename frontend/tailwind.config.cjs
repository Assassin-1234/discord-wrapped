/* eslint-disable no-undef */
/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		'./index.html',
		'./src/**/*.{ts,tsx}',
	],
	theme: {
		colors: {
			gray: '#23272A',
			white: '#FFFFFF',
			black: '#000000',
			blurple: '#5865F2',
			blurpleLight: '#A2A8E9',
			twitter: '#1C9CEB',
			github: 'linear-gradient(180deg,#f0f3f6,#e6ebf1 90%)',
			red: '#FF0000',
			kofi: '#00B9FE',
		},
		fontFamily: {
			whitney: ['Whitney', 'sans-serif'],
		},
		plugins: [],
	},
};