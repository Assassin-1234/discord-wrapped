(async() => {
const { getUserInfo, returnGameData } = require('./src/extractor/extract')

const data = await getUserInfo('package/account/user.json')
await returnGameData(data.most_played_games)
})()