const path = require('path');
const Canvas = require('canvas');
const sharp = require('sharp');

const fs = require('fs');

function getToolPath(tool) {
	const pathsToCheck = [
		`${tool}.exe`,
		`/usr/bin/${tool}`,
		tool,
	];

	for (let i = 0; i < pathsToCheck.length; i++) {
		const filePath = path.resolve(pathsToCheck[i]);
		if (fs.existsSync(filePath)) {
			return filePath;
		}
	}

	console.error(`Could not find: ${tool}! Please check if you've downloaded it (or just read the README)!`);
	process.exit(1);
}

const ffmpegPath = getToolPath('ffmpeg');
const ffprobePath = getToolPath('ffprobe');
const audioFilePath = path.resolve('audio.mp3');

const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

const axios = require('axios');
const ghEmoji = require('github-emoji');
const { getUserInfo } = require('../extractor/extract');

// COORDINATES
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
	[1560, 370],
	[1612, 485],
	[1625, 604],
	[1420, 717],
	[1590, 836],
];

module.exports = async () => {
	const data = await getUserInfo('package/account/user.json');

	// UTILITY FUNCTIONS
	async function fetchEmojiBuffer(emoji) {
		const codepoint = Array.from(emoji).map((char) => char.codePointAt(0).toString(16))[0];

		// request twitter api for 512x512px twemoji
		const url = `https://abs.twimg.com/emoji/v2/svg/${codepoint}.svg`;

		const response = await axios.get(url, { responseType: 'arraybuffer' });

		// convert svg to 512x512px png
		const buffer = await sharp(response.data)
			.resize(512, 512)
			.png()
			.toBuffer();
		return buffer;
	}
	async function fetchDiscordEmojiBuffer(id) {
		const url = `https://cdn.discordapp.com/emojis/${id}.png`;

		const response = await axios.get(url, { responseType: 'arraybuffer' });
		return response.data;
	}
	async function fetchGameImage(id, image_id) {
		const url = `https://cdn.discordapp.com/app-icons/${id}/${image_id}.png`;

		const response = await axios.get(url, { responseType: 'arraybuffer' });
		return response.data;
	}
	async function fetchStickerImage(id) {
		const url = `https://cdn.discordapp.com/stickers/${id}.png`;

		// eslint-disable-next-line no-async-promise-executor
		return new Promise(async (resolve) => {
			try {
				const response = await axios.get(url, { responseType: 'arraybuffer' });
				resolve(response.data);
			}
			catch(e) {
				const response = await fs.readFileSync('./src/assets/no_sticker.png');
				resolve(Buffer.from(response.buffer, 'utf-8'));
			}
		});
	}
	async function fetchTenorGIF(url) {
		const response = await axios.get(url, { responseType: 'arraybuffer' });
		return response.data;
	}
	function getVideoFirstFrame(inputPath) {
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
					const imageBuffer = await fs.readFileSync(id);
					resolve(imageBuffer);
					await fs.rmSync(id);
				})
				.on('error', (err) => {
					reject(new Error(`Error extracting first frame: ${err.message}`));
				});
		});
	}

	// IMAGE MANIPULATION FUNCTIONS
	// async function createMostUsedSlash(array) {
	// 	const canvas = Canvas.createCanvas(1920, 1080);
	// 	const ctx = canvas.getContext('2d');
	// 	const image = 'image2';
	// 	ctx.drawImage((await Canvas.loadImage(cwd + 'src/assets/' + image + '.png')), 0, 0);

	// 	ctx.font = '75px Arial';

	// 	ctx.fillText(array[0], 250, 335);
	// 	ctx.fillText(array[1], 250, 450);
	// 	ctx.fillText(array[2], 250, 565);
	// 	ctx.fillText(array[3], 250, 680);
	// 	ctx.fillText(array[4], 250, 795);

	// 	const buffer = canvas.toBuffer();
	// 	fs.writeFileSync('src/output/' + image + '.png', buffer);
	// }
	async function createRecentGIFs(tenorLinks) {
		const canvas = Canvas.createCanvas(1920, 1080);
		const ctx = canvas.getContext('2d');
		const image = 'image3';

		let i = 0;

		ctx.drawImage((await Canvas.loadImage(path.resolve(`src/assets/${image}.png`))), 0, 0);

		const pagePromises = tenorLinks.map(async (tenorLink) => {
			tenorLink = tenorLink.src;

			const filename = tenorLink.split('/').pop() + '.gif';

			const gifBuffer = await fetchTenorGIF(tenorLink);
			fs.writeFileSync(filename, gifBuffer);

			const frameData = await getVideoFirstFrame(filename);

			ctx.drawImage((await Canvas.loadImage(frameData)), coordinates[i].x, coordinates[i].y, coordinates[i].w, coordinates[i].h);

			try {
				await fs.rmSync(filename);
			}
			catch(e) {
				return i++;
			}
			i++;
		});
		await Promise.all(pagePromises);

		const buffer = canvas.toBuffer();
		fs.writeFileSync(path.resolve(`src/output/${image}.png`), buffer);
	}
	async function createMostUsedEmojis(array) {
		const canvas = Canvas.createCanvas(1920, 1080);
		const ctx = canvas.getContext('2d');

		ctx.drawImage((await Canvas.loadImage(path.resolve('src/assets/image4.png'))), 0, 0);

		for (let i = 0; i < array.length; i++) {
			const emojiObj = array[i];
			const emoji = emojiObj.name;

			let buffer;

			if (!emojiObj.id) buffer = await fetchEmojiBuffer(emoji);
			if (emojiObj.id) buffer = await fetchDiscordEmojiBuffer(emojiObj.id);

			const image = await Canvas.loadImage(buffer);

			ctx.drawImage(image, emojisCoordinates[i][0], emojisCoordinates[i][1], emojisCoordinates[i][2], emojisCoordinates[i][3]);

			if (i === (array.length - 1)) {

				ctx.font = '75px Arial';

				array.forEach((x) => {
					let emojiname = ghEmoji.namesOf(x.name)[0] ? ghEmoji.namesOf(x.name)[0] : 'unknown';
					emojiname.replace('+1', 'thumbs_up');

					if (emojiname === 'unknown' && x.id) emojiname = x.name;

					if (emojiname.length >= 11) {
						x.name = emojiname.slice(0, 11) + '.';
					}
					else {
						x.name = emojiname;
					}
				});

				ctx.fillText(array[0].name, 610, 430);
				ctx.fillText(array[1].name, 610, 530);
				ctx.fillText(array[2].name, 610, 630);
				ctx.fillText(array[3].name, 610, 730);
				ctx.fillText(array[4].name, 610, 830);

				const outputBuffer = canvas.toBuffer();
				fs.writeFileSync(path.resolve('src/output/image4.png'), outputBuffer);
			}
		}
	}
	async function createMoneyCount(text) {
		const canvas = Canvas.createCanvas(1920, 1080);
		const ctx = canvas.getContext('2d');
		const image = 'image5';
		ctx.drawImage((await Canvas.loadImage(path.resolve(`src/assets/${image}.png`))), 0, 0);

		ctx.font = '235px Sans';
		ctx.strokestyle = '#000000';
		ctx.lineWidth = '7';

		ctx.strokeText(text, 115, 500);

		const buffer = canvas.toBuffer();

		fs.writeFileSync(path.resolve(`src/output/${image}.png`), buffer);
	}
	async function createMostPlayedGames(array) {
		const canvas = Canvas.createCanvas(1920, 1080);
		const ctx = canvas.getContext('2d');

		ctx.drawImage((await Canvas.loadImage(path.resolve('src/assets/image7.png'))), 0, 0);
		ctx.font = '40px Arial';
		ctx.textAlign = 'center';
		for (let i = 0; i < array.length; i++) {
			const imageBuffer = await fetchGameImage(array[i].id, array[i].icon);
			const image = await Canvas.loadImage(imageBuffer);
			const cdnts = gamesCoordinates[i];
			let name = array[i].name;

			if (name.length >= 12) {
				name = name.slice(0, 12) + '...';
			}

			ctx.drawImage(image, cdnts[0], cdnts[1], cdnts[2], cdnts[3]);
			ctx.fillText(name, cdnts[0] + 122, cdnts[1] - 18);
		}

		const buffer = canvas.toBuffer();
		fs.writeFileSync(path.resolve('src/output/image7.png'), buffer);
	}
	async function createMostUsedStickers(array) {
		const canvas = Canvas.createCanvas(1920, 1080);
		const ctx = canvas.getContext('2d');

		ctx.drawImage((await Canvas.loadImage(path.resolve('src/assets/image9.png'))), 0, 0);
		ctx.font = '40px Arial';
		ctx.textAlign = 'center';
		for (let i = 0; i < array.length; i++) {
			const imageBuffer = await fetchStickerImage(array[i].name);
			const image = await Canvas.loadImage(imageBuffer);
			const cdnts = stickersCoordinates[i];

			ctx.drawImage(image, cdnts[0], cdnts[1], cdnts[2], cdnts[3]);
		}

		const buffer = canvas.toBuffer();
		fs.writeFileSync(path.resolve('src/output/image9.png'), buffer);
	}
	async function createMostUsedWords(array) {
		const canvas = Canvas.createCanvas(1920, 1080);
		const ctx = canvas.getContext('2d');

		ctx.drawImage((await Canvas.loadImage(path.resolve('src/assets/image10.png'))), 0, 0);
		ctx.font = 'bold 80px Arial';

		for (let i = 0; i < array.length; i++) {
			const cdnts = wordsCoordinates.name[i];
			const cdnts2 = wordsCoordinates.count[i];
			let word = array[i][0];

			if (word.length >= 10) {
				word = word.slice(0, 10) + '..';
			}

			ctx.fillText(word, cdnts[0], cdnts[1]);
			ctx.fillText(array[i][1], cdnts2[0], cdnts2[1]);
		}

		const buffer = canvas.toBuffer();
		fs.writeFileSync(path.resolve('src/output/image10.png'), buffer);
	}
	async function createSummary(array) {
		const canvas = Canvas.createCanvas(1920, 1080);
		const ctx = canvas.getContext('2d');
		const values = Object.values(array);
		const keys = Object.keys(array);

		ctx.drawImage((await Canvas.loadImage(path.resolve('src/assets/image11.png'))), 0, 0);
		ctx.font = 'bold 50px Arial';

		for (let i = 0; i < values.length; i++) {
			const cdnts = summaryCoordinates[i];
			let name = values[i];

			name = name.toLocaleString();

			if(name == '0') name = 'N/A';

			if(['joinCallCount', 'openCount'].includes(keys[i])) name += ' times';
			if(['dmChannelCount'].includes(keys[i])) name += ' people';
			if(['channelCount'].includes(keys[i])) name += ' channels';

			ctx.fillText(name, cdnts[0], cdnts[1]);
		}

		const buffer = canvas.toBuffer();
		fs.writeFileSync(path.resolve('src/output/image11.png'), buffer);
	}

	// FRAMES
	await createRecentGIFs(data.most_recent_favorite_gifs || []);
	console.log('Finished creating 1st frame');
	await createMostUsedEmojis(data.most_used_emojis || []);
	console.log('Finished creating 2nd frame');
	await createMoneyCount(data.total_spend || 0);
	console.log('Finished creating 3rd frame');
	await createMostPlayedGames(data.most_played_games || []);
	console.log('Finished creating 4th frame');
	await createMostUsedStickers(data.most_used_stickers || []);
	console.log('Finished creating 5th frame');
	await createMostUsedWords(data.most_used_words || []);
	console.log('Finished creating 6th frame');

	// STATISTICS QUICKFIRE
	await createSummary(data.statistics);
	console.log('Finished creating 7th frame');

	// EDITING
	const editly = (await import('editly')).default;

	editly({
		// enableFfmpegLog: true,
		ffprobePath,
		ffmpegPath,
		audioFilePath: audioFilePath,
		outPath: 'wrapped.mp4',
		width: 1920,
		height: 1080,
		clips: [
			{
				duration: 2.5,
				layers: [
					{ type: 'image', path: path.resolve('src/assets/image1.png') },
				],
			},
			{
				duration: 5,
				layers: [
					{ type: 'image', path: path.resolve('src/output/image3.png') },
				],
			},
			{
				duration: 5,
				layers: [
					{ type: 'image', path: path.resolve('src/output/image4.png') },
				],
			},
			{
				duration: 5,
				layers: [
					{ type: 'image', path: path.resolve('src/output/image5.png') },
				],
			},
			{
				duration: 5,
				layers: [
					{ type: 'image', path: path.resolve('src/output/image7.png') },
				],
			},
			{
				duration: 5,
				layers: [
					{ type: 'image', path: path.resolve('src/output/image9.png') },
				],
			},
			{
				duration: 5,
				layers: [
					{ type: 'image', path: path.resolve('src/output/image10.png') },
				],
			},
			{
				duration: 10,
				layers: [
					{ type: 'image', path: path.resolve('src/output/image11.png') },
				],
			},
			{
				duration: 6,
				layers: [
					{ type: 'image', path: path.resolve('src/assets/image6.png') },
				],
			},
		],
	});
};