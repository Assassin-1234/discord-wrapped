import path from 'path';
import fs from 'fs';
import { snakeCase } from 'snake-case';
import axios from 'axios';
import Tasks from '../../constants/progress';

const eventsData = [
	'joinVoiceChannel',
	'notificationClicked',
	'appOpened',
	'joinCall',
	'addReaction',
	'messageEdited',
	'sendMessage',
	'slashCommandUsed',
];

let messages: any[] = [];

/**
 *
 * @param {string} filePath The path to the analytics file
 * @param {(progress: number, info: string) => void} progressCallback The callback to call when the progress changes
 * @returns {any} The analytics data
 */
const readAnalyticsFile = (filePath: string, progressCallback: (progress: number, info: string) => void): any => {
	if (!fs.existsSync(filePath)) {
		return {
			joinVoiceChannelCount: 0,
			joinCallCount: 0,
			channelCount: 0,
			dmChannelCount: 0,
			notificationCount: 0,
			sendMessageCount: 0,
			messageEditedCount: 0,
			slashCommandUsedCount: 0,
			addReactionCount: 0,
			openCount: 0,
		};
	}

	return new Promise((resolve, reject) => {
		const eventsOccurrences: any = {};
		for (const eventName of eventsData) {
			eventsOccurrences[eventName] = 0;
		}

		const stream = fs.createReadStream(filePath, { encoding: 'utf8' });

		progressCallback(Math.round((3 / Tasks.length) * 100), Tasks[2]);

		const stats = fs.statSync(filePath);

		let str = '';
		let bytesRead = 0;
		const maxBytes = Math.floor(stats.size);

		stream.on('data', (chunk) => {
			str += chunk;
			bytesRead += chunk.length;

			for (const event of Object.keys(eventsOccurrences)) {
				const eventName = snakeCase(event);

				// eslint-disable-next-line no-constant-condition
				while (true) {
					const ind = str.indexOf(eventName);
					if (ind == -1) {
						break;
					}
					str = str.slice(ind + eventName.length);
					eventsOccurrences[event]++;

					progressCallback(Math.round((4 / Tasks.length) * 100), Tasks[3].replace('progress', Math.round((bytesRead / maxBytes) * 100).toString()));
				}
			}
		});

		stream.on('end', () => {
			resolve({
				joinVoiceChannelCount: eventsOccurrences.joinVoiceChannel,
				joinCallCount: eventsOccurrences.joinCall,
				channelCount: 0,
				dmChannelCount: 0,
				notificationCount: eventsOccurrences.notificationClicked,
				sendMessageCount: eventsOccurrences.sendMessage,
				messageEditedCount: eventsOccurrences.messageEdited,
				slashCommandUsedCount: eventsOccurrences.slashCommandUsed,
				addReactionCount: eventsOccurrences.addReaction,
				openCount: eventsOccurrences.appOpened,
			});
		});

		stream.on('error', (err) => {
			reject(err);
		});
	});
};

/**
 * Fetch messages
 * @returns {void}
 */
function fetchMessages(dataPackage: string): void {
	const messagesPath = path.resolve(`${dataPackage}/messages`);

	const files = fs.readdirSync(messagesPath);

	files.forEach(file => {
		if (file.includes('.json')) return;

		const filePath = path.join(messagesPath, file, 'messages.csv');
		const data = fs.readFileSync(filePath, 'utf-8');

		const lines = data.split('\n').slice(1);
		lines.forEach(function(line) {
			const parts = line.split(',');

			if (parts.length > 2) messages.push(parts[2]);
		});
	});
}

/**
 * Return the most common
 * @returns {any[][]}
 */
function returnMostCommon(): any[][] {
	const frequency: any = {};
	messages = messages.filter((x) => x !== '');
	messages.forEach(function(value) { frequency[value] = 0; });
	messages.forEach(function(value) { frequency[value]++; });
	let sortable = [];
	for (const emoji in frequency) {
		sortable.push([emoji, frequency[emoji]]);
	}
	sortable.sort(function(a, b) {
		return b[1] - a[1];
	});

	sortable = sortable.slice(0, 5);
	return sortable;
}

/**
 * Return the most used emoji
 * @param {string} message The message
 * @returns {any[]}
 */
function returnMostUsedEmoji(message: string): any[] {
	const emojiRegex = /<(a)?:[a-zA-Z0-9_]+:([0-9]+)>|([\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}]{1,3})/gu;

	let emojiList: any = {};
	let emojiMatch;

	// eslint-disable-next-line no-cond-assign
	while (emojiMatch = emojiRegex.exec(message)) {
		const emoji = emojiMatch[0];

		if (!emojiList[emoji]) {
			const match = emoji.match(/<?(?:(a):)?(\w{2,32}):(\d{17,19})?>?/);

			if (match === null) {
				emojiList[emoji] = {
					id: null,
					name: emoji,
					count: 0,
				};
			} else {
				emojiList[emoji] = {
					id: match[3],
					name: match[2],
					count: 0,
				};
			}
		}

		emojiList[emoji].count++;
	}

	emojiList = Object.values(emojiList).sort((a: any, b: any) => b.count - a.count);

	return emojiList;
}

