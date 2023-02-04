const fs = require('fs');
const axios = require('axios');
module.exports = {
    async returnGameData(arr) {
        const gamedata = []
        arr.forEach(async (e) => {
            data = await axios.get(`https://discord.com/api/v9/applications/${e.application_id}/rpc`);
            console.log(data.data)
            gamedata.push(data)

        })
        return gamedata;
    },
    async getUserInfo(dir) {
        const rawData = await fs.readFileSync(dir, 'utf-8').toString()
        const data = JSON.parse(rawData)
        const stickers = data.settings.frecency.stickerFrecency.stickers
        const scommands = data.settings.frecency.applicationCommandFrecency.applicationCommands

        const sortedEmojis = Object.entries(data.settings.frecency.emojiFrecency.emojis)
            .sort((a, b) => b[1].totalUses - a[1].totalUses)
            .map(([key, value]) => ({ key, value }));

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

        // console.log(sortedActivities, favSlashCommands)
        return {
            username: data.username,
            discrim: data.discriminator,
            avatar: data.avatar_hash,
            total_spend: totalSpent,
            most_recent_favorite_gifs: lastFavGifs ? lastFavGifs : null,
            most_used_slash_commands:favSlashCommands.length ? favSlashCommands.slice(0, 5) : null,
            most_used_stickers: favStickers.length ? favStickers.slice(0, 5) : null,
            most_used_emojis: sortedEmojis.length ? sortedEmojis.slice(0, 3) : null,
            most_played_games: sortedEmojis.length ? sortedActivities.slice(0, 2) : null
        }
    }
}