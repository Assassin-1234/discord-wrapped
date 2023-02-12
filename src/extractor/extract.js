const fs = require('fs');
const axios = require('axios');
const path = require('path');

let messages = [];
const messagesPath = 'package/messages';

function fetchMessages() {
    const files = fs.readdirSync(messagesPath)

    files.forEach(file => {
        if (file.includes('.json')) return

        const filePath = path.join(messagesPath, file, 'messages.csv');
        const data = fs.readFileSync(filePath, "utf-8");

        let lines = data.split("\n");
        lines.forEach(function (line) {
            let parts = line.split(",");

            if (parts.length > 2) messages.push(parts[2]);
        });
    })
}
function returnMostCommon() {
    const frequency = {};
    messages = messages.filter((x) => x !== '')
    messages.forEach(function (value) { frequency[value] = 0; });
    messages.forEach(function (value) { frequency[value]++; });
    let sortable = [];
    for (const emoji in frequency) {
        sortable.push([emoji, frequency[emoji]]);
    }
    sortable.sort(function (a, b) {
        return b[1] - a[1];
    });

    sortable = sortable.slice(0, 5)
    return sortable;
}
function returnMostUsedEmoji(message) {
    const emojiRegex = /<(a)?:[a-zA-Z0-9_]+:([0-9]+)>|([\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}]{1,3})/gu;

    let emojiList = {};

    while (emojiMatch = emojiRegex.exec(message)) {
        let emoji = emojiMatch[0];

        if (!emojiList[emoji]) {
            const match = emoji.match(/<?(?:(a):)?(\w{2,32}):(\d{17,19})?>?/);

            if (match === null) {
                emojiList[emoji] = {
                    id: null,
                    name: emoji,
                    count: 0
                }
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

    emojiList = Object.values(emojiList).sort((a, b) => b.count - a.count);

    return emojiList
}

module.exports = {
    async returnGameData(arr) {
        const gamedata = []
        arr.forEach(async (e) => {
            data = await axios.get(`https://discord.com/api/v9/applications/${e.application_id}/rpc`);
            console.log(data.data)
            gamedata.push(data.data)

        })
        return gamedata;
    },
    async getUserInfo(dir) {
        const rawData = await fs.readFileSync(dir, 'utf-8').toString()
        const data = JSON.parse(rawData)
        const stickers = data.settings.frecency.stickerFrecency.stickers
        const scommands = data.settings.frecency.applicationCommandFrecency.applicationCommands

        fetchMessages();

        const sortedEmojis = returnMostUsedEmoji(messages.join(''));

        const sortedActivities = data.user_activity_application_statistics
            .sort((a, b) => b.total_duration - a.total_duration);
        const totalSpent = (data.payments.reduce((total, payment) => payment.status === 1 ? total + payment.amount : total, 0) / 100).toFixed(2)
        const lastFavGifs = Object.values(data.settings.frecency.favoriteGifs.gifs).sort((a, b) => b.order - a.order).slice(0, 5);
        const favStickers = Object.keys(stickers)
            .sort((a, b) => stickers[b].totalUses - stickers[a].totalUses)
            .map(key => ({ name: key, ...stickers[key] }));

        const favSlashCommands = Object.keys(scommands)
            .sort((a, b) => scommands[b].totalUses - scommands[a].totalUses)
            .map(key => ({ name: key, ...scommands[key] }));

        const mostUsedWords = returnMostCommon();

        // console.log(sortedActivities, favSlashCommands)
        return {
            username: data.username,
            discrim: data.discriminator,
            avatar: data.avatar_hash,
            total_spend: totalSpent,
            most_recent_favorite_gifs: lastFavGifs ? lastFavGifs : null,
            most_used_slash_commands: favSlashCommands.length ? favSlashCommands.slice(0, 5) : null,
            most_used_stickers: favStickers.length ? favStickers.slice(0, 5) : null,
            most_used_emojis: sortedEmojis.length ? sortedEmojis.slice(0, 5) : null,
            most_played_games: sortedEmojis.length ? sortedActivities.slice(0, 2) : null,
            most_used_words: mostUsedWords
        }
    },
}