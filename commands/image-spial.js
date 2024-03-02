const {MessageEmbed} = require('discord.js');
const {jsonParse, jsonSave, translate, ambrApi, getUserSettings} = require('../util');
const {GenshinImpact} = require('@vermaysha/hoyolab-api');
const axios = require('axios')
const C = require('canvas');
const fs = require('fs');
const {registerFont, loadImage} = require('canvas');

const name = 'spiral';
const description = translate('Creates an image with a user\'s most recent Spiral Abyss Lunar phase.');
const filter = () => true;
const options = [
    {
        type: 3, //str
        name: translate('spiralshowcase'),
        description: translate('The Spiral Abyss Rotation Phase.'),
        required: true,
        choices: [
            {
                name: 'Current',
                value: 'current'
            },
            {
                name: 'Pervious',
                value: 'previous'
            }]
    },
    {
        type: 4, //str
        name: translate('floor'),
        description: translate('The Spiral Abyss Floor.'),
        required: true,
        choices: [
            {
                name: 'Floor 9',
                value: 1
            },
            {
                name: 'Floor 10',
                value: 2
            },
            {
                name: 'Floor 11',
                value: 3
            },
            {
                name: 'Floor 12',
                value: 4
            }]
    },
    {
        type: 6, //str
        name: translate('user'),
        description: translate('The user\'s Spiral Abyss to look at.'),
        required: false
    },
    {
        type: 4, //str
        name: translate('account'),
        description: translate('The account entry.'),
        required: false
    }
    ];

