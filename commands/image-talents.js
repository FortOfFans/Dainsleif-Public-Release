const {MessageEmbed, MessageActionRow, MessageSelectMenu, CommandInteractionOptionResolver, Collection} = require('discord.js');
const {getClosest, getUserSettings, jsonParse, translate, ambrApi} = require('../util');
const fs = require('fs');
const PagedMessage = require("../util/PagedMessage");
const C = require('canvas');
const {registerFont, loadImage} = require('canvas');

const name = 'talentcard';
const description = translate('Creates an image with a character\'s Talents!');
const filter = () => true;
const options = [
    {
        type: 3, //str
        name: translate('name'),
        description: translate('The character to search for.'),
        required: true
    },
    {
        type: 3, //str
        name: 'talent',
        description: translate('The talent you are looking for. (na / es /eb)'),
        required: true,
        choices: [
            {
                name: 'Normal Attack',
                value:'na'
            },
            {
                name: 'Elemental Skill',
                value:'es'
            },
            {
                name: 'Elemental Burst',
                value:'eb'
            }
        ]
    }
];

async function execute(interaction, idToSearch) {

    function cT(text) {
        return text
            .replace(/\\+n/g, '\n')
            .replace(/·/g, '·')
            .replace(/<\/?color(=#?[A-F0-9]{8})?>/gi, '')
            .replace(/\{LAYOUT_(\w)+#(\w)+/g, data => data.includes('LAYOUT_PC') ? data.split('#')[1] : '')
            .replace(/\}|#/g, '')
            .replace(/ß{3,}/gi, '')
            .replace(/Ъ{3,}/gi, '')
            .replace(/<\/?i>/g, '')
            .replace(/{NON_BREAK_SPACE/g, '')
    }

    function locs(text) {
        return text
            .replace('ja', 'en-GB')
            .replace('zh-CN', 'en-GB')
            .replace('zh-TW', 'en-GB')
    }

    const aliases = jsonParse('./data/aliases/character.json', {});
    const query = interaction.options.getString('name') ?? '';
    const skill = interaction.options.getString('talent' ?? 'na')


    const {items} = await ambrApi('/avatar', interaction.locale);

    const list = Object.values(items)
        // .filter(i => !i.beta)
        .filter(i => !i.route.includes('Traveler'))
        .map(w => w.route)
        .sort();
    const closest = getClosest((aliases[query] ?? query), list);

    if (!idToSearch && (!closest || !query)) {
        const emojiMap = jsonParse('./data/emojis/characterIdEmojis.json', {});

        const listEmbed = new MessageEmbed()
            .setColor(getUserSettings(interaction.user.id).color)
            .setDescription(translate('Please select a character to view their info.', interaction.locale));

        const pages = [];
        const pageSize = 25;

        for (let i = 0; i <= list.length; i += pageSize) {
            const embed = listEmbed;
            const row = new MessageActionRow();
            const selectMenu = new MessageSelectMenu()
                .setCustomId('itemselect');

            const typesname = {Electric: 'Electro', Fire: 'Pyro', Grass: 'Dendro', Ice: 'Cryo', Rock: 'Geo', Water: 'Hydro', Wind: 'Anemo'}

            const options = list.slice(i, i + pageSize)
                .map(item => ({
                    value: item.replace(/\\"/g, '"'),
                    label: item.replace(/\\"/g, '"'),
                    description: ' ' + Object.values(items).find(i => i.route === item)?.rank + '-Star ' + typesname[Object.values(items).find(i => i.route === item)?.element] + ' Character',
                    emoji: emojiMap[Object.values(items).find(i => i.route === item)?.id] ?? '<:UI_ItemIcon_QUESTION:997149126032638022>'
                }));
            selectMenu.addOptions(options);
            row.addComponents(selectMenu);

            pages.push({embeds: [embed], components: [row]});
        }

        const pagedMsg = new PagedMessage(interaction, pages);
        const {message} = await pagedMsg.update();

        const filter = i => interaction.user.id === i.user.id;
        const time = 10 * 60 * 1000
        const collector = message.createMessageComponentCollector({filter, time});

        collector.on('collect', async i => {
            await i.deferUpdate().catch(() => {
            });

            if (i.customId !== 'itemselect') return null;

            await pagedMsg.end(false);

            const cmdOptions = [{
                name: options[0].name,
                type: 'STRING',
                value: i.values[0]
            }];

            interaction.options = new CommandInteractionOptionResolver(
                interaction.client,
                cmdOptions,
                {
                    users: new Collection(),
                    members: new Collection(),
                    roles: new Collection(),
                    channels: new Collection(),
                    messages: new Collection()
                }
            );

            interaction.client.commands.get(name).execute(interaction);
        });

        return null;
    }

    function wrapText(context, text, x, y, maxWidth, lineHeight) {
        var cars = text.split("\n");

        for (var ii = 0; ii < cars.length; ii++) {

            var line = "";
            var words = cars[ii].split(" ");

            for (var n = 0; n < words.length; n++) {
                var testLine = line + words[n] + " ";
                var metrics = context.measureText(testLine);
                var testWidth = metrics.width;

                if (testWidth > maxWidth) {
                    context.fillText(line, x, y);
                    line = words[n] + " ";
                    y += lineHeight;
                }
                else {
                    line = testLine;
                }
            }

            context.fillText(line, x, y);
            y += lineHeight;
        }
    }

    const {id} = Object.values(items).find(w => w.route === closest) ?? {id: idToSearch};

    const sn = {
        na: 0,
        es: 1,
        eb: {10000002: 4, 10000041: 4, 10000054: 3}[id] ?? 3,
        normal: 0,
        skill: 1,
        burst: {10000002: 4, 10000041: 4, 10000054: 3}[id] ?? 3,
        w: 1,
        q: {10000002: 4, 10000041: 4, 10000054: 3}[id] ?? 3
    }

    const {name: itemName, element, talent} = await ambrApi('/avatar/' + id, locs(interaction.locale));

    const hk = talent?.[(sn[skill] ?? 0)]?.promote?.[10]?.description.filter(e => e).length
    const params = talent?.[(sn[skill] ?? 0)]?.promote?.[10]?.params

    const gacha = jsonParse('./data/maps/genshinAvatar.json', {})
    function sP2(text) {
        return text
            .replace(/Elemental Mastery|Elementarkunde|Maestría Elemental|Maîtrise élémentaire|maestria elementale|ของความชำนาญธาตุ|Tinh Thông/, translate('EM', interaction.locale))
            .replace(/\{param(\d+):(F?\d?P?I?)}/gi, (_, num, f1p) => {
                const perc = f1p.includes('P', 'I') ? '%' : '';
                if (f1p === 'F2') return Math.round(params[parseInt(num) - 1]* 100) / 100;
                if (!perc) return Math.round(params[parseInt(num) - 1]);
                else return f1p ? Math.round(params[parseInt(num) - 1] * 100 * 10) / 10 + '%' : Math.round(params[parseInt(num) - 1] * 100) + '%'
            }).split('|');
    }

    const bg = {
        Fire: 'Pyro',
        Ice: 'Cryo',
        Grass: 'Dendro',
        Electric: 'Electro',
        Water: 'Hydro',
        Rock: 'Geo',
        Wind: 'Anemo'
    }

    const shadow = {
        Fire: '#ff7b74',
        Ice: '#28d4dc',
        Grass: '#27C732',
        Electric: '#8E6BB0',
        Water: '#3A52CC',
        Rock: '#efdb7c',
        Wind: '#3aff91'
    }

    let file;
    try {
        file = fs.readFileSync('./data/cards/talents_'  + interaction.locale + '_' + id +  '_' + (sn[skill] ?? 0) + '.png');
    } catch (ignored) {
    }


    if (file) {
        interaction.editReply({
            content: translate("{0}'s talent card", interaction.locale).replace('{0}',itemName),
            files: [{name: 'card.png', attachment: file}],
            embeds: [],
            components: []
        });
    } else if (!file) {

//Canvas generation
        {
            const c = C.createCanvas(1153, 1080);
            const ctx = c.getContext('2d');
            const background = await C.loadImage('./data/talents/' + (bg[element] ?? 'Empty') + 'BG.jpg')
            ctx.drawImage(background, 0, 0, c.width, c.height)

            // Font Registry
            {
                registerFont('./data/fonts/FolkMulti-Bold.ttf', {
                    family: 'Folk Multi',
                    weight: 'B'
                });
                registerFont('./data/fonts/zh-cn.ttf', {
                    family: 'ZHWenHei-85W'
                });
                registerFont('./data/fonts/zh-cn2.ttf', {
                    family: 'SDK_SC_Web Heavy'
                });
                registerFont('./data/fonts/burbank_small_medium.ttf', {
                    family: 'Burbank Small',
                    weight: 'medium'
                });
                registerFont('./data/fonts/burbank_small_black.ttf', {
                    family: 'Burbank Small',
                    weight: 'black'
                });
                registerFont('./data/fonts/burbank_small_bold.ttf', {
                    family: 'Burbank Small',
                    weight: 'bold'
                });
                registerFont('./data/fonts/Burbank Big Regular Black.ttf', {
                    family: 'Burbank Big Regular Black'
                });
                registerFont('./data/fonts/burbank_big_regular_bold.ttf', {
                    family: 'Burbank Big Rg Bd Bold'
                });
                registerFont('./data/fonts/NotoSans-Regular.ttf', {
                    family: 'Noto Sans Regular'
                });
            }
            // Technical stuff
            {
                await loadImage(fs.readFileSync('./data/talents/Skill.png'))
                    .then((img) => {
                        ctx.drawImage(img, 0, 0, 1153, 1080)
                    })

            }
            // Text Generation
            {
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillStyle = '#d3bc8e';
                {
                    if (cT(talent?.[(sn[skill] ?? 0)]?.name).length > 50) {
                        ctx.font = '19px SDK_SC_Web Heavy'
                    }
                    else if (cT(talent?.[(sn[skill] ?? 0)]?.name).length > 40) {
                        ctx.font = '20px SDK_SC_Web Heavy'
                    }
                    else {
                        ctx.font = '22.5px SDK_SC_Web Heavy'
                    }
                }
                ctx.fillText(cT(talent?.[(sn[skill] ?? 0)]?.name), 285, 184)

                ctx.globalAlpha = 0.90
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.font = '19px SDK_SC_Web Heavy'
                ctx.fillStyle = '#ffffff';
                ctx.fillText('Lv. 10', 285, 208)

                // Talent Description
                {
                    if (cT(talent?.[(sn[skill] ?? 0)]?.description).length > 1700) {

                        ctx.globalAlpha = 1
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'top';
                        ctx.font = '14px SDK_SC_Web Heavy'
                        ctx.fillStyle = '#ffffff';
                        var txt = cT(talent?.[(sn[skill] ?? 0)]?.description);
                        wrapText(ctx, txt, 50, 295, 480, 18)
                    }
                    else if (cT(talent?.[(sn[skill] ?? 0)]?.description).length > 1400) {

                        ctx.globalAlpha = 1
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'top';
                        ctx.font = '15px SDK_SC_Web Heavy'
                        ctx.fillStyle = '#ffffff';
                        var txt = cT(talent?.[(sn[skill] ?? 0)]?.description);
                        wrapText(ctx, txt, 50, 295, 480, 19)
                    }
                    else if (cT(talent?.[(sn[skill] ?? 0)]?.description).length > 1250) {

                        ctx.globalAlpha = 1
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'top';
                        ctx.font = '16.5px SDK_SC_Web Heavy'
                        ctx.fillStyle = '#ffffff';
                        var txt = cT(talent?.[(sn[skill] ?? 0)]?.description);
                        wrapText(ctx, txt, 50, 295, 480, 20.5)
                    }
                    else if (cT(talent?.[(sn[skill] ?? 0)]?.description).length > 1000) {

                        ctx.globalAlpha = 1
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'top';
                        ctx.font = '17px SDK_SC_Web Heavy'
                        ctx.fillStyle = '#ffffff';
                        var txt = cT(talent?.[(sn[skill] ?? 0)]?.description);
                        wrapText(ctx, txt, 50, 295, 480, 21)
                    }
                    else if (cT(talent?.[(sn[skill] ?? 0)]?.description).length > 900) {

                        ctx.globalAlpha = 1
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'top';
                        ctx.font = '19px SDK_SC_Web Heavy'
                        ctx.fillStyle = '#ffffff';
                        var txt = cT(talent?.[(sn[skill] ?? 0)]?.description);
                        wrapText(ctx, txt, 50, 295, 480, 23)
                    }
                    else if (cT(talent?.[(sn[skill] ?? 0)]?.description).length > 700) {

                        ctx.globalAlpha = 1
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'top';
                        ctx.font = '21px SDK_SC_Web Heavy'
                        ctx.fillStyle = '#ffffff';
                        var txt = cT(talent?.[(sn[skill] ?? 0)]?.description);
                        wrapText(ctx, txt, 50, 295, 480, 26)
                    }
                    else {
                        ctx.globalAlpha = 1
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'top';
                        ctx.font = '22.5px SDK_SC_Web Heavy'
                        ctx.fillStyle = '#ffffff';
                        var txt = cT(talent?.[(sn[skill] ?? 0)]?.description);
                        wrapText(ctx, txt, 50, 295, 480, 27.5)
                    }
                }

                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                {
                    if (cT(talent?.[(sn[skill] ?? 0)]?.name).length > 50) {
                        ctx.font = '19px SDK_SC_Web Heavy'
                    }
                    else if (cT(talent?.[(sn[skill] ?? 0)]?.name).length > 40) {
                        ctx.font = '20px SDK_SC_Web Heavy'
                    }
                    else {
                        ctx.font = '22.5px SDK_SC_Web Heavy'
                    }
                }
                ctx.fillStyle = '#d3bc8e';
                ctx.fillText(cT(talent?.[(sn[skill] ?? 0)]?.name), 868, 184)

                ctx.globalAlpha = 0.90
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.font = '19px SDK_SC_Web Heavy'
                ctx.fillStyle = '#ffffff';
                ctx.fillText('Lv. 10', 868, 208)

                ctx.shadowColor = shadow[element];
                ctx.shadowBlur = 0;

                let y = 278;
                for (let i = 0; i < hk; i++) {
                    ctx.strokeStyle = "rbg(255, 0, 0)";
                    ctx.beginPath();
                    ctx.rect(615, y, 500, 45)
                    ctx.fillStyle = "rgba(0, 0, 0, 0.35)"
                    ctx.fill();
                    y += 50;
                }

                ctx.globalAlpha = 1
                let y2 = 305.5;
                for (let i = 0; i < hk; i++) {
                    let hg = sP2(talent?.[(sn[skill] ?? 0)]?.promote?.[10]?.description?.[i])
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    ctx.font = '12px SDK_SC_Web Heavy'
                    ctx.fillStyle = '#d3bc8e';
                    ctx.fillText(cT(hg[0]).replace(/^(.{22}[^\s]*).*/, "$1"), 635, y2);
                    ctx.font = '17px SDK_SC_Web Heavy'
                    ctx.textAlign = 'right';
                    ctx.fillStyle = '#ece5d8';
                    ctx.fillText(hg[1], 1096, y2);
                    y2 += 50;
                }

                // ctx.globalAlpha = 0.90
                // ctx.textAlign = 'left';
                // ctx.textBaseline = 'middle';
                // ctx.font = '17px SDK_SC_Web Heavy'
                // ctx.fillStyle = '#ffffff';
                // var txt = sP(talent?.[(sn[skill] ?? 0)]?.promote?.[10]?.description.join('\n'))
                // wrapText(ctx, txt, 635, 305.5, 480, 49)
            }
            // PNG placement
            {

                ctx.shadowColor = shadow[element];
                ctx.shadowBlur = 20;
                await loadImage('https://api.ambr.top/assets/UI/' + talent?.[(sn[skill] ?? 0)]?.icon + '.png')
                    .then((img) => {
                        ctx.drawImage(img, 0, 0,img.width, img.height,  230, 35, 128,128)
                    })
                await loadImage('https://api.ambr.top/assets/UI/' + talent?.[(sn[skill] ?? 0)]?.icon + '.png')
                    .then((img) => {
                        ctx.drawImage(img, 0, 0, img.width, img.height, 813, 35, 128, 128)
                    })
                ctx.shadowColor = shadow[element];
                ctx.shadowBlur = 0;
                await loadImage(fs.readFileSync('data/talents/Watermark.png'))
                    .then((img) => {
                        ctx.drawImage(img, 0, 0)
                    })
            }


            const buffer = c.toBuffer('image/png')
            fs.writeFileSync('./data/cards/talents_'  + interaction.locale + '_' + id +  '_' + (sn[skill] ?? 0) + '.png', buffer)

            interaction.editReply({
                content: translate("{0}'s talent card", interaction.locale).replace('{0}',itemName),
                files: [{name: 'card.png', attachment: buffer}],
                embeds: [],
                components: []
            });
        }
    }
}

module.exports = {name, description, options, filter, execute};