/**
 * Return game data
 * @param {any[]} arr The array with game data
 * @returns {Promise<any[]>}
 */
async function returnGameData(arr: any[]): Promise<any[]> {
	const gamedata = await Promise.all(arr.map(async (e) => {
		const { data } = await axios.get(`https://discord.com/api/v9/applications/${e.application_id}/rpc`);
		return data;
	}));

	return gamedata;
}

/**
 * Get user info
 * @param {string} dir The directory to get the data from
 * @param {(progress: number, info: string) => void} progressCallback The callback to call when the progress changes
 * @returns {Promise<any>} The user info
 */
export async function getUserInfo(dir: string, dataPackage: string, progressCallback: (progress: number, info: string) => void): Promise<any> {
	const rawData = fs.readFileSync(path.resolve(dir), 'utf-8').toString();
	const data = JSON.parse(rawData);
	const stickers = data.settings.frecency.stickerFrecency.stickers;

	fetchMessages(dataPackage);

	const sortedEmojis = returnMostUsedEmoji(messages.join(''));
	const sortedActivities = data.user_activity_application_statistics
		.sort((a: any, b: any) => b.total_duration - a.total_duration);
	const totalSpent = (data.payments.reduce((total: number, payment: any) => payment.status === 1 ? total + payment.amount : total, 0) / 100).toFixed(2);
	const lastFavGifs = Object.values(data.settings.frecency.favoriteGifs.gifs).sort((a: any, b: any) => b.order - a.order).slice(0, 5);
	const favStickers = Object.keys(stickers)
		.sort((a, b) => stickers[b].totalUses - stickers[a].totalUses)
		.map(key => ({ name: key, ...stickers[key] }));

	const mostUsedWords = returnMostCommon();

	const mostPlayedGames = await returnGameData(sortedActivities.slice(0, 5));

	const files = fs.existsSync(path.resolve(`${dataPackage}/activity/analytics`))
		? fs.readdirSync(path.resolve(`${dataPackage}/activity/analytics`))
		: [];

	const filePath = files.find((file) => /events-[0-9]{4}-[0-9]{5}-of-[0-9]{5}\.json/.test(file)) || 'not_found';
	const statistics: any = await readAnalyticsFile(path.resolve(`${dataPackage}/activity/analytics/`, filePath), progressCallback);

	const messagesPathRegex = /c?([0-9]{16,32})/;

	const channelsIDsFile = fs.readdirSync(path.resolve(`${dataPackage}/messages`));

	const isOldPackage = !channelsIDsFile[0].includes('c');
	const channelsIDs = channelsIDsFile.slice(0, channelsIDsFile.length - 1).map((file) => file.match(messagesPathRegex)?.[1]);
	const channels: any[] = [];

	await Promise.all(channelsIDs.map((channelID) => {
		return new Promise<void>((resolve) => {
			const channelDataPath = path.resolve(`${dataPackage}/messages/${isOldPackage ? '' : 'c'}${channelID}/channel.json`);
			const channelMessagesPath = path.resolve(`${dataPackage}/messages/${isOldPackage ? '' : 'c'}${channelID}/messages.csv`);

			Promise.all([
				fs.readFileSync(channelDataPath),
				fs.readFileSync(channelMessagesPath),
			]).then(([rawData2]) => {
				const data2 = JSON.parse(rawData2.toString());
				const isDM = data2.recipients && data2.recipients.length === 2;
				channels.push({
					data: data2,
					isDM,
				});

				resolve();
			});

		});
	}));

	statistics.channelCount = channels.filter(c => !c.isDM).length;
	statistics.dmChannelCount = channels.length - statistics.channelCount;

	return {
		statistics,
		username: data.username,
		discrim: data.discriminator,
		avatar: data.avatar_hash,
		total_spend: '$' + totalSpent,
		most_recent_favorite_gifs: lastFavGifs ? lastFavGifs.slice(0, 3) : [],
		most_used_stickers: favStickers.length ? favStickers.slice(0, 5) : [],
		most_used_emojis: sortedEmojis.length ? sortedEmojis.slice(0, 5) : [],
		most_played_games: mostPlayedGames.length ? mostPlayedGames.slice(0, 4) : [],
		most_used_words: mostUsedWords,
	};
}