async function execute(interaction) {
    const {data} = await axios.get('https://discord.com/api/v8/applications/' + interaction.client.user.id + '/commands', {headers: {Authorization: 'Bot ' + interaction.client.token}})

    let user
    if (interaction.options.getUser('user')) user = interaction.options.getUser('user').id

    let usern
    if (interaction.options.getUser('user')) usern = interaction.options.getUser('user').username

    let user2 = interaction.user.id
    let user2n = interaction.user.username

    let acc
    if (interaction.options.getInteger('account')) acc = interaction.options.getInteger('account')

    let sfloor
    if (interaction.options.getInteger('floor')) sfloor = interaction.options.getInteger('floor')

    let phase = interaction.options.getString('spiralshowcase')

    const hoYo = jsonParse('./data/hoYo.json', {})

    if (!hoYo[interaction.user.id] && !user) {
        return interaction.editReply({
            embeds: [new MessageEmbed().setDescription('You are not in the database! Use '
                + '</' + data.find(cmd => cmd.name === 'dailies').name + ':' + data.find(cmd => cmd.name === 'dailies').id + '> to link your hoYoLab Account with the bot!')]
        })
    }

    if (user && !hoYo[user]) {
        return interaction.editReply({
            embeds: [new MessageEmbed().setDescription('<@' + user + '> is not in the database!' + ' <@' + user + '> should use '
                + '</' + data.find(cmd => cmd.name === 'dailies').name + ':' + data.find(cmd => cmd.name === 'dailies').id + '> to link your hoYoLab Account with the bot!')]
        })
    }

    const c = C.createCanvas(2800, 1550);
    const ctx = c.getContext('2d');
    registerFont('./data/fonts/zh-cn2.ttf', {
        family: 'SDK_SC_Web Heavy'
    });
    registerFont('./data/fonts/Burbank Big Regular Black.ttf', {
        family: 'Burbank'
    })

    var length = Math.sqrt(c.width ** 2 + c.height ** 2), angle = 45
    var grd = ctx.createLinearGradient(0, 0, Math.cos(angle) * length, Math.sin(angle) * length);
    var grd2 = ctx.createLinearGradient(0, 0, 0, c.height);
    const userClr = getUserSettings(user || user2).color || 770025;
    const userClrHex = userClr.toString(16);

    function hexToHSL(H) {
        // Convert hex to RGB first
        let r = 0, g = 0, b = 0;
        if (H.length == 4) {
            r = "0x" + H[1] + H[1];
            g = "0x" + H[2] + H[2];
            b = "0x" + H[3] + H[3];
        } else if (H.length == 7) {
            r = "0x" + H[1] + H[2];
            g = "0x" + H[3] + H[4];
            b = "0x" + H[5] + H[6];
        }
        // Then to HSL
        r /= 255;
        g /= 255;
        b /= 255;
        let cmin = Math.min(r, g, b),
            cmax = Math.max(r, g, b),
            delta = cmax - cmin,
            h = 0,
            s = 0,
            l = 0;

        if (delta == 0)
            h = 0;
        else if (cmax == r)
            h = ((g - b) / delta) % 6;
        else if (cmax == g)
            h = (b - r) / delta + 2;
        else
            h = (r - g) / delta + 4;

        h = Math.round(h * 60);

        if (h < 0)
            h += 360;

        l = (cmax + cmin) / 2;
        s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
        s = +(s * 100).toFixed(1);
        l = +(l * 100).toFixed(1);

        return [h, s, l];
    }

    function HSLToHex(h, s, l) {
        s /= 100;
        l /= 100;

        let c = (1 - Math.abs(2 * l - 1)) * s,
            x = c * (1 - Math.abs((h / 60) % 2 - 1)),
            m = l - c / 2,
            r = 0,
            g = 0,
            b = 0;

        if (0 <= h && h < 60) {
            r = c;
            g = x;
            b = 0;
        } else if (60 <= h && h < 120) {
            r = x;
            g = c;
            b = 0;
        } else if (120 <= h && h < 180) {
            r = 0;
            g = c;
            b = x;
        } else if (180 <= h && h < 240) {
            r = 0;
            g = x;
            b = c;
        } else if (240 <= h && h < 300) {
            r = x;
            g = 0;
            b = c;
        } else if (300 <= h && h < 360) {
            r = c;
            g = 0;
            b = x;
        }
        // Having obtained RGB, convert channels to hex
        r = Math.round((r + m) * 255).toString(16);
        g = Math.round((g + m) * 255).toString(16);
        b = Math.round((b + m) * 255).toString(16);

        // Prepend 0s, if necessary
        if (r.length == 1)
            r = "0" + r;
        if (g.length == 1)
            g = "0" + g;
        if (b.length == 1)
            b = "0" + b;

        return "#" + r + g + b;
    }

    const hsl = hexToHSL('#' + ('0'.repeat(6 - userClrHex.length)) + userClrHex);
    const low = HSLToHex(hsl[0], hsl[1], Math.max(0, hsl[2] - 8));
    const high = HSLToHex(hsl[0], hsl[1], Math.min(100, hsl[2] + 25));
    const mid = HSLToHex(hsl[0], hsl[1], Math.min(100, hsl[2] + 40));

    ctx.globalAlpha = 0.5
    // Gradient
    grd.addColorStop(0, high)
    // grd.addColorStop(0.4, mid)
    grd.addColorStop(0.4, '#4bffce')
    grd.addColorStop(0.9, '#' + ('0'.repeat(6 - userClrHex.length)) + userClrHex);
    grd.addColorStop(1, low);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    ctx.beginPath()
    ctx.fillStyle = 'rgba(0, 0, 0, .35)'
    ctx.fillRect(0, 0, c.width, c.height)

    ctx.globalAlpha = 1

    ctx.globalCompositeOperation = 'soft-light'
    await loadImage(fs.readFileSync('./data/profilegen/UI_DungeonPic_Tower_2_1.png'))
        .then((img) => {
            ctx.drawImage(img, c.width / 2 - img.width * 2.1 / 2, c.height / 2 - img.height * 2.1 / 2, img.width * 2.1, img.height * 2.1)
        })
    ctx.globalCompositeOperation = 'source-over'


    const bg = {
        5: 'SSR',
        4: 'SR'
    }


    const hoyoUser = new GenshinImpact({
        uid: hoYo?.[(user ?? user2)]?.[(acc || 0)]?.uid,
        cookie: hoYo?.[(user ?? user2)]?.[(acc || 0)]?.cookie
    })

    const filt = {
        current: false,
        previous: true
    }

    const spiral = await hoyoUser.getSpiralAbyss(filt[phase])
    const hacc = await hoyoUser.getAccounts()
    const r = hacc?.role?.region

    const chars = await hoyoUser.getCharacters()
    const hx = chars.avatars
    const trel = hx.filter(b => [10000005, 10000007].includes(b.id))?.[0]?.element

    const convel = {
        Electro: 'Electric',
        Pyro : 'Fire',
        Dendro: 'Grass',
        Cryo: 'Ice',
        Geo: 'Rock',
        Hydro: 'Water',
        Anemo : 'Wind'
    }


    const region = {
        os_euro: 'Europe',
        os_asia: 'Asia',
        os_usa: 'America',
        os_cht: 'TW HK MO'
    }
    const ha = {
        1: 9,
        2: 10,
        3: 11,
        4: 12
    }

    ctx.textBaseline = 'top'
    ctx.textAlign = 'center'
    ctx.font = '150px SDK_SC_Web Heavy, Burbank Big Regular, Wingdings, Open Sans, sans-serif, segoe-ui-emoji'
    const s = ctx.measureText(translate('Spiral Abyss Floor {0}', interaction.locale).replace('{0}', ha[sfloor] ))
    const ds = 100
    ctx.beginPath();
    ctx.roundRect(c.width / 2 - s.width / 2 - ds / 2, 52.5, s.width + ds, s.emHeightDescent + 10 , 25)
    ctx.fillStyle = "rgba(0,0,0, .35)"
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(translate('Spiral Abyss Floor {0}', interaction.locale).replace('{0}', ha[sfloor] ), c.width / 2 , 55)

    async function cover(id, level, x, y, icon, iten, element, rarity, cons) {
        const cE = jsonParse('./data/emojis/charEmote.json', {})
        const icon2 = 'https://raw.githubusercontent.com/FortOfFans/GI/main/emotes/UI_EmotionIcon' + cE[id] + '.png'
        ctx.globalAlpha = 1;
        if (id === 10000062) {
            const img1 = await loadImage((fs.readFileSync('./data/profilegen/AR.png')))
            ctx.shadowColor = "rgba(0,0,0,.35)";
            ctx.shadowBlur = 10;
            ctx.drawImage(img1, 0, 0, img1.width, img1.height, 0 + x, 0 + y, img1.width, img1.height);
        }
        else {
            const img1 = await loadImage((fs.readFileSync('./data/profilegen/' + bg[rarity] + '.png')))
            ctx.shadowColor = "rgba(0,0,0,.35)";
            ctx.shadowBlur = 10;
            ctx.drawImage(img1, 0, 0, img1.width, img1.height, 0 + x, 0 + y, img1.width, img1.height);
        }

        let gicon = jsonParse('./data/emojis/sticker.json', {})

        let zicon = 'https://raw.githubusercontent.com/FortOfFans/GI/main/emotes/UI_EmotionIcon' + cE[id[0]]  + '.png'

        let micon = icon[0]

        ctx.shadowBlur = 0;
        if (gicon[id[0]]) {
            await loadImage(gicon[id[0]])
                .then((img) => {
                    ctx.drawImage(img, 0, 0, img.width, img.height, 0 + x, 0 + y, 240, 240);
                })
        } else if (cE[id[0]]) {
            await loadImage(zicon)
                .then((img) => {
                    ctx.drawImage(img, 0, 0, img.width, img.height, 0 + x, 0 + y, 240, 240);
                })
        } else {
            await loadImage(micon)
                .then((img) => {
                    ctx.drawImage(img, 0, 0, img.width, img.height, 0 + x, 0 + y, 240, 240);
                })
        }

        const img3 = await loadImage((fs.readFileSync('./data/profilegen/Nameplate.png')))
        ctx.drawImage(img3, 0, 0, img3.width, img3.height, 0 + x, 185 + y, img3.width, img3.height);
        const img4 = await loadImage('https://api.ambr.top/assets/UI/UI_Buff_Element_' + (element || convel[trel]) + '.png')
        ctx.drawImage(img4, 0, 0, img4.width, img4.height, 5 + x, 5 + y, img4.width * .7, img4.height * .7)

        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.font = '20px SDK_SC_Web Heavy, Wingdings, Open Sans, sans-serif, segoe-ui-emoji'


        ctx.fillStyle = '#77583b';
        ctx.fillText((iten || 'Traveler'), 121 + x, 275 + y)
    }

    let k = 0
    let y = 200
    if (!user && !spiral?.floors?.[(sfloor - 1 ?? 3)]) return await interaction.editReply("You haven't progressed this far in the current lunar phase yet!")
    if (user && !spiral?.floors?.[(sfloor - 1 ?? 3)]) return await interaction.editReply("**" + usern +"** hasn't progressed this far in the current lunar phase yet!")
    for (let i = 0; i < Object.entries(spiral?.floors?.[(sfloor - 1 ?? 3)]?.levels).length; i++) {
        let x = 50;
        for (let j = 0; j < Object.entries(spiral?.floors?.[(sfloor - 1 ?? 3)]?.levels[k]?.battles).length; j++) {
            for (let z = 0; z < Object.entries(spiral?.floors?.[(sfloor - 1 ?? 3)]?.levels[k]?.battles[j]?.avatars).length; z++) {
                const sacid = Object.entries(spiral?.floors?.[(sfloor - 1 ?? 3)]?.levels[k]?.battles[j]?.avatars[z]).filter(i => i.includes('id')).map(([a, b]) => b)
                const saclv = Object.entries(spiral?.floors?.[(sfloor - 1 ?? 3)]?.levels[k]?.battles[j]?.avatars[z]).filter(i => i.includes('level')).map(([a, b]) => b)
                const sacicon = Object.entries(spiral?.floors?.[(sfloor - 1 ?? 3)]?.levels[k]?.battles[j]?.avatars[z]).filter(i => i.includes('icon')).map(([a, b]) => b)
                const {name: iten, icon, rank, element: ifo} = await ambrApi('/avatar/' + sacid, interaction.locale);
                await cover(sacid, saclv, 50 + x, 100 + y, sacicon, (iten || 'Traveler'), ifo, rank)
                x += 250
            }
            if (Object.entries(spiral?.floors?.[(sfloor - 1 ?? 3)]?.levels[k]?.battles[j]?.avatars).length === 1) {x += 750}
            if (Object.entries(spiral?.floors?.[(sfloor - 1 ?? 3)]?.levels[k]?.battles[j]?.avatars).length === 2) {x += 500}
            if (Object.entries(spiral?.floors?.[(sfloor - 1 ?? 3)]?.levels[k]?.battles[j]?.avatars).length === 3) {x += 250}
            x += 600

        }
        ctx.shadowBlur = 10
        ctx.shadowColor = 'rgba(0, 0, 0, 0.35)'
        let x2 = 0
        for (let w = 0; w < Object.entries(spiral?.floors?.[(sfloor - 1 ?? 3)]?.levels[k]).filter(i => i.includes('star')).map(([a, b]) => b); w++) {
            await loadImage(fs.readFileSync('./data/profilegen/UI_Tower_Star.png'))
                .then((img) => {
                    ctx.drawImage(img, 1225 + x2, 200 + y, img.width * 2, img.height * 2)
                })
        x2 += 120
        }
        ctx.globalAlpha = 0.65
        for (let w = 0; w < Object.entries(spiral?.floors?.[(sfloor - 1 ?? 3)]?.levels[k]).filter(i => i.includes('max_star')).map(([a, b]) => b) - Object.entries(spiral?.floors?.[(sfloor - 1 ?? 3)]?.levels[k]).filter(i => i.includes('star')).map(([a, b]) => b); w++) {
            await loadImage(fs.readFileSync('./data/profilegen/UI_Tower_Star_Dark.png'))
                .then((img) => {
                    ctx.drawImage(img, 1225 + x2, 200 + y, img.width * 2, img.height * 2)
                })
            x2 += 120
        }
        ctx.shadowBlur = 0

        y += 400
        k++
    }
    ctx.globalAlpha = 1
    const b = await loadImage(fs.readFileSync('./data/conste/Bording.png'))

    ctx.shadowBlur = 5
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'

    //corners
    ctx.drawImage(b, 0, 0, b.width / 5, b.height / 3, 0, 0, b.width / 5, b.height / 3) // top left
    ctx.drawImage(b, 4 * b.width / 5, 0, b.width / 5, b.height / 3, c.width - b.width / 5, 0, b.width / 5, b.width / 3) // top right
    ctx.drawImage(b, 0, 2 * b.height / 3,  b.width / 5, b.height / 3, 0, c.height - b.height / 3, b.width / 5, b.width / 3) // bottom
    ctx.drawImage(b, 4 * b.width / 5, 2 * b.height / 3,   b.width / 5, b.height / 3, c.width - b.width / 5, c.height - b.height / 3, b.width / 5, b.width / 3) // bottom

    //middle
    ctx.drawImage(b,2 * b.width / 5, 0, b.width / 5, b.height / 3, c.width / 2 - b.width / 10, 0, b.width / 5, b.height / 3)
    ctx.drawImage(b,2 * b.width / 5, 2 * b.height / 3, b.width / 5, b.height / 3, c.width / 2 - b.width / 10, c.height - b.height / 3, b.width / 5, b.height / 3)

    for (let x = b.width / 5; x < c.width / 2 - b.width / 7; x += b.width / 5){
        ctx.drawImage(b, b.width / 5, 0, b.width / 5, b.height / 3, x, 0, b.width / 5, b.height / 3);
        ctx.drawImage(b, b.width / 5, 0, b.width / 5, b.height / 3, c.width / 2 + x - b.width / 10, 0, b.width / 5, b.height / 3);

        ctx.drawImage(b, b.width / 5, b.height / 3 * 2, b.width / 5, b.height / 3, x, c.height - b.height / 3, b.width / 5, b.height / 3);
        ctx.drawImage(b, b.width / 5, b.height / 3 * 2, b.width / 5, b.height / 3, c.width / 2 + x - b.width / 10, c.height - b.height / 3, b.width / 5, b.width / 3);
    }

    for (let y = b.height / 3; y < c.height - b.height / 3; y += b.height / 3){
        ctx.drawImage(b,
            0, b.height / 3, b.width / 5, b.height / 3,
            0, y, b.width / 5, b.height / 3);
        ctx.drawImage(b,
            b.width / 5 * 4, b.height / 3, b.width / 5, b.height / 3,
            c.width - b.width / 5, y, b.width / 5, b.height / 3);
    }
    ctx.shadowBlur = 5

    const d = new Date()
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    ctx.font = '30px BurbankBigCondensed-Black, SDK_SC_Web Heavy, Wingdings, Open Sans, sans-serif, segoe-ui-emoji'
    ctx.textAlign = 'right'
    ctx.fillStyle = 'rgba(225, 225, 225, 1)'
    ctx.fillText(d.getDate() + '. ' + months[d.getMonth()] + ' ' +  d.getFullYear(), c.width - 105, c.height - 70)

    ctx.font = '30px BurbankBigCondensed-Black, SDK_SC_Web Heavy, Wingdings, Open Sans, sans-serif, segoe-ui-emoji'
    ctx.textAlign = 'left'
    ctx.fillStyle = 'rgba(225, 225, 225, 1)'
    function nam(text) {
        return text
            ?.replace(/ㅤ/gi, '  ')
            ?.replace(/୧/g, '')
            ?.replace(/я/g, '')
            ?.replace(/ᴚ/g, '')
            ?.replace("\\p{Zs}+", " ")
            ?.replace("\\h+", " ")
            ?.replace("(?U)\\s+", " ")
            ?.replace(/\s/g, ' ');
    }
    ctx.fillText(nam(hacc?.role?.nickname) + ' - ' + region[r] + ' ' + translate('Server', interaction.locale), 105, c.height - 70)

    await loadImage(fs.readFileSync('./data/profilegen/Logo.png'))
        .then((img) => {
            ctx.drawImage(img, c.width / 2 - img.width / 2, c.height - 1380, img.width, img.height)
        })

    const buffer = c.toBuffer('image/jpeg', {quality: 1})


    await interaction.editReply({
            content: translate("{0}'s Spiral Abyss", interaction.locale).replace('{0}', (hacc?.role?.nickname || usern || user2n)),
            files: [{name: 'card.jpg', attachment: buffer}]}
    );
}

module.exports = {name, description, options, filter, execute};