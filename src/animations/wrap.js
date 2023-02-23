const cwd = process.cwd().split('discord-wrapped')[0] + 'discord-wrapped/src/';
const pwd = process.cwd().split('discord-wrapped')[0] + 'discord-wrapped/';

const Canvas = require('canvas');
const sharp = require('sharp');

const fs = require('fs');
const editly = require('editly');

function getToolPath(tool) {
	[
		`${pwd}${tool}.exe`,
		`${pwd}${tool}`,
		`/usr/bin/${tool}`,
		tool,
	].forEach((path) => {
		if (fs.existsSync(path)) {
			return path;
		}
	});
	console.error(`Could not find ${tool}! Please check if you've downloaded it (or just read the README)!`);
	process.exit(1);
}

const ffmpegPath = getToolPath('ffmpeg');
const ffprobePath = getToolPath('ffprobe');
const audioFilePath = pwd + 'audio.mp3';

const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

const axios = require('axios');
const ghEmoji = require('github-emoji');
const { getUserInfo } = require('../extractor/extract');

// COORDINATES
const coordinates = [
	{ x: 141, y: 485, w: 372, h: 372 },
	{ x: 774, y: 485, w: 372, h: 372 },
	{ x: 1429, y: 485, w: 372, h: 372 },
];
const emojisCoordinates = [
	[139, 442, 373, 373],
	[1215, 40, 279, 279],
	[1582, 228, 279, 279],
	[1213, 442, 279, 279],
	[1584, 692, 279, 279],
];
const gamesCoordinates = [
	[288, 308, 304, 304],
	[619, 308, 304, 304],
	[952, 308, 304, 304],
	[1289, 308, 304, 304],
];
const stickersCoordinates = [
	[799, 220, 380, 380],
	[196, 680, 275, 275],
	[636, 680, 275, 275],
	[1076, 680, 275, 275],
	[1516, 680, 275, 275],
];
const wordsCoordinates = {
	name: [
		[590, 316],
		[590, 447],
		[590, 578],
		[590, 710],
		[590, 842],
	],
	count: [
		[1200, 314],
		[1200, 445],
		[1200, 576],
		[1200, 708],
		[1200, 840],
	],
};
const summaryCoordinates = [
	[950, 215],
	[1120, 291],
	[980, 373],
	[950, 463],
	[955, 556],
	[1120, 641],
	[1070, 719],
	[1190, 792],
	[1350, 868],
	[1180, 945],
];

