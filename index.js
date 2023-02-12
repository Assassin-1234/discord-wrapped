(async() => {
const { getUserInfo } = require('./src/extractor/extract')

console.log((await getUserInfo('package/account/user.json')).most_played_games)
})()