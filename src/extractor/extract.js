const fs = require('fs');
const axios = require('axios');
const path = require('path');
const { snakeCase } = require('snake-case');
const messagesPath = 'package/messages';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
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
let messages = [];

const readAnalyticsFile = (filePath) => {
	if(!fs.existsSync(filePath)) {
		console.log('WARNING: No analytics file found, likely privacy protection is on.');
		return {
			joinVoiceChannelCount: 0,
			sendMessageCount: 0,
			addReactionCount: 0,
			dmChannelCount: 0,
			channelCount: 0,
			joinCallCount: 0,
			notificationCount: 0,
			messageEditedCount: 0,
			slashCommandUsedCount: 0,
			openCount: 0,
		};
	}
	return new Promise((resolve, reject) => {
		const eventsOccurrences = {};
		for (const eventName of eventsData) {
			eventsOccurrences[eventName] = 0;
		}

		const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
		let str = '';

		console.log('Currently processing the events, might take some time!');

		stream.on('data', (chunk) => {
			str += chunk;
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
				}
			}
		});

		stream.on('end', () => {
			resolve({
				joinVoiceChannelCount: eventsOccurrences.joinVoiceChannel,
				sendMessageCount: eventsOccurrences.sendMessage,
				addReactionCount: eventsOccurrences.addReaction,
				dmChannelCount: 0,
				channelCount: 0,
				joinCallCount: eventsOccurrences.joinCall,
				notificationCount: eventsOccurrences.notificationClicked,
				messageEditedCount: eventsOccurrences.messageEdited,
				slashCommandUsedCount: eventsOccurrences.slashCommandUsed,
				openCount: eventsOccurrences.appOpened,
			});
		});

		stream.on('error', (err) => {
			reject(err);
		});
	});
};
function fetchMessages() {
	const files = fs.readdirSync(messagesPath);

	files.forEach(file => {
		if (file.includes('.json')) return;

		const filePath = path.join(messagesPath, file, 'messages.csv');
		const data = fs.readFileSync(filePath, 'utf-8');

		const lines = data.split('\n');
		lines.forEach(function(line) {
			const parts = line.split(',');

			if (parts.length > 2) messages.push(parts[2]);
		});
	});
}
function returnMostCommon() {
	const frequency = {};
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
function returnMostUsedEmoji(message) {
	const emojiRegex = /<(a)?:[a-zA-Z0-9_]+:([0-9]+)>|([\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}]{1,3})/gu;

	let emojiList = {};

	// eslint-disable-next-line no-cond-assign, no-undef
	while (emojiMatch = emojiRegex.exec(message)) {
		// eslint-disable-next-line no-undef
		const emoji = emojiMatch[0];

		if (!emojiList[emoji]) {
			const match = emoji.match(/<?(?:(a):)?(\w{2,32}):(\d{17,19})?>?/);

			if (match === null) {
				emojiList[emoji] = {
					id: null,
					name: emoji,
					count: 0,
				};
			}
			else {
				emojiList[emoji] = {
					id: match[3],
					name: match[2],
					count: 0,
				};
			}
		}

		emojiList[emoji].count++;
	}

	emojiList = Object.values(emojiList).sort((a, b) => b.count - a.count);

	return emojiList;
}
async function returnGameData(arr) {
	const gamedata = [];
	arr.forEach(async (e) => {
		const { data } = await axios.get(`https://discord.com/api/v9/applications/${e.application_id}/rpc`);
		gamedata.push(data);
	});

	// can't track the loop above
	await sleep(1000);

	return gamedata;
}

module.exports = {

	async getUserInfo(dir) {
		const rawData = await fs.readFileSync(dir, 'utf-8').toString();
		const data = JSON.parse(rawData);
		const stickers = data.settings.frecency.stickerFrecency.stickers;
		// const scommands = data.settings.frecency.applicationCommandFrecency.applicationCommands;

		fetchMessages();

		const sortedEmojis = returnMostUsedEmoji(messages.join(''));
		const sortedActivities = data.user_activity_application_statistics
			.sort((a, b) => b.total_duration - a.total_duration);
		const totalSpent = (data.payments.reduce((total, payment) => payment.status === 1 ? total + payment.amount : total, 0) / 100).toFixed(2);
		const lastFavGifs = Object.values(data.settings.frecency.favoriteGifs.gifs).sort((a, b) => b.order - a.order).slice(0, 5);
		const favStickers = Object.keys(stickers)
			.sort((a, b) => stickers[b].totalUses - stickers[a].totalUses)
			.map(key => ({ name: key, ...stickers[key] }));

		// we are unable to get the name of the commands
		// const favSlashCommands = Object.keys(scommands)
		// 	.sort((a, b) => scommands[b].totalUses - scommands[a].totalUses)
		// 	.map(key => ({ name: key, ...scommands[key] }));

		const mostUsedWords = returnMostCommon();

		const mostPlayedGames = await returnGameData(sortedActivities.slice(0, 5));

		const files = await fs.readdirSync('package/activity/analytics');
		const filePath = files.find((file) => /events-[0-9]{4}-[0-9]{5}-of-[0-9]{5}\.json/.test(file));
		const statistics = await readAnalyticsFile('package/activity/analytics/' + filePath);
		const messagesPathRegex = /c?([0-9]{16,32})/;

		const channelsIDsFile = fs.readdirSync('package/messages');

		// Packages before 06-12-2021 does not have the leading "c" before the channel ID
		const isOldPackage = !channelsIDsFile[0].includes('c');
		const channelsIDs = channelsIDsFile.slice(0, channelsIDsFile.length - 1).map((file) => file.match(messagesPathRegex)[1]);
		const channels = [];

		await Promise.all(channelsIDs.map((channelID) => {
			return new Promise((resolve) => {

				const channelDataPath = `package/messages/${isOldPackage ? '' : 'c'}${channelID}/channel.json`;
				const channelMessagesPath = `package/messages/${isOldPackage ? '' : 'c'}${channelID}/messages.csv`;

				Promise.all([
					fs.readFileSync(channelDataPath),
					fs.readFileSync(channelMessagesPath),
				]).then(([ rawData2 ]) => {
					const data2 = JSON.parse(rawData2);
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
			most_recent_favorite_gifs: lastFavGifs ? lastFavGifs.slice(0, 3) : null,
			// most_used_slash_commands: favSlashCommands.length ? favSlashCommands.slice(0, 5) : null,
			most_used_stickers: favStickers.length ? favStickers.slice(0, 5) : null,
			most_used_emojis: sortedEmojis.length ? sortedEmojis.slice(0, 5) : null,
			most_played_games: mostPlayedGames.length ? mostPlayedGames.slice(0, 4) : null,
			most_used_words: mostUsedWords,
		};
	},
};