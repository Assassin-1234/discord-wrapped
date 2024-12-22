import path from 'path';
import { createCanvas, loadImage } from 'canvas';
import sharp from 'sharp';
import { existsSync, mkdirSync, rmSync, readFileSync, writeFileSync } from 'fs';
import type editlyType from 'editly';
import ffmpeg from 'fluent-ffmpeg';
import axios from 'axios';
import * as ghEmoji from 'github-emoji';
import { getUserInfo } from '../extractor/extract';
import Tasks from '../../constants/progress';
import StreamZip from 'node-stream-zip';

/**
 * Get the editly library
 * @returns {Promise<typeof import('editly')>} The editly library
 */
const getEditly = async (): Promise<typeof editlyType> => {
	const lib = await (eval('import(\'editly\')') as Promise<{
        default: typeof import('editly');
    }>);
	return lib.default;
};

/**
 * Get number with commas
 * @param {number} number Number to format
 * @returns {string} Formatted number
 */
function numberWithCommas(number: number): string {
	return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Get the path to a tool
 * @param tool Tool name
 * @returns {string} The path to the tool
 */
function getToolPath(tool: string): string {
	const pathsToCheck = [
		`${tool}.exe`,
		`/usr/bin/${tool}`,
		tool,
	];

	for (let i = 0; i < pathsToCheck.length; i++) {
		const filePath = path.resolve(pathsToCheck[i]);
		if (existsSync(filePath)) {
			return filePath;
		}
	}

	console.error(`Could not find: ${tool}! Please check if you've downloaded it`);
	process.exit(1);
}

const ffmpegPath = getToolPath('ffmpeg');
const ffprobePath = getToolPath('ffprobe');

ffmpeg.setFfmpegPath(ffmpegPath);

const coordinates = [
	{ x: 255, y: 402, w: 384, h: 384 },
	{ x: 768, y: 402, w: 384, h: 384 },
	{ x: 1280, y: 402, w: 384, h: 384 },
];

const emojisCoordinates = [
	[110, 460, 290, 290],
	[1250, 325, 235, 235],
	[1570, 325, 235, 235],
	[1240, 655, 235, 235],
	[1564, 655, 235, 235],
];

const gamesCoordinates = [
	[360, 323, 241, 241],
	[679, 323, 241, 241],
	[999, 323, 241, 241],
	[1319, 323, 241, 241],
];

const stickersCoordinates = [
	[840, 292, 285, 295],
	[385, 660, 234, 234],
	[706, 660, 234, 234],
	[1025, 660, 234, 234],
	[1345, 660, 234, 234],
];

const wordsCoordinates = {
	name: [
		[610, 364],
		[610, 467],
		[610, 570],
		[610, 673],
		[610, 776],
	],
	count: [
		[1255, 364],
		[1255, 467],
		[1255, 570],
		[1255, 673],
		[1255, 776],
	],
};

const summaryCoordinates = [
	[560, 380],
	[730, 495],
	[580, 613],
	[600, 730],
	[680, 845],
	[1540, 370],
	[1592, 485],
	[1595, 604],
	[1400, 717],
	[1570, 834],
];

/**
 * Wrap the data package
 * @param {string} wrappedId The id of the wrapped
 * @param {(progress: number, info: string) => void} progressCallback The callback to call when the progress changes
 */
export default async (wrappedId: string, progressCallback: (progress: number, info: string) => void) => {
	progressCallback(Math.round((2 / Tasks.length) * 100), Tasks[1]);
	const dir = `./${wrappedId}/`;
	mkdirSync(dir);

	const uploadsDir = path.join(process.cwd(), 'uploads');

	const zip = new StreamZip.async({ file: path.join(uploadsDir, `${wrappedId}.zip`) });
	await zip.extract(null, `${dir}/package`);

	const dataPackage = `${dir}/package`;
	const data: any = await getUserInfo(`${dataPackage}/account/user.json`, dataPackage, progressCallback);

	/**
     * Fetch the buffer of an emoji
     * @param {string} emoji The emoji to fetch the buffer of
     * @returns {Promise<Buffer>} The buffer of the emoji
     */
	async function fetchEmojiBuffer(emoji: string): Promise<Buffer> {
		const codepoint = Array.from(emoji).map((char) => char?.codePointAt(0)?.toString(16))[0];

		const url = `https://abs.twimg.com/emoji/v2/svg/${codepoint}.svg`;

		const response = await axios.get(url, { responseType: 'arraybuffer' });

		const buffer = await sharp(response.data)
			.resize(512, 512)
			.png()
			.toBuffer();
		return buffer;
	}

	/**
     * Fetch the buffer of a Discord emoji
     * @param {string} id The ID of the emoji
     * @returns {Promise<Buffer>} The buffer of the emoji
     */
	async function fetchDiscordEmojiBuffer(id: string): Promise<Buffer> {
		const url = `https://cdn.discordapp.com/emojis/${id}.png`;

		const response = await axios.get(url, { responseType: 'arraybuffer' });
		return response.data;
	}

	/**
     * Fetch a game image
     * @param {string} id The ID of the game
     * @param {string} image_id The image ID of the game
     * @returns {Promise<Buffer>} The buffer of the game image
     */
	async function fetchGameImage(id: string, image_id: string): Promise<Buffer> {
		const url = `https://cdn.discordapp.com/app-icons/${id}/${image_id}.png`;

		const response = await axios.get(url, { responseType: 'arraybuffer' });
		return response.data;
	}

	/**
     * Fetch a sticker image
     * @param {string} id The ID of the sticker
     * @returns {Promise<Buffer>} The buffer of the sticker image
     */
	async function fetchStickerImage(id: string): Promise<Buffer> {
		const url = `https://cdn.discordapp.com/stickers/${id}.png`;

		// eslint-disable-next-line no-async-promise-executor
		return new Promise(async (resolve) => {
			try {
				const response = await axios.get(url, { responseType: 'arraybuffer' });
				resolve(response.data);
			} catch (e) {
				const response = readFileSync('./src/generator/assets/noSticker.png');
				resolve(response);
			}
		});
	}

	/**
     * Fetch a GIF from Tenor
     * @param {string} url The URL of the GIF
     * @returns {Promise<Buffer>} The buffer of the GIF
     */
	async function fetchTenorGIF(url: string): Promise<Buffer> {
		// eslint-disable-next-line no-async-promise-executor
		return new Promise(async (resolve) => {
			try {
				const response = await axios.get(url, { responseType: 'arraybuffer' });
				resolve(response.data);
			} catch (e) {
				const response = readFileSync('./src/generator/assets/noSticker.png');
				resolve(response);
			}
		});
	}

	/**
     * Get the first frame of a video
     * @param {string} inputPath The path of the video
     * @returns {Promise<Buffer>} The buffer of the first frame
     */
	function getVideoFirstFrame(inputPath: string): Promise<Buffer> {
		const id = String(Math.random()) + '.png';

		return new Promise((resolve, reject) => {
			ffmpeg(inputPath)
				.screenshots({
					count: 1,
					timemarks: ['0'],
					size: '320x240',
					filename: id,
				})
				.on('end', async () => {
					const imageBuffer = readFileSync(id);
					resolve(imageBuffer);
					rmSync(id);
				})
				.on('error', (err: Error) => {
					reject(new Error(`Error extracting first frame: ${err.message}`));
				});
		});
	}

	/**
     * Create the recent GIFs frame
     * @param {string[]} tenorLinks The links to the GIFs
     * @returns {Promise<void>}
     */
	async function createRecentGIFs(tenorLinks: any[]): Promise<void> {
		const canvas = createCanvas(1920, 1080);
		const ctx = canvas.getContext('2d');

		let i = 0;

		ctx.drawImage((await loadImage(path.resolve('./src/generator/assets/mostRecentGIFs.png'))), 0, 0);

		const pagePromises = tenorLinks.map(async (tenorLink) => {
			tenorLink = tenorLink.src;

			let filename = tenorLink.split('/').pop()

			filename = filename.includes('?') ?
				filename.split('?').shift() :
				filename + '.gif';

			const tenorBuffer = await fetchTenorGIF(tenorLink);
			let ext = '';
			if (tenorBuffer[0] === 0x89 && tenorBuffer[1] === 0x50 && tenorBuffer[2] === 0x4e && tenorBuffer[3] === 0x47) ext = 'png';


			if (ext === 'png') {
				ctx.drawImage((await loadImage(tenorBuffer)), coordinates[i].x, coordinates[i].y, coordinates[i].w, coordinates[i].h);
			} else {
				writeFileSync(filename, tenorBuffer);

				const frameData = await getVideoFirstFrame(filename);

				ctx.drawImage((await loadImage(frameData)), coordinates[i].x, coordinates[i].y, coordinates[i].w, coordinates[i].h);
			}

			try {
				rmSync(filename);
			} catch (e) {
				return i++;
			}
			i++;
		});
		await Promise.all(pagePromises);

		const buffer = canvas.toBuffer();
		writeFileSync(path.resolve(`${dir}/mostRecentGIFs.png`), buffer);
	}

	/**
     * Create the most used emojis frame
     * @param {any[]} array The array of emojis
     * @returns {Promise<void>}
     */
	async function createMostUsedEmojis(array: any[]): Promise<void> {
		const canvas = createCanvas(1920, 1080);
		const ctx = canvas.getContext('2d');

		ctx.drawImage((await loadImage(path.resolve('./src/generator/assets/topEmojis.png'))), 0, 0);

		for (let i = 0; i < array.length; i++) {
			const emojiObj = array[i];
			const emoji = emojiObj.name;

			let buffer;

			if (!emojiObj.id) buffer = await fetchEmojiBuffer(emoji);
			if (emojiObj.id) buffer = await fetchDiscordEmojiBuffer(emojiObj.id);

			const image = await loadImage(buffer as Buffer);

			ctx.drawImage(image, emojisCoordinates[i][0], emojisCoordinates[i][1], emojisCoordinates[i][2], emojisCoordinates[i][3]);

			if (i === (array.length - 1)) {

				ctx.font = '75px Arial';

				array.forEach((x) => {
					let emojiName = ghEmoji.namesOf(x.name)[0] ? ghEmoji.namesOf(x.name)[0].toString() : 'unknown';
					emojiName.replace('+1', 'thumbs_up');

					if (emojiName === 'unknown' && x.id) emojiName = x.name;

					if (emojiName.length >= 11) {
						x.name = emojiName.slice(0, 11) + '...';
					} else {
						x.name = emojiName;
					}
				});

				ctx.fillText(array[0].name, 610, 430);
				ctx.fillText(array[1].name, 610, 530);
				ctx.fillText(array[2].name, 610, 630);
				ctx.fillText(array[3].name, 610, 730);
				ctx.fillText(array[4].name, 610, 830);

				const outputBuffer = canvas.toBuffer();
				writeFileSync(path.resolve(`${dir}/topEmojis.png`), outputBuffer);
			}
		}
	}

	/**
     * Create the money count frame
     * @param {string} text The text to display
     * @returns {Promise<void>}
     */
	async function createMoneyCount(text: string): Promise<void> {
		const canvas = createCanvas(1920, 1080);
		const ctx = canvas.getContext('2d');
		ctx.drawImage((await loadImage(path.resolve('./src/generator/assets/moneyCount.png'))), 0, 0);

		ctx.font = '235px Sans';
		ctx.strokeStyle = '#000000';
		ctx.lineWidth = 7;

		ctx.strokeText(text, 115, 500);

		const buffer = canvas.toBuffer();

		writeFileSync(path.resolve(`${dir}/moneyCount.png`), buffer);
	}

	/**
     * Create the most played games frame
     * @param {any[]} array The array of games
     * @returns {Promise<void>}
     */
	async function createMostPlayedGames(array: any[]): Promise<void> {
		const canvas = createCanvas(1920, 1080);
		const ctx = canvas.getContext('2d');

		ctx.drawImage((await loadImage(path.resolve('./src/generator/assets/topGames.png'))), 0, 0);
		ctx.font = '40px Arial';
		ctx.textAlign = 'center';
		ctx.fillStyle = '#ffffff';
		for (let i = 0; i < array.length; i++) {
			const imageBuffer = await fetchGameImage(array[i].id, array[i].icon);
			const image = await loadImage(imageBuffer);
			const cdnts = gamesCoordinates[i];
			let name = array[i].name;

			if (name.length >= 12) {
				name = name.slice(0, 12) + '...';
			}

			ctx.drawImage(image, cdnts[0], cdnts[1], cdnts[2], cdnts[3]);
			ctx.fillText(name, cdnts[0] + 122, cdnts[1] - 18);
		}

		const buffer = canvas.toBuffer();
		writeFileSync(path.resolve(`${dir}/topGames.png`), buffer);
	}

	/**
     * Create the most used stickers frame
     * @param {any[]} array The array of stickers
     * @returns {Promise<void>}
     */
	async function createMostUsedStickers(array: any[]): Promise<void> {
		const canvas = createCanvas(1920, 1080);
		const ctx = canvas.getContext('2d');

		ctx.drawImage((await loadImage(path.resolve('./src/generator/assets/topStickers.png'))), 0, 0);
		ctx.font = '40px Arial';
		ctx.textAlign = 'center';
		for (let i = 0; i < array.length; i++) {
			const imageBuffer = await fetchStickerImage(array[i].name);
			const image = await loadImage(imageBuffer);
			const cdnts = stickersCoordinates[i];

			ctx.drawImage(image, cdnts[0], cdnts[1], cdnts[2], cdnts[3]);
		}

		const buffer = canvas.toBuffer();
		writeFileSync(path.resolve(`${dir}/topStickers.png`), buffer);
	}

	/**
     * Create the most used words frame
     * @param {any[]} array The array of words
     * @returns {Promise<void>}
     */
	async function createMostUsedWords(array: any[]): Promise<void> {
		const canvas = createCanvas(1920, 1080);
		const ctx = canvas.getContext('2d');

		ctx.drawImage((await loadImage(path.resolve('./src/generator/assets/mostUsedWords.png'))), 0, 0);
		ctx.font = 'bold 80px Arial';

		for (let i = 0; i < array.length; i++) {
			const cdnts = wordsCoordinates.name[i];
			const cdnts2 = wordsCoordinates.count[i];
			let word = array[i][0];

			if (word.length >= 10) {
				word = word.slice(0, 10) + '...';
			}

			ctx.fillText(word, cdnts[0], cdnts[1]);
			ctx.fillText(array[i][1], cdnts2[0], cdnts2[1]);
		}

		const buffer = canvas.toBuffer();
		writeFileSync(path.resolve(`${dir}/mostUsedWords.png`), buffer);
	}

	/**
     * Create the summary frame
     * @param {any[]} array The array of summary
     * @returns {Promise<void>}
     */
	async function createSummary(array: any[]): Promise<void> {
		const canvas = createCanvas(1920, 1080);
		const ctx = canvas.getContext('2d');
		const values = Object.values(array);
		const keys = Object.keys(array);

		ctx.drawImage((await loadImage(path.resolve('./src/generator/assets/summary.png'))), 0, 0);
		ctx.font = 'bold 50px Arial';

		for (let i = 0; i < values.length; i++) {
			const cdnts = summaryCoordinates[i];
			let name = values[i];

			name = numberWithCommas(name);

			if (name == '0') name = 'N/A';

			if (['joinCallCount', 'openCount'].includes(keys[i])) name += ' times';
			if (['dmChannelCount'].includes(keys[i])) name += ' people';
			if (['channelCount'].includes(keys[i])) name += ' channels';

			ctx.fillText(name, cdnts[0], cdnts[1]);
		}

		const buffer = canvas.toBuffer();
		writeFileSync(path.resolve(`${dir}/summary.png`), buffer);
	}

	progressCallback(Math.round((5 / Tasks.length) * 100), Tasks[4]);
	await createRecentGIFs(data.most_recent_favorite_gifs || []);
	progressCallback(Math.round((6 / Tasks.length) * 100), Tasks[5]);
	await createMostUsedEmojis(data.most_used_emojis || []);
	progressCallback(Math.round((7 / Tasks.length) * 100), Tasks[6]);
	await createMoneyCount(data.total_spend || 0);
	progressCallback(Math.round((8 / Tasks.length) * 100), Tasks[7]);
	await createMostPlayedGames(data.most_played_games || []);
	progressCallback(Math.round((9 / Tasks.length) * 100), Tasks[8]);
	await createMostUsedStickers(data.most_used_stickers || []);
	progressCallback(Math.round((10 / Tasks.length) * 100), Tasks[9]);
	await createMostUsedWords(data.most_used_words || []);
	progressCallback(Math.round((11 / Tasks.length) * 100), Tasks[10]);
	await createSummary(data.statistics);

	rmSync(`${dir}/package`, { recursive: true, force: true });

	const editly = await getEditly();

	progressCallback(Math.round((12 / Tasks.length) * 100), Tasks[11]);
	await editly({
		ffprobePath,
		ffmpegPath,
		outPath: `${dir}/wrapped.mp4`,
		width: 1920,
		height: 1080,
		enableFfmpegLog: false,
		verbose: false,
		fast: false,
		clips: [
			{
				duration: 2.5,
				layers: [
					{ type: 'image', path: path.join(process.cwd(), 'src', 'generator', 'assets', 'opening.png') },
				],
			},
			{
				duration: 5,
				layers: [
					{ type: 'image', path: path.join(process.cwd(), dir, 'mostRecentGIFs.png') },
				],
			},
			{
				duration: 5,
				layers: [
					{ type: 'image', path: path.join(process.cwd(), dir, 'topEmojis.png') },
				],
			},
			{
				duration: 5,
				layers: [
					{ type: 'image', path: path.join(process.cwd(), dir, 'moneyCount.png') },
				],
			},
			{
				duration: 5,
				layers: [
					{ type: 'image', path: path.join(process.cwd(), dir, 'topGames.png') },
				],
			},
			{
				duration: 5,
				layers: [
					{ type: 'image', path: path.join(process.cwd(), dir, 'topStickers.png') },
				],
			},
			{
				duration: 5,
				layers: [
					{ type: 'image', path: path.join(process.cwd(), dir, 'mostUsedWords.png') },
				],
			},
			{
				duration: 10,
				layers: [
					{ type: 'image', path: path.join(process.cwd(), dir, 'summary.png') },
				],
			},
			{
				duration: 6,
				layers: [
					{ type: 'image', path: path.join(process.cwd(), 'src', 'generator', 'assets', 'ending.png') },
				],
			},
		],
	});

	progressCallback(Math.round((13 / Tasks.length) * 100), Tasks[12]);

	return dir;
};
