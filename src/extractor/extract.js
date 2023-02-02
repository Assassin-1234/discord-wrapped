const fs = require('fs')
module.exports = {
    async getUserInfo(dir) {
        const rawData = await fs.readFileSync(dir, 'utf-8').toString()
        const data = JSON.parse(rawData)
        const sortedEmojis = Object.values(data.settings.frecency.emojiFrecency.emojis).sort((a, b) => b.totalUses - a.totalUses);
        const sortedActivities = data.user_activity_application_statistics.sort((a, b) => b.total_duration - a.total_duration);
        const totalSpent = (data.payments.reduce((total, payment) => payment.status === 1 ? total + payment.amount : total, 0) / 100).toFixed(2)
        console.log(totalSpent)
        return {
            username: data.username, 
            discrim: data.discriminator, 
            avatar: data.avatar_hash,
            total_spend: totalSpent,
            most_used_emojis: sortedEmojis.slice(0, 3), 
            most_played_activities: sortedActivities.slice(0, 2)
        }
    }
}
