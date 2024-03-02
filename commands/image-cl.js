const {MessageEmbed} = require('discord.js');
const {getUserSettings, jsonParse, jsonSave, translate, ambrApi} = require('../util');
const {GenshinImpact} = require('@vermaysha/hoyolab-api');
const axios = require('axios')
const C = require('canvas');
const fs = require('fs');
const {registerFont, loadImage} = require('canvas');

const name = 'characterlist';
const description = translate('Creates an image with a user\'s characters');
const filter = () => true;
const options = [
    {
        type: 3, //str
        name: translate('format'),
        description: translate('The user\'s character to look at.'),
        required: false,
        choices : [
            {
                name: 'Portrait mode',
                value: 'port'
            },
            {
                name: 'Landscape mode',
                value: 'land'
            }
        ]
    },
    {
        type: 6, //str
        name: translate('user'),
        description: translate('The user\'s character to look at.'),
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

    let user2 = interaction.user.id

    let acc
    if (interaction.options.getInteger('account')) acc = interaction.options.getInteger('account')

    const form = interaction.options.getString('format') ?? 'land'

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

    const emojiMap = jsonParse('./data/emojis/characterIdEmojis.json', {});
    const hoyoUser = new GenshinImpact({
        uid: hoYo?.[(user ?? user2)]?.[(acc || 0)]?.uid,
        cookie: hoYo?.[(user ?? user2)]?.[(acc || 0)]?.cookie
    })

    const chars = await hoyoUser.getCharacters()
    const hacc = await hoyoUser.getAccounts()
    const r = hoYo?.[(user ?? user2)]?.[(acc || 0)]?.uid

    function region(text)  {
        if (text?.startsWith('6', 0)) return 'America';

        else if (text?.startsWith('7', 0)) return 'Europe'

        else if (text?.startsWith('8', 0)) return 'Asia'

        else if (text?.startsWith('9', 0)) return 'TW HK MO'
        else return 'No detected'
    }

    function cT(text) {
        return text
            .replace(/ㅤ/gi, '')
            .replace(/୧/g, '')
            .replace("\\p{Zs}+", "")
            .replace("\\h+", " ")
            .replace("(?U)\\s+", "")
            .replace(/\s/g, '')
    }


    const displayChars = chars.avatars.filter(c => ![10000005, 10000007].includes(c?.id))

    if (form === 'land') {
        const charAmt = displayChars.length - 1;
        const columns = Math.ceil(Math.min(9, Math.sqrt(charAmt)));
        const rows = Math.ceil(charAmt / columns);

        const c = C.createCanvas(columns * 300 + 50, rows * 350 + 140 + 250 + 20);
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

        const bg = {
            5: 'SSR',
            4: 'SR'
        }

        async function cover(id, level, x, y, icon, iten, element, rarity, cons) {
            const cE = jsonParse('./data/emojis/charEmote.json', {})
            const icon2 = 'https://raw.githubusercontent.com/FortOfFans/GI/main/emotes/UI_EmotionIcon' + cE[id] + '.png'
            ctx.globalAlpha = 1;
            if (id === 10000062) {
                const img1 = await loadImage((fs.readFileSync('./data/profilegen/AR.png')))
                ctx.shadowColor = "rgba(0,0,0,.35)";
                ctx.shadowBlur = 10;
                ctx.drawImage(img1, 0, 0, img1.width, img1.height, 0 + x, 0 + y, img1.width, img1.height);
            } else {
                const img1 = await loadImage((fs.readFileSync('./data/profilegen/' + bg[rarity] + '.png')))
                ctx.shadowColor = "rgba(0,0,0,.35)";
                ctx.shadowBlur = 10;
                ctx.drawImage(img1, 0, 0, img1.width, img1.height, 0 + x, 0 + y, img1.width, img1.height);
            }

            let gicon = jsonParse('./data/emojis/sticker.json', {})

            let zicon = 'https://raw.githubusercontent.com/FortOfFans/GI/main/emotes/UI_EmotionIcon' + cE[id]  + '.png'

            let micon = icon

            ctx.shadowBlur = 0;
            if (gicon[id]) {
                await loadImage(gicon[id])
                    .then((img) => {
                        ctx.drawImage(img, 0, 0, img.width, img.height, 0 + x, 0 + y, 240, 240);
                    })
            } else if (cE[id]) {
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
            const img4 = await loadImage('https://api.ambr.top/assets/UI/UI_Buff_Element_' + element + '.png')
            ctx.drawImage(img4, 0, 0, img4.width, img4.height, 5 + x, 5 + y, img4.width * .7, img4.height * .7)

            ctx.strokeStyle = "rbg(255, 0, 0)";
            ctx.beginPath();
            ctx.roundRect(195 + x, 10 + y, 40, 40, 5)
            ctx.fillStyle = "rgba(0,0,0, .35)"
            ctx.fill();
            ctx.beginPath();

            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            if ((iten.length) > 17) {
                ctx.font = '14px HYWenHei 85W, SDK_SC_Web Heavy, Wingdings, Open Sans, sans-serif, segoe-ui-emoji'
            } else if (iten.length > 12) {
                ctx.font = '16px HYWenHei 85W, SDK_SC_Web Heavy, Wingdings, Open Sans, sans-serif, segoe-ui-emoji'
            } else {
                ctx.font = '20px HYWenHei 85W, SDK_SC_Web Heavy, Wingdings, Open Sans, sans-serif, segoe-ui-emoji'
            }

            ctx.fillStyle = '#77583b';
            ctx.fillText('Lv. ' + level + ' - ' + iten, 121 + x, 275 + y)
            ctx.font = '30px HYWenHei 85W, SDK_SC_Web Heavy, Wingdings, Open Sans, sans-serif, segoe-ui-emoji'
            ctx.fillStyle = 'rgba(225,225,225,1)';
            ctx.fillText(cons ?? 0, 216 + x, 50 + y)
        }

        if (displayChars) {
            let k = 0;
            let y = 0;
            for (let i = 0; i < rows; i++) {
                let x = 0;
                for (let j = 0; j < columns; j++) {
                    if (!/^10{6}[57]$/.test(displayChars[k]?.id.toString())) {
                        if (!displayChars[k]?.id) break
                        const sid = displayChars[k]?.id
                        const cl = displayChars[k]?.level
                        const constellation = displayChars[k]?.actived_constellation_num ?? '0'
                        const {
                            name: iten,
                            icon,
                            rank,
                            element: ifo
                        } = await ambrApi('/avatar/' + sid, interaction.locale.replace('ja', 'en-GB'));
                        await cover(sid, cl, 50 + x, 310 + y, displayChars[k++]?.icon, (iten || 'Traveler'), ifo, rank, constellation)
                        x += 300
                    } else {
                        k++
                    }
                }
                y += 350
            }
        } else {
            return await interaction.editReply('Profile has no characters listed')
        }
        await loadImage(fs.readFileSync('./data/profilegen/Logo_new.png'))
            .then((img) => {
                ctx.drawImage(img, c.width / 2 - img.width / 2, c.height - 1380, img.width, img.height)
            })
        ctx.textBaseline = 'top'
        ctx.textAlign = 'center'
        ctx.font = '175px SDK_SC_Web Heavy, Burbank Big Regular, Wingdings, Open Sans, sans-serif, segoe-ui-emoji'
        const s = ctx.measureText(translate('List of {0} Characters', interaction.locale).replace('{0}', displayChars.length))
        const ds = 80
        ctx.beginPath();
        ctx.roundRect(c.width / 2 - s.width / 2 - ds / 2, 50, s.width + ds, s.emHeightDescent + -10, 25)
        ctx.fillStyle = "rgba(0,0,0, .25)"
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillText(translate('List of {0} Characters', interaction.locale).replace('{0}', displayChars.length), c.width / 2, 55, c.width - 100)

        const b = await loadImage(fs.readFileSync('./data/conste/Bording.png'))

        ctx.shadowBlur = 2
        ctx.shadowColor = 'rgba(0, 0, 0, 0.15)'

        //corners
        ctx.drawImage(b, 0, 0, b.width / 5, b.height / 3, 0, 0, b.width / 5, b.height / 3) // top left
        ctx.drawImage(b, 4 * b.width / 5, 0, b.width / 5, b.height / 3, c.width - b.width / 5, 0, b.width / 5, b.width / 3) // top right
        ctx.drawImage(b, 0, 2 * b.height / 3, b.width / 5, b.height / 3, 0, c.height - b.height / 3, b.width / 5, b.width / 3) // bottom left
        ctx.drawImage(b, 4 * b.width / 5, 2 * b.height / 3, b.width / 5, b.height / 3, c.width - b.width / 5, c.height - b.height / 3, b.width / 5, b.width / 3) // bottom right

        //middle
        ctx.drawImage(b, 2 * b.width / 5, 0, b.width / 5, b.height / 3, c.width / 2 - b.width / 10, 0, b.width / 5, b.height / 3)
        ctx.drawImage(b, 2 * b.width / 5, 2 * b.height / 3, b.width / 5, b.height / 3, c.width / 2 - b.width / 10, c.height - b.height / 3, b.width / 5, b.height / 3)

        ctx.drawImage(b, b.width / 5, 0, b.width / 5, b.height / 3, c.width / 2 - b.width / 5 - b.width / 10, 0, b.width / 5, b.height / 3);
        ctx.drawImage(b, b.width / 5, b.height / 3 * 2, b.width / 5, b.height / 3, c.width / 2 - b.width / 5 - b.width / 10, c.height - b.height / 3, b.width / 5, b.height / 3);

        ctx.drawImage(b, b.width / 5, 0, b.width / 5, b.height / 3, c.width - b.width / 5 * 2, 0, b.width / 5, b.height / 3);
        ctx.drawImage(b, b.width / 5, b.height / 3 * 2, b.width / 5, b.height / 3, c.width - b.width / 5 * 2, c.height - b.height / 3, b.width / 5, b.height / 3);

        for (let x = b.width / 5; x <= c.width / 2 - b.width / 5; x += b.width / 5) {
            ctx.drawImage(b,
                b.width / 5, 0, b.width / 5, b.height / 3,
                x, 0, b.width / 5, b.height / 3);
            ctx.drawImage(b,
                b.width / 5, 0, b.width / 5, b.height / 3,
                c.width / 2 + x - b.width / 10, 0, b.width / 5, b.height / 3);

            ctx.drawImage(b,
                b.width / 5, b.height / 3 * 2, b.width / 5, b.height / 3,
                x, c.height - b.height / 3, b.width / 5, b.height / 3);
            ctx.drawImage(b,
                b.width / 5, b.height / 3 * 2, b.width / 5, b.height / 3,
                c.width / 2 + x - b.width / 10, c.height - b.height / 3, b.width / 5, b.width / 3);
        }

        for (let y = b.height / 3; y < c.height - b.height / 3; y += b.height / 3) {
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
        ctx.fillStyle = 'rgba(225, 225, 225, .8)'
        ctx.fillText(d.getDate() + '. ' + months[d.getMonth()] + ' ' + d.getFullYear(), c.width - 90, c.height - 110)

        ctx.font = '30px BurbankBigCondensed-Black, SDK_SC_Web Heavy, Wingdings, Open Sans, sans-serif, segoe-ui-emoji'
        ctx.textAlign = 'left'
        ctx.fillStyle = 'rgba(225, 225, 225, 1)'
        ctx.fillText(cT(hacc?.role?.nickname) + ' - ' + region(r) + ' ' + translate('Server', interaction.locale), 90, c.height - 110)


        const buffer = c.toBuffer('image/jpeg', {quality: 1})


        await interaction.editReply({
                content: translate("{0}'s Character List", interaction.locale).replace('{0}', chars?.role?.nickname) +
                    '\nIf you want to change the background color use: '  + '</' + data.find(cmd => cmd.name === 'colour').name + ':' + data.find(cmd => cmd.name === 'colour').id + '>',
                files: [{name: 'card.jpg', attachment: buffer}]
            }
        )
    }
    else {
        const charAmt = displayChars.length - 1;
        const columns = Math.ceil(Math.min(7, Math.sqrt(charAmt)));
        const rows = Math.ceil(charAmt / columns);

        const c = C.createCanvas(columns * 300 + 50, rows * 350 + 140 + 250 + 20);
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

        const bg = {
            5: 'SSR',
            4: 'SR'
        }

        async function cover(id, level, x, y, icon, iten, element, rarity, cons) {
            const cE = jsonParse('./data/emojis/charEmote.json', {})
            const icon2 = 'https://raw.githubusercontent.com/FortOfFans/GI/main/emotes/UI_EmotionIcon' + cE[id] + '.png'
            ctx.globalAlpha = 1;
            if (id === 10000062) {
                const img1 = await loadImage((fs.readFileSync('./data/profilegen/AR.png')))
                ctx.shadowColor = "rgba(0,0,0,.35)";
                ctx.shadowBlur = 10;
                ctx.drawImage(img1, 0, 0, img1.width, img1.height, 0 + x, 0 + y, img1.width, img1.height);
            } else {
                const img1 = await loadImage((fs.readFileSync('./data/profilegen/' + bg[rarity] + '.png')))
                ctx.shadowColor = "rgba(0,0,0,.35)";
                ctx.shadowBlur = 10;
                ctx.drawImage(img1, 0, 0, img1.width, img1.height, 0 + x, 0 + y, img1.width, img1.height);
            }
            let gicon = jsonParse('./data/emojis/sticker.json', {})

            let zicon = 'https://raw.githubusercontent.com/FortOfFans/GI/main/emotes/UI_EmotionIcon' + cE[id]  + '.png'

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
            const img4 = await loadImage('https://api.ambr.top/assets/UI/UI_Buff_Element_' + element + '.png')
            ctx.drawImage(img4, 0, 0, img4.width, img4.height, 5 + x, 5 + y, img4.width * .7, img4.height * .7)

            ctx.strokeStyle = "rbg(255, 0, 0)";
            ctx.beginPath();
            ctx.roundRect(195 + x, 10 + y, 40, 40, 5)
            ctx.fillStyle = "rgba(0,0,0, .35)"
            ctx.fill();
            ctx.beginPath();

            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            if ((iten.length) > 17) {
                ctx.font = '14px HYWenHei 85W, SDK_SC_Web Heavy, Wingdings, Open Sans, sans-serif, segoe-ui-emoji'
            } else if (iten.length > 12) {
                ctx.font = '16px HYWenHei 85W, SDK_SC_Web Heavy, Wingdings, Open Sans, sans-serif, segoe-ui-emoji'
            } else {
                ctx.font = '20px HYWenHei 85W, SDK_SC_Web Heavy, Wingdings, Open Sans, sans-serif, segoe-ui-emoji'
            }

            ctx.fillStyle = '#77583b';
            ctx.fillText('Lv. ' + level + ' - ' + iten, 121 + x, 275 + y)
            ctx.font = '30px HYWenHei 85W, SDK_SC_Web Heavy, Wingdings, Open Sans, sans-serif, segoe-ui-emoji'
            ctx.fillStyle = 'rgba(225,225,225,1)';
            ctx.fillText(cons ?? 0, 216 + x, 50 + y)
        }

        if (displayChars) {
            let k = 0;
            let y = 0;
            for (let i = 0; i < rows; i++) {
                let x = 0;
                for (let j = 0; j < columns; j++) {
                    if (!/^10{6}[57]$/.test(displayChars[k]?.id.toString())) {
                        if (!displayChars[k]?.id) break
                        const sid = displayChars[k]?.id
                        const cl = displayChars[k]?.level
                        const constellation = displayChars[k]?.actived_constellation_num ?? '0'
                        const {
                            name: iten,
                            icon,
                            rank,
                            element: ifo
                        } = await ambrApi('/avatar/' + sid, interaction.locale.replace('ja', 'en-GB'));
                        await cover(sid, cl, 50 + x, 310 + y, displayChars[k++]?.icon, (iten || 'Traveler'), ifo, rank, constellation)
                        x += 300
                    } else {
                        k++
                    }
                }
                y += 350
            }
        } else {
            return await interaction.editReply('Profile has no characters listed')
        }
        await loadImage(fs.readFileSync('./data/profilegen/Credits.png'))
            .then((img) => {
                ctx.drawImage(img, c.width / 2 -(img.width* .7 / 2), c.height - 110, img.width * .7, img.height * .7)
            })
        ctx.textBaseline = 'top'
        ctx.textAlign = 'center'
        ctx.font = '100px SDK_SC_Web Heavy, Burbank Big Regular, Wingdings, Open Sans, sans-serif, segoe-ui-emoji'
        const s = ctx.measureText(translate('List of {0} Characters', interaction.locale).replace('{0}', displayChars.length))
        const ds = 20
        ctx.beginPath();
        ctx.roundRect(c.width / 2 - s.width / 2 - ds / 2, 100, s.width + ds, s.emHeightDescent , 25)
        ctx.fillStyle = "rgba(0,0,0, .25)"
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillText(translate('List of {0} Characters', interaction.locale).replace('{0}', displayChars.length), c.width / 2, 105, c.width - 100)

        const b = await loadImage(fs.readFileSync('./data/conste/Bording.png'))

        ctx.shadowBlur = 2
        ctx.shadowColor = 'rgba(0, 0, 0, 0.15)'

        //corners
        ctx.drawImage(b, 0, 0, b.width / 5, b.height / 3, 0, 0, b.width / 5, b.height / 3) // top left
        ctx.drawImage(b, 4 * b.width / 5, 0, b.width / 5, b.height / 3, c.width - b.width / 5, 0, b.width / 5, b.width / 3) // top right
        ctx.drawImage(b, 0, 2 * b.height / 3, b.width / 5, b.height / 3, 0, c.height - b.height / 3, b.width / 5, b.width / 3) // bottom left
        ctx.drawImage(b, 4 * b.width / 5, 2 * b.height / 3, b.width / 5, b.height / 3, c.width - b.width / 5, c.height - b.height / 3, b.width / 5, b.width / 3) // bottom right

        //middle
        ctx.drawImage(b, 2 * b.width / 5, 0, b.width / 5, b.height / 3, c.width / 2 - b.width / 10, 0, b.width / 5, b.height / 3)
        ctx.drawImage(b, 2 * b.width / 5, 2 * b.height / 3, b.width / 5, b.height / 3, c.width / 2 - b.width / 10, c.height - b.height / 3, b.width / 5, b.height / 3)

        ctx.drawImage(b, b.width / 5, 0, b.width / 5, b.height / 3, c.width / 2 - b.width / 5 - b.width / 10, 0, b.width / 5, b.height / 3);
        ctx.drawImage(b, b.width / 5, b.height / 3 * 2, b.width / 5, b.height / 3, c.width / 2 - b.width / 5 - b.width / 10, c.height - b.height / 3, b.width / 5, b.height / 3);

        ctx.drawImage(b, b.width / 5, 0, b.width / 5, b.height / 3, c.width - b.width / 5 * 2, 0, b.width / 5, b.height / 3);
        ctx.drawImage(b, b.width / 5, b.height / 3 * 2, b.width / 5, b.height / 3, c.width - b.width / 5 * 2, c.height - b.height / 3, b.width / 5, b.height / 3);

        for (let x = b.width / 5; x <= c.width / 2 - b.width / 5; x += b.width / 5) {
            ctx.drawImage(b,
                b.width / 5, 0, b.width / 5, b.height / 3,
                x, 0, b.width / 5, b.height / 3);
            ctx.drawImage(b,
                b.width / 5, 0, b.width / 5, b.height / 3,
                c.width / 2 + x - b.width / 10, 0, b.width / 5, b.height / 3);

            ctx.drawImage(b,
                b.width / 5, b.height / 3 * 2, b.width / 5, b.height / 3,
                x, c.height - b.height / 3, b.width / 5, b.height / 3);
            ctx.drawImage(b,
                b.width / 5, b.height / 3 * 2, b.width / 5, b.height / 3,
                c.width / 2 + x - b.width / 10, c.height - b.height / 3, b.width / 5, b.width / 3);
        }

        for (let y = b.height / 3; y < c.height - b.height / 3; y += b.height / 3) {
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
        ctx.fillStyle = 'rgba(225, 225, 225, .8)'
        ctx.fillText(d.getDate() + '. ' + months[d.getMonth()] + ' ' + d.getFullYear(), c.width - 90, c.height - 110)

        ctx.font = '30px BurbankBigCondensed-Black, SDK_SC_Web Heavy, Wingdings, Open Sans, sans-serif, segoe-ui-emoji'
        ctx.textAlign = 'left'
        ctx.fillStyle = 'rgba(225, 225, 225, 1)'
        ctx.fillText(cT(hacc?.role?.nickname) + ' - ' + region(r) + ' ' + translate('Server', interaction.locale), 90, c.height - 110)


        const buffer = c.toBuffer('image/jpeg', {quality: 1})


        await interaction.editReply({
                content: translate("{0}'s Character List", interaction.locale).replace('{0}', chars?.role?.nickname) +
                    '\nIf you want to change the background color use: '  + '</' + data.find(cmd => cmd.name === 'colour').name + ':' + data.find(cmd => cmd.name === 'colour').id + '>',
                files: [{name: 'card.jpg', attachment: buffer}]
            }
        )
    }
}

module.exports = {name, description, options, filter, execute};