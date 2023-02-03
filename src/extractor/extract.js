const fs = require('fs')
const Papa = require('papaparse');
// const activities = {
//     "880218394199220334": "Youtube Together",
//     "755827207812677713": "Poker Night",
//     "814288819477020702": "Fishington.io",
//     "773336526917861400": "Betrayal.io",
//     "832012774040141894": "Chess In The Park Dev",
//     "902271654783242291": "Sketch Heads",
//     "879863686565621790": "Letter League",
//     "879863976006127627": "Word Snacks",
//     "852509694341283871": "SpellCast",
//     "832013003968348200": "Checkers In The Park",
//     "832025144389533716": "Blazing 8s",
//     "945737671223947305": "Putt Party",
//     "903769130790969345": "Land.io",
//     "947957217959759964": "Bobble League",
//     "976052223358406656": "Ask Away",
//     "950505761862189096": "Know What I Meme",
//     "1006584476094177371": "Bash Out"
// }
module.exports = {
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

        console.log(favSlashCommands)
        return {
            username: data.username,
            discrim: data.discriminator,
            avatar: data.avatar_hash,
            total_spend: totalSpent,

            most_recent_favorite_gifs: lastFavGifs,
    
            most_used_slash_commands:favSlashCommands.slice(0, 5),
            most_used_stickers: favStickers.slice(0, 5),
            most_used_emojis: sortedEmojis.slice(0, 3),
            most_used_activities: sortedActivities.slice(0, 2)
        }
    }
}

const parseCSV = (input) => {
    return Papa.parse(input, {
        header: true,
        newline: ',\r'
    })
        .data
        .filter((m) => m.Contents)
        .map((m) => ({
            id: m.ID,
            timestamp: m.Timestamp,
            length: m.Contents.length,
            words: m.Contents.split(' ')
        }));
};