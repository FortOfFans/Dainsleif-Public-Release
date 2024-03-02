const {MessageEmbed, MessageActionRow, MessageSelectMenu, CommandInteractionOptionResolver, Collection} = require('discord.js');
const {getClosest, getUserSettings, jsonParse, translate, ambrApi} = require('../util');
const fs = require('fs');
const PagedMessage = require("../util/PagedMessage");
const C = require('canvas');
const {registerFont, loadImage} = require('canvas');

const name = translate('conscard');
const description = translate('Creates an image with a character\'s Constellations');
const filter = () => true;
const options = [
    {
        type: 3, //str
        name: translate('name'),
        description: translate('The character to search for.'),
        required: false
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

    const {items} = await ambrApi('/avatar', locs(interaction.locale));

    const list = Object.values(items)
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
                } else {
                    line = testLine;
                }
            }

            context.fillText(line, x, y);
            y += lineHeight;
        }
    }

    function wrapText2(context, text, x, y, maxWidth, lineHeight) {
        var count = (text.match(/\n/g) || []).length;
        var cars = text.split("\n");
        let times = 0;
        for (var ii = 0; ii < cars.length; ii++) {

            var line = "";
            var words = cars[ii].split(" ");
            for (var n = 0; n < words.length; n++) {
                var testLine = line + words[n] + " ";
                var metrics = context.measureText(testLine);
                var testWidth = metrics.width;


                if (testWidth > maxWidth) {
                    line = words[n] + " ";
                    times++;
                } else {
                    line = testLine;
                }
            }
        }
        context.beginPath();
        context.roundRect(550, y - 50, 1025, Math.max((times + count + 1) * lineHeight + 60, 100), 10);
        context.fillStyle = "rgba(0,0,0, .35)"
        context.fill();

        var splitchars = text.split("\n");
        context.fillStyle = "rgba(225,225,225, 1)"
        for (var xx = 0; xx < splitchars.length; xx++) {

            var zeilen = "";
            var wart = splitchars[xx].split(" ");

            for (var n = 0; n < wart.length; n++) {
                var testzeilen = zeilen + wart[n] + " ";
                var einheit = context.measureText(testzeilen);
                var breite = einheit.width;

                if (breite > maxWidth) {
                    context.fillText(zeilen, x, y);
                    zeilen = wart[n] + " ";
                    y += lineHeight;
                }
                else {
                    zeilen = testzeilen;
                }
            }

            context.fillText(zeilen, x, y);
            y += lineHeight;
        }
        return [Math.max((times + count + 1) * lineHeight + 60, 100)]
    }

    const fNc = {
        FIGHT_PROP_BASE_ATTACK: translate('Base ATK', interaction.locale),
        FIGHT_PROP_ELEMENT_MASTERY: translate('EM', interaction.locale),
        FIGHT_PROP_CRITICAL: translate('CRIT Rate', interaction.locale),
        FIGHT_PROP_CRITICAL_HURT: translate('CRIT DMG', interaction.locale),
        FIGHT_PROP_CRITICAL_VALUE: translate('CRIT Value', interaction.locale),
        FIGHT_PROP_ATTACK: translate('ATK', interaction.locale),
        FIGHT_PROP_ATTACK_PERCENT: translate('ATK', interaction.locale),
        FIGHT_PROP_CHARGE_EFFICIENCY: translate('ER', interaction.locale),
        FIGHT_PROP_DEFENSE: translate('DEF', interaction.locale),
        FIGHT_PROP_FIRE_ADD_HURT: translate('Pyro DMG', interaction.locale),
        FIGHT_PROP_WATER_ADD_HURT: translate('Hydro DMG', interaction.locale),
        FIGHT_PROP_PHYSICAL_ADD_HURT: translate('Physical DMG', interaction.locale),
        FIGHT_PROP_ELEC_ADD_HURT: translate('Electro DMG', interaction.locale),
        FIGHT_PROP_ICE_ADD_HURT: translate('Cryo DMG', interaction.locale),
        FIGHT_PROP_WIND_ADD_HURT: translate('Anemo DMG', interaction.locale),
        FIGHT_PROP_ROCK_ADD_HURT: translate('Geo DMG', interaction.locale),
        FIGHT_PROP_GRASS_ADD_HURT: translate('Dendro DMG', interaction.locale),
        FIGHT_PROP_HP_PERCENT: translate('HP', interaction.locale),
        FIGHT_PROP_HEAL_ADD: translate('Healing Bonus', interaction.locale),
        FIGHT_PROP_HEALED_ADD: translate('Incoming HB', interaction.locale),
        FIGHT_PROP_DEFENSE_PERCENT: translate('DEF', interaction.locale),
        FIGHT_PROP_SHIELD_COST_MINUS_RATIO: translate('Shield Strength', interaction.locale),
        FIGHT_PROP_ADD_HURT: translate('Raw DMG Bonus', interaction.locale)
    }

    const {id} = Object.values(items).find(w => w.route === closest) ?? {id: idToSearch};
    const {constellation: charConst, name: itemName, element, rank, icon, route, upgrade, weaponType, other} = await ambrApi('/avatar/' + id, locs(interaction.locale));
    const asn = Object.keys(upgrade.promote[1].addProps)[3]
    const asv = upgrade.promote.reduce((p, c) => p + (Object.values(c.addProps ?? {})?.[3] ?? 0), 0)

    const bg = {
        Fire: 'Pyro',
        Ice: 'Cryo',
        Grass: 'Dendro',
        Electric: 'Electro',
        Water: 'Hydro',
        Rock: 'Geo',
        Wind: 'Anemo'
    }

    const shadow =
        {
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
        file = fs.readFileSync('./data/cards/cons_' + interaction.locale + '_' + id + '.png');
    } catch (ignored) {
    }


    if (file) {
        interaction.editReply({
            content: translate("{0}'s constellation card", interaction.locale).replace('{0}',itemName),
            embeds: [],
            files: [{name: 'card.png', attachment: file}],
            components: []
        });
    } else if (!file) {


//Canvas generation
        {
            const c = C.createCanvas(1620, 1080);
            const ctx = c.getContext('2d');
            const background = await C.loadImage('./data/conste/' + bg[element] + '.png')
            ctx.drawImage(background, 0, 0, c.width, c.height)

            // Fonts
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
                ctx.globalAlpha = 0.90

                if (other?.costume[1]) {
                    await loadImage('https://api.ambr.top/assets/UI/' + other?.costume[1]?.icon.replace('AvatarIcon', 'Costume') + '.png')
                        .then((img) => {
                            ctx.drawImage(img, -870, -74, img.width * 1.2, img.height * 1.2)
                        })
                }
                else {
                    if ([10000032, 10000089, 10000046, 10000053, 10000086].includes(id)) {
                        await loadImage('https://api.ambr.top/assets/UI/UI_Gacha_AvatarImg_' + icon.split('_').pop() + '.png')
                            .then((img) => {
                                ctx.drawImage(img, -960, -74, img.width * 1.2, img.height * 1.2)
                            })
                    } else if ([10000048, 10000023].includes(id)) {
                        await loadImage('https://api.ambr.top/assets/UI/UI_Gacha_AvatarImg_' + icon.split('_').pop() + '.png')
                            .then((img) => {
                                ctx.drawImage(img, -790, -74, img.width * 1.2, img.height * 1.2)
                            })
                    } else if (/10000007/.test(id)) {
                        await loadImage('https://api.ambr.top/assets/UI/UI_Gacha_AvatarImg_' + icon.split('_').pop() + '.png')
                            .then((img) => {
                                ctx.drawImage(img, -900, 150, img.width * 1.2, img.height * 1.2)
                            })
                    } else if (/10000005/.test(id)) {
                        await loadImage('https://api.ambr.top/assets/UI/UI_Gacha_AvatarImg_' + icon.split('_').pop() + '.png')
                            .then((img) => {
                                ctx.drawImage(img, -1000, 150, img.width * 1.2, img.height * 1.2)
                            })
                    } else {
                        await loadImage('https://api.ambr.top/assets/UI/UI_Gacha_AvatarImg_' + icon.split('_').pop() + '.png')
                            .then((img) => {
                                ctx.drawImage(img, -870, -74, img.width * 1.2, img.height * 1.2)
                            })
                    }
                }

                // ctx.globalAlpha = 0.90
                // {
                //     await loadImage('https://api.ambr.top/assets/UI/UI_Gacha_AvatarImg_' + icon.split('_').pop() + '.png')
                //         .then((img) => {
                //             ctx.drawImage(img,  -1383, -74, img.width * 1.4, img.height * 1.4)
                //         })
                // }


                ctx.globalAlpha = 1
                await loadImage((fs.readFileSync('./data/conste/' + bg[element] + '_blend.png')))
                    .then((img) => {
                        ctx.drawImage(img, 0, 0, 1620, 1080, 0, 0, img.width, img.height)
                    })
                await loadImage((fs.readFileSync('./data/ascension/logo2.png')))
                    .then((img) => {
                        ctx.drawImage(img, 0, 0, 1620, 1080, 0, 0, img.width, img.height)
                    })

                ctx.shadowColor = "#ffffff";
                ctx.shadowBlur = 0;
            }
            // Text Generation
            {
                ctx.textAlign = 'Left';
                ctx.textBaseline = 'top';
                let y2 = 0

                for ( let i = 0; i < 6; i++){
                    if (cT(charConst[i].description).length > 900) ctx.font = '9.5px SDK_SC_Web Heavy'
                    if (cT(charConst[i].description).length > 800) ctx.font = '11.5px SDK_SC_Web Heavy'
                    if (cT(charConst[i].description).length > 700) ctx.font = '13.5px SDK_SC_Web Heavy'
                    if (cT(charConst[i].description).length > 290) ctx.font = '14px SDK_SC_Web Heavy'
                    if (cT(charConst[i].description).length > 175) ctx.font = '18px SDK_SC_Web Heavy'
                    if (cT(charConst[i].description).length < 175) ctx.font = '21px SDK_SC_Web Heavy'

                    ctx.shadowBlur = 0;
                    const txts = parseInt(ctx.font.split('px')[0])
                    let txt = cT(charConst[i].description);
                    const xd = wrapText2(ctx, txt, 680, 102 + y2, 875, (txts + 4.5))

                    ctx.font = '35px SDK_SC_Web Heavy'
                    if (cT(charConst[i].name).length > 30) ctx.font = '25px SDK_SC_Web Heavy'

                    ctx.shadowColor = shadow[element];
                    ctx.shadowBlur = 15;
                    ctx.fillStyle = 'white';
                    ctx.fillText(cT(charConst[i].name), 680, 60 + y2)
                    ctx.shadowColor = shadow[element];
                    ctx.shadowBlur = 20;
                    await loadImage('https://api.ambr.top/assets/UI/' + charConst[i].icon + '.png')
                        .then((img) => {
                            ctx.drawImage(img, 0, 0, 100, 100, 555, 55 + y2, 100, 100)
                        })
                    ctx.shadowBlur = 0;
                    y2 += (xd[0]) + 2 + 10

                }


                const bg2 = {
                    5: 'SSR',
                    4: 'SR',
                    3: 'R',
                    2: 'N',
                    1: 'U'
                }
                ctx.shadowBlur = 15
                ctx.shadowColor = 'rgba(0, 0, 0, .6)'
                await loadImage(fs.readFileSync('./data/profilegen/' + bg2[rank] + '_light.png'))
                    .then((img) => {
                        ctx.drawImage(img, 277 - img.width / 2, 805, img.width, img.height)
                    })
                ctx.shadowBlur = 0
                ctx.globalAlpha = 1

                ctx.shadowColor = "#ffffff";
                ctx.shadowBlur = 0;

                ctx.font = '30px HYWenHei-85W'
                let hm = ctx.measureText(fNc[asn] + ': ' + (['FIGHT_PROP_ELEMENT_MASTERY'].includes((Object.keys(upgrade.promote[1].addProps)[3])) ? (Math.round(asv / 3)).toString() : (Math.round((asv * 100 / 3) * 10) / 10).toString() + '%'))

                ctx.strokeStyle = "rbg(255, 0, 0)";
                ctx.beginPath();
                ctx.roundRect(252.5 - (( hm.width + 45) /2), 850, hm.width + 90, 65, 10)
                ctx.fillStyle = "rgba(0,0,0, .35)"
                ctx.fill();

                ctx.globalAlpha = 0.90
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillStyle = 'white';
                ctx.fillText(fNc[asn] + ': ' + (['FIGHT_PROP_ELEMENT_MASTERY'].includes((Object.keys(upgrade.promote[1].addProps)[3])) ? (Math.round(asv / 3)).toString() : (Math.round((asv * 100 / 3) * 10) / 10).toString() + '%'), 312, 900)
                ctx.globalAlpha = 1
                await loadImage(fs.readFileSync('./data/staticon/' + asn + '.png'))
                    .then((img) => {
                        ctx.drawImage(img, 0, 0, img.width, img.height, 250 - hm.width / 2, 858, 45, 45)
                    })
            }
            // PNG placement
            {
                weapontypes = {
                    WEAPON_SWORD_ONE_HAND: '01',
                    WEAPON_CATALYST: 'Catalyst_MD',
                    WEAPON_CLAYMORE: '04',
                    WEAPON_BOW: '02',
                    WEAPON_POLE: '03'
                }
                ctx.shadowColor = "rgba(0, 0, 0, .8)";
                ctx.shadowBlur = 12;
                await loadImage('https://api.ambr.top/assets/UI/Skill_A_' + weapontypes[weaponType] + '.png')
                    .then((img) => {
                        ctx.drawImage(img, 0, 0, img.width, img.height, 50, 50, img.width, img.height)
                    })
                ctx.shadowBlur = 0;
                await loadImage((fs.readFileSync('./data/conste/' + bg[element] + '_border.png')))
                    .then((img) => {
                        ctx.drawImage(img, 0, 0, 1620, 1080, 0, 0, img.width, img.height)
                    })
            }


            const buffer = c.toBuffer('image/png')
            fs.writeFileSync('data/cards/cons_' + interaction.locale + '_' + id + '.png', buffer)

            interaction.editReply({
                content: translate("{0}'s constellation card", interaction.locale).replace('{0}', itemName),
                embeds: [],
                files: [{name: 'Character_' + itemName +'.png', attachment: buffer}],
                components: []
            });
        }
    }
}

module.exports = {name, description, options, filter, execute};