module.exports = async () => {
	const data = await getUserInfo('account/user.json');

	// UTILITY FUNCTIONS
	async function fetchEmojiBuffer(emoji) {
		let codepoint = Array.from(emoji)
			.map((char) => char.codePointAt(0).toString(16))
			.join('-');
		if(codepoint == '1f979-1f979-1f979') codepoint = '1f614';
		
		// request twitter api for 512x512px twemoji
		const url = `https://abs.twimg.com/emoji/v2/svg/${codepoint}.svg`

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

		ctx.drawImage((await Canvas.loadImage(`${cwd}assets/${image}.png`)), 0, 0);

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
		fs.writeFileSync(`${cwd}output/${image}.png`, buffer);
	}
	async function createMostUsedEmojis(array) {
		const canvas = Canvas.createCanvas(1920, 1080);
		const ctx = canvas.getContext('2d');

		ctx.drawImage((await Canvas.loadImage(`${cwd}assets/image4.png`)), 0, 0);

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

					if (emojiname.length >= 7) {
						x.name = emojiname.slice(0, 7) + '.';
					}
					else {
						x.name = emojiname;
					}
				});

				ctx.fillText(array[0].name, 780, 430);
				ctx.fillText(array[1].name, 780, 530);
				ctx.fillText(array[2].name, 780, 630);
				ctx.fillText(array[3].name, 780, 730);
				ctx.fillText(array[4].name, 780, 830);

				const outputBuffer = canvas.toBuffer();
				fs.writeFileSync(cwd + 'output/image4.png', outputBuffer);
			}
		}
	}
	async function createMoneyCount(text) {
		const canvas = Canvas.createCanvas(1920, 1080);
		const ctx = canvas.getContext('2d');
		const image = 'image5';
		ctx.drawImage((await Canvas.loadImage(`${cwd}assets/${image}.png`)), 0, 0);

		ctx.font = '235px Sans';
		ctx.strokestyle = '#000000';
		ctx.lineWidth = '7';

		ctx.strokeText(text, 170, 500);

		const buffer = canvas.toBuffer();

		fs.writeFileSync(cwd + 'output/' + image + '.png', buffer);
	}
	async function createMostPlayedGames(array) {
		console.log(array)
		const canvas = Canvas.createCanvas(1920, 1080);
		const ctx = canvas.getContext('2d');

		ctx.drawImage((await Canvas.loadImage(`${cwd}assets/image7.png`)), 0, 0);
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
			ctx.fillText(name, cdnts[0] + 147, cdnts[1] - 15);
		}

		const buffer = canvas.toBuffer();
		fs.writeFileSync(cwd + 'output/image7.png', buffer);
	}
	async function createMostUsedStickers(array) {
		const canvas = Canvas.createCanvas(1920, 1080);
		const ctx = canvas.getContext('2d');

		ctx.drawImage((await Canvas.loadImage(`${cwd}assets/image9.png`)), 0, 0);
		ctx.font = '40px Arial';
		ctx.textAlign = 'center';
		for (let i = 0; i < array.length; i++) {
			const imageBuffer = await fetchStickerImage(array[i].name);
			const image = await Canvas.loadImage(imageBuffer);
			const cdnts = stickersCoordinates[i];

			ctx.drawImage(image, cdnts[0], cdnts[1], cdnts[2], cdnts[3]);
		}

		const buffer = canvas.toBuffer();
		fs.writeFileSync(cwd + 'output/image9.png', buffer);
	}
	async function createMostUsedWords(array) {
		const canvas = Canvas.createCanvas(1920, 1080);
		const ctx = canvas.getContext('2d');

		ctx.drawImage((await Canvas.loadImage(`${cwd}assets/image10.png`)), 0, 0);
		ctx.font = 'bold 100px Arial';

		for (let i = 0; i < array.length; i++) {
			const cdnts = wordsCoordinates.name[i];
			const cdnts2 = wordsCoordinates.count[i];
			let word = array[i][0];

			if (word.length >= 7) {
				word = word.slice(0, 7) + '...';
			}

			ctx.fillText(word, cdnts[0], cdnts[1]);
			ctx.fillText(array[i][1], cdnts2[0], cdnts2[1]);
		}

		const buffer = canvas.toBuffer();
		fs.writeFileSync(cwd + 'output/image10.png', buffer);
	}
	async function createSummary(array) {
		const canvas = Canvas.createCanvas(1920, 1080);
		const ctx = canvas.getContext('2d');
		const values = Object.values(array);
		const keys = Object.keys(array);

		ctx.drawImage((await Canvas.loadImage(`${cwd}assets/image11.png`)), 0, 0);
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
		fs.writeFileSync(cwd + 'output/image11.png', buffer);
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
					{ type: 'image', path: cwd + 'assets/image1.png' },
				],
			},
			{
				duration: 5,
				layers: [
					{ type: 'image', path: cwd + 'output/image3.png' },
				],
			},
			{
				duration: 5,
				layers: [
					{ type: 'image', path: cwd + 'output/image4.png' },
				],
			},
			{
				duration: 5,
				layers: [
					{ type: 'image', path: cwd + 'output/image5.png' },
				],
			},
			{
				duration: 5,
				layers: [
					{ type: 'image', path: cwd + 'output/image7.png' },
				],
			},
			{
				duration: 5,
				layers: [
					{ type: 'image', path: cwd + 'output/image9.png' },
				],
			},
			{
				duration: 5,
				layers: [
					{ type: 'image', path: cwd + 'output/image10.png' },
				],
			},
			{
				duration: 10,
				layers: [
					{ type: 'image', path: cwd + 'output/image11.png' },
				],
			},
			{
				duration: 6,
				layers: [
					{ type: 'image', path: cwd + 'assets/image6.png' },
				],
			},
		],
	});
};