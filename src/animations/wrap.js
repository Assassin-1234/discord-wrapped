(async () => {
    const Canvas = require('canvas')

    const { writeFileSync } = require('fs')
    const fs = require('fs')
    const puppeteer = require('puppeteer');
    const gifFrames = require('gif-frames');

    const coordinates = [
        { x: 141, y: 485, w: 372, h: 372 },
        { x: 774, y: 485, w: 372, h: 372 },
        { x: 1429, y: 485, w: 372, h: 372 },
    ]
    const emojisCoordinates = [
        [204, 515, 257, 257],
        [1215, 40, 279, 279],
        [1582, 228, 279, 279],
        [1213, 442, 279, 279],
        [1584, 692, 279, 279],
    ]
    const axios = require('axios');
    const ghEmoji = require('github-emoji');

    async function fetchEmojiBuffer(emoji) {
        const codepoint = Array.from(emoji)
            .map((char) => char.codePointAt(0).toString(16))
            .join('-');

        const url = `https://emoji.aranja.com/static/emoji-data/img-twitter-72/${codepoint}.png`;

        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return response.data;
    }
    async function fetchDiscordEmojiBuffer(id) {
        const url = `https://cdn.discordapp.com/emojis/${id}.png`;

        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return response.data;
    }

    async function createMostUsedSlash(array) {
        const canvas = Canvas.createCanvas(1920, 1080)
        const ctx = canvas.getContext('2d')
        const image = 'image2'
        ctx.drawImage((await Canvas.loadImage('src/assets/' + image + '.png')), 0, 0)

        ctx.font = '75px Arial'

        ctx.fillText(array[0], 250, 335)
        ctx.fillText(array[1], 250, 450)
        ctx.fillText(array[2], 250, 565)
        ctx.fillText(array[3], 250, 680)
        ctx.fillText(array[4], 250, 795)

        const buffer = canvas.toBuffer();
        writeFileSync("src/test/" + image + ".png", buffer);
    }
    async function createRecentGIFs(tenorLinks) {
        const canvas = Canvas.createCanvas(1920, 1080)
        const ctx = canvas.getContext('2d')
        const image = 'image3'

        let i = 0;

        ctx.drawImage((await Canvas.loadImage('src/assets/' + image + '.png')), 0, 0)

        const browser = await puppeteer.launch({});
        const pagePromises = tenorLinks.map(async (tenorLink) => {
            const page = await browser.newPage();
            await page.goto(tenorLink);

            const img = await page.waitForXPath('/html/body/div/div/div[3]/div/div[1]/div[2]/div/div/div/div/img');

            const gifUrl = await page.evaluate(img => img.src, img);

            const filename = tenorLink.split('/').pop() + '.gif';

            const gifBuffer = await page.goto(gifUrl).then(res => res.buffer());
            fs.writeFileSync(filename, gifBuffer);

            await gifFrames({ url: filename, frames: 0 }).then(async function (frameData) {
                ctx.drawImage((await Canvas.loadImage(frameData[0].getImage()._obj)), coordinates[i].x, coordinates[i].y, coordinates[i].w, coordinates[i].h)
            });

            fs.rmSync(filename);
            i++;
            return page.close();
        });
        await Promise.all(pagePromises);
        await browser.close();

        const buffer = canvas.toBuffer();
        writeFileSync("src/test/" + image + ".png", buffer);
    }
    async function createMostUsedEmojis(array) {
        const canvas = Canvas.createCanvas(1920, 1080)
        const ctx = canvas.getContext('2d')

        ctx.drawImage((await Canvas.loadImage('src/assets/image4.png')), 0, 0)

        for (let i = 0; i < array.length; i++) {
            const emojiObj = array[i];
            const emoji = emojiObj.name;

            let buffer;

            if (!emojiObj.id) buffer = await fetchEmojiBuffer(emoji)
            if (emojiObj.id) buffer = await fetchDiscordEmojiBuffer(emojiObj.id)

            const image = await Canvas.loadImage(buffer)

            ctx.drawImage(image, emojisCoordinates[i][0], emojisCoordinates[i][1], emojisCoordinates[i][2], emojisCoordinates[i][3]);

            if (i === (array.length - 1)) {

                ctx.font = '75px Arial'

                array.forEach((x) => {
                    if (x.id) return;

                    const emojiname = ghEmoji.namesOf(x.name)[0]
                        .replace('+1', 'thumbs_up') // lol

                    if (emojiname.length >= 7) {
                        x.name = emojiname.slice(0, 7) + '...'
                    } else {
                        x.name = emojiname
                    }
                })
                ctx.fillText(array[0].name, 780, 430);
                ctx.fillText(array[1].name, 780, 530);
                ctx.fillText(array[2].name, 780, 630);
                ctx.fillText(array[3].name, 780, 730);
                ctx.fillText(array[4].name, 780, 830);

                const buffer = canvas.toBuffer();
                writeFileSync("src/test/image4.png", buffer);
            }
        }
    }
    async function createMoneyCount(text) {
        const canvas = Canvas.createCanvas(1920, 1080)
        const ctx = canvas.getContext('2d')
        const image = 'image5'
        ctx.drawImage((await Canvas.loadImage('src/assets/' + image + '.png')), 0, 0)

        ctx.font = '275px Sans'
        ctx.strokestyle = '#000000'
        ctx.lineWidth = '7'

        ctx.strokeText(text, 75, 500)

        const buffer = canvas.toBuffer();

        writeFileSync("src/test/" + image + ".png", buffer);
    }
    createMoneyCount('$5400')
})()