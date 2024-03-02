const {MessageEmbed, MessageActionRow, MessageSelectMenu, CommandInteractionOptionResolver, Collection, MessageButton} = require('discord.js');
const {getClosest, getUserSettings, jsonParse, translate, untranslate, ambrApi, ambrLocale} = require('../util');
const PagedEmbed = require('../util/PagedEmbed');
const PagedMessage = require('../util/PagedMessage');
const fs = require('fs');
const C = require('canvas');
const {createCanvas, registerFont, loadImage, CanvasRenderingContext2D} = require('canvas');

const name = translate('weaponcard');
const description = translate('Generates a weapon card.');
const filter = () => true;
const options = [
    {
        type: 3,
        name: translate('name'),
        description: translate('Name the weapon you want to find.'),
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

    function wrapText(context, text, x, y, maxWidth, lineHeight) {
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
        context.roundRect(x - 15, y - 15, maxWidth + 25, (times + 1) * lineHeight + 25, 10);
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
    }

    const aliases = jsonParse('./data/aliases/weapon.json', {});
    const query = interaction.options.getString('name') ?? '';

    const {items} = await ambrApi('/weapon', locs(interaction.locale));

    const list = Object.values(items)
        .filter(i => [3, 4, 5].includes(i.rank))
        // .filter(i => !i.beta)
        .map(w => w.route)
        .sort();
    const closest = getClosest((aliases[query] ?? query), list);

    if (!idToSearch && (!closest || !query)) {
        const emojiMap = jsonParse('./data/emojis/weaponIdEmojis.json', {});

        const listEmbed = new MessageEmbed()
            .setColor(getUserSettings(interaction.user.id).color)
            .setDescription(translate('Please select a weapon to view its details.', interaction.locale));

        const pages = [];
        const pageSize = 25;

        for (let i = 0; i <= list.length; i += pageSize) {
            const embed = listEmbed;
            const row = new MessageActionRow();
            const selectMenu = new MessageSelectMenu()
                .setCustomId('itemselect');

            const typesname = {
                WEAPON_SWORD_ONE_HAND: 'Sword',
                WEAPON_CLAYMORE: 'Claymore',
                WEAPON_POLE: 'Polearm',
                WEAPON_CATALYST: 'Catalyst',
                WEAPON_BOW: 'Bow'
            }

            const options = list.slice(i, i + pageSize)
                .map(item => ({
                    value: item.replace(/\\"/g, '"'),
                    label: item.replace(/\\"/g, '"'),
                    description: ' ' + Object.values(items).find(i => i.route === item)?.rank + '-Star ' + typesname[Object.values(items).find(i => i.route === item)?.type],
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

    const {id} = Object.values(items).find(w => w.route === closest) ?? {id: idToSearch};
    const weaponData = await ambrApi('/weapon/' + id, locs(interaction.locale));
    const {rank, name: itemName, description, affix, ascension, icon, upgrade, type, route} = weaponData;
    const maxLevel = upgrade.promote[upgrade.promote.length - 1].unlockMaxLevel;



    const friendlyNames = {
        BASE_ATTACK: translate('Base ATK', interaction.locale),
        ELEMENT_MASTERY: translate('Elemental Mastery', interaction.locale),
        CRITICAL: translate('CRIT Rate', interaction.locale),
        CRITICAL_HURT: translate('CRIT DMG', interaction.locale),
        ATTACK: translate('ATK', interaction.locale),
        ATTACK_PERCENT: translate('ATK', interaction.locale),
        CHARGE_EFFICIENCY: translate('Energy Recharge', interaction.locale),
        DEFENSE: translate('DEF', interaction.locale),
        FIRE_ADD_HURT: translate('Pyro DMG Bonus', interaction.locale),
        WATER_ADD_HURT: translate('Hydro DMG Bonus', interaction.locale),
        PHYSICAL_ADD_HURT: translate('Physical DMG Bonus', interaction.locale),
        ELEC_ADD_HURT: translate('Electro DMG Bonus', interaction.locale),
        ICE_ADD_HURT: translate('Cryo DMG Bonus', interaction.locale),
        WIND_ADD_HURT: translate('Anemo DMG Bonus', interaction.locale),
        ROCK_ADD_HURT: translate('Geo DMG Bonus', interaction.locale),
        GRASS_ADD_HURT: translate('Dendro DMG Bonus', interaction.locale),
        ADD_HURT: translate('DMG Bonus', interaction.locale),
        HP_PERCENT: translate('HP', interaction.locale),
        HEAL_ADD: translate('Healing Bonus', interaction.locale),
        HEALED_ADD: translate('Incoming HB', interaction.locale),
        DEFENSE_PERCENT: translate('DEF', interaction.locale)
    }

    function getSerialised(id) {
        if (id.toString().startsWith('FIGHT_PROP')) {
            const short = id.replace('FIGHT_PROP_', '');

            return friendlyNames[short] ?? short;
        }

        const locales = {
            'en-GB': 'en',
            'en-US': 'en',
            'es-ES': 'es',
            'pt-BR': 'pt'
        }
        const locale = locales[locs(interaction.locale)] ?? (serialisations[locs(interaction.locale)] ? interaction.locale : 'en');
        const found = serialisations[locale][id];

        return found ?? id.toString();
    }
    const bg = {
        5: '5-Star',
        4: '4-Star',
        3: '3-Star',
        2: '2-Star',
        1: '1-Star'
    }

    const weaponCurve = await ambrApi('/weaponCurve', 'static');

    function calculateLVL() {

        // List
        const lvlList = [];
        const upgradeList = {upgrade: {}, items: null};

        // Base Data
        const {prop, promote} = weaponData.upgrade;
        const rank = promote.length - 1;
        const {unlockMaxLevel, addProps, costItems} = promote[rank];

        if (costItems != undefined) upgradeList.items = costItems;
        let baseLvl = rank == 0 ? 1 : promote[rank - 1].unlockMaxLevel;

        for (let lvl = baseLvl; lvl <= unlockMaxLevel; lvl++) {
            if ((lvl % 5 === 0) == true) lvlList.push(lvl);
        }

        // Cycle fuckery
        prop.forEach((item) => {
            if (item.propType != undefined) {
                upgradeList.upgrade[item.propType] = {};
                const {propType, initValue, type} = item;
                let plusValue = 0;
                if (addProps != undefined && propType in addProps)
                    plusValue = addProps[propType];

                lvlList.forEach((lvl) => {
                    if (`${Math.floor(initValue)}`.length == 1) {
                        let test =
                            plusValue +
                            initValue * weaponCurve[lvl].curveInfos[type] * 100;

                        upgradeList.upgrade[item.propType][lvl] =
                            parseFloat(test).toFixed(1);
                    } else {
                        let test =
                            plusValue +
                            initValue * weaponCurve[lvl].curveInfos[type];

                        upgradeList.upgrade[item.propType][lvl] =
                            parseFloat(test).toFixed();
                    }
                });
            }
        });

        return upgradeList;
    }

    let file;
    try {
        file = fs.readFileSync('./data/cards/weapon_'  + interaction.locale + '_' + id +  '.png');
    } catch (ignored) {
    }


    if (file) {
        interaction.editReply({
            content: translate("{0}'s weapon card", interaction.locale).replace('{0}',itemName),
            files: [{name: 'card.png', attachment: file}],
            embeds: [],
            components: []
        });
    } else if (!file) {
        //Canvas generation
        {
            const c = C.createCanvas(1620, 1080);
            const ctx = c.getContext('2d');
            const background = await C.loadImage('./data/weapons/' + bg[rank] + '.png')
            ctx.drawImage(background, 0, 0, c.width, c.height)

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

            // Text Generation
            {

                const passive = Object.values(affix)[0];

                ctx.font = '21px SDK_SC_Web Heavy'
                const keys = Object.keys(passive.upgrade);

                if (affix) {


                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.font = '25px SDK_SC_Web Heavy'
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(cT(passive.name), 363, 435)


                    ctx.font = '21px SDK_SC_Web Heavy'
                    ctx.fillStyle = '#ffffff';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'top';
                    var txt = cT(passive.upgrade[keys[keys.length - 1]]);
                    wrapText(ctx, txt, 90, 480, 550, 25.5)

                }

                if (cT(itemName).length > 22) {
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'bottom';
                    ctx.font = '75px SDK_SC_Web Heavy'
                    ctx.shadowColor = "#e25407";
                    ctx.shadowBlur = 15;
                    ctx.fillStyle = 'white';
                    ctx.fillText(cT(itemName), 818, 174)
                } else {
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'bottom';
                    ctx.font = '85px SDK_SC_Web Heavy'
                    ctx.shadowColor = "#e25407";
                    ctx.shadowBlur = 15;
                    ctx.fillStyle = 'white';
                    ctx.fillText(cT(itemName), 818, 174)
                }

                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.shadowColor = "#ffffff";
                ctx.shadowBlur = 0;
                ctx.font = '32px SDK_SC_Web Heavy'
                ctx.fillStyle = 'white';


                ctx.font = '20px SDK_SC_Web Heavy'
                ctx.beginPath();
                ctx.roundRect(385, 195, Math.max(167, (ctx.measureText(getSerialised(Object.keys(calculateLVL().upgrade)[1])).width + 30)), 200, 10)
                ctx.fillStyle = "rgba(0,0,0, .35)"
                ctx.fill();

                for (const [name, values] of Object.entries(calculateLVL().upgrade)) {
                    const valueKeys = Object.keys(values);
                    const maxLevel = valueKeys[valueKeys.length - 1]

                    ctx.textBaseline = 'bottom';
                    ctx.font = '43.75px SDK_SC_Web Heavy'
                    ctx.fillText(Object.values(calculateLVL().upgrade)[0][maxLevel], 400, 385.2)

                    const stati = (name.includes('PERCENT') ? '%' : '') + (name.includes('ADD_HURT') ? '%' : '') + (name.includes('CRITICAL') ? '%' : '') + (name.includes('CHARGE') ? '%' : '')

                    ctx.font = '20px SDK_SC_Web Heavy'
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = 'rgba(255, 255, 255, .30)';
                    ctx.fillText(translate('Base ATK', interaction.locale), 400, 320)

                    ctx.textBaseline = 'bottom';
                    ctx.font = '20.75px SDK_SC_Web Heavy'
                    ctx.fillStyle = 'white';
                    ctx.fillText(Object.values(calculateLVL().upgrade)[1][maxLevel] + stati, 400, 291)

                    ctx.font = '20px SDK_SC_Web Heavy'
                    ctx.fillStyle = 'rgba(255,255,255,.30)';
                    ctx.fillText(getSerialised(Object.keys(calculateLVL().upgrade)[1]), 400, 265)

                    ctx.font = '20px SDK_SC_Web Heavy'
                    ctx.textBaseline = 'top';
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(type, 400, 208)
                }

            }

            const as1 = Object.entries(ascension).map(([id, amt]) => id)
            const lup1 = upgrade.promote.map(item => Object.keys(item.costItems ?? {}))
            const {rank: ranki} = await ambrApi('/material/' + lup1[6]?.[0], interaction.locale);

            // PNG placement
            {
                //WeaponIcon
                {
                    const bg2 = {
                        5: 'SSR',
                        4: 'SR',
                        3: 'R',
                        2: 'N',
                        1: 'U'
                    }
                    await loadImage('https://api.ambr.top/assets/UI/' + (icon) + '.png')
                        .then((img) => {
                            ctx.drawImage(img, 146, 190, 180, 180)
                        })

                    await loadImage(fs.readFileSync('./data/profilegen/' + bg2[rank] + '_light.png'))
                        .then((img) => {
                            ctx.drawImage(img, 78, 360, img.width * .75, img.height * .75)
                        })
                    await loadImage(fs.readFileSync('./data/profilegen/R5.png'))
                        .then((img) => {
                            ctx.drawImage(img, 130, 200, img.width * 1.2, img.height * 1.2)
                        })
                }
                if (ranki === 4) {
                    //mats row 1
                    {
                        await loadImage('https://api.ambr.top/assets/UI/UI_ItemIcon_' + as1[6] + '.png')
                            .then((img) => {
                                ctx.drawImage(img, 0, 0, img.width, img.height, 687, 195, 179.2, 179.2)
                            })
                        await loadImage('https://api.ambr.top/assets/UI/UI_ItemIcon_' + as1[7] + '.png')
                            .then((img) => {
                                ctx.drawImage(img, 0, 0, img.width, img.height, 909, 195, 179.2, 179.2)
                            })

                        await loadImage('https://api.ambr.top/assets/UI/UI_ItemIcon_' + as1[8] + '.png')
                            .then((img) => {
                                ctx.drawImage(img, 0, 0, img.width, img.height, 1132, 195, 179.2, 179.2)
                            })
                        await loadImage('https://api.ambr.top/assets/UI/UI_ItemIcon_' + as1[9] + '.png')
                            .then((img) => {
                                ctx.drawImage(img, 0, 0, img.width, img.height, 1357, 195, 179.2, 179.2)
                            })
                    }
                    //mats row 2
                    {
                        await loadImage('https://api.ambr.top/assets/UI/UI_ItemIcon_' + lup1[1]?.[1] + '.png')
                            .then((img) => {
                                ctx.drawImage(img, 0, 0, img.width, img.height, 687, 465, 179.2, 179.2)
                            })
                        await loadImage('https://api.ambr.top/assets/UI/UI_ItemIcon_' + lup1[4]?.[1] + '.png')
                            .then((img) => {
                                ctx.drawImage(img, 0, 0, img.width, img.height, 909, 465, 179.2, 179.2)
                            })

                        await loadImage('https://api.ambr.top/assets/UI/UI_ItemIcon_' + lup1[6]?.[1] + '.png')
                            .then((img) => {
                                ctx.drawImage(img, 0, 0, img.width, img.height, 1140, 465, 179.2, 179.2)
                            })
                    }
                    //mats row 3
                    {
                        await loadImage('https://api.ambr.top/assets/UI/UI_ItemIcon_' + lup1[1]?.[0] + '.png')
                            .then((img) => {
                                ctx.drawImage(img, 0, 0, img.width, img.height, 687, 725, 179.2, 179.2)
                            })
                        await loadImage('https://api.ambr.top/assets/UI/UI_ItemIcon_' + lup1[4]?.[0] + '.png')
                            .then((img) => {
                                ctx.drawImage(img, 0, 0, img.width, img.height, 909, 725, 179.2, 179.2)
                            })

                        await loadImage('https://api.ambr.top/assets/UI/UI_ItemIcon_' + lup1[6]?.[0] + '.png')
                            .then((img) => {
                                ctx.drawImage(img, 0, 0, img.width, img.height, 1140, 725, 179.2, 179.2)
                            })
                    }
                } else {
                    //mats row 1
                    {
                        await loadImage('https://api.ambr.top/assets/UI/UI_ItemIcon_' + as1[6] + '.png')
                            .then((img) => {
                                ctx.drawImage(img, 0, 0, img.width, img.height, 687, 195, 179.2, 179.2)
                            })
                        await loadImage('https://api.ambr.top/assets/UI/UI_ItemIcon_' + as1[7] + '.png')
                            .then((img) => {
                                ctx.drawImage(img, 0, 0, img.width, img.height, 909, 195, 179.2, 179.2)
                            })

                        await loadImage('https://api.ambr.top/assets/UI/UI_ItemIcon_' + as1[8] + '.png')
                            .then((img) => {
                                ctx.drawImage(img, 0, 0, img.width, img.height, 1132, 195, 179.2, 179.2)
                            })
                        await loadImage('https://api.ambr.top/assets/UI/UI_ItemIcon_' + as1[9] + '.png')
                            .then((img) => {
                                ctx.drawImage(img, 0, 0, img.width, img.height, 1357, 195, 179.2, 179.2)
                            })
                    }
                    //mats row 2
                    {
                        await loadImage('https://api.ambr.top/assets/UI/UI_ItemIcon_' + lup1[1]?.[0] + '.png')
                            .then((img) => {
                                ctx.drawImage(img, 0, 0, img.width, img.height, 687, 465, 179.2, 179.2)
                            })
                        await loadImage('https://api.ambr.top/assets/UI/UI_ItemIcon_' + lup1[4]?.[0] + '.png')
                            .then((img) => {
                                ctx.drawImage(img, 0, 0, img.width, img.height, 909, 465, 179.2, 179.2)
                            })

                        await loadImage('https://api.ambr.top/assets/UI/UI_ItemIcon_' + lup1[6]?.[0] + '.png')
                            .then((img) => {
                                ctx.drawImage(img, 0, 0, img.width, img.height, 1132, 465, 179.2, 179.2)
                            })
                    }
                    //mats row 3
                    {
                        await loadImage('https://api.ambr.top/assets/UI/UI_ItemIcon_' + lup1[1]?.[1] + '.png')
                            .then((img) => {
                                ctx.drawImage(img, 0, 0, img.width, img.height, 687, 725, 179.2, 179.2)
                            })
                        await loadImage('https://api.ambr.top/assets/UI/UI_ItemIcon_' + lup1[4]?.[1] + '.png')
                            .then((img) => {
                                ctx.drawImage(img, 0, 0, img.width, img.height, 909, 725, 179.2, 179.2)
                            })

                        await loadImage('https://api.ambr.top/assets/UI/UI_ItemIcon_' + lup1[6]?.[1] + '.png')
                            .then((img) => {
                                ctx.drawImage(img, 0, 0, img.width, img.height, 1132, 725, 179.2, 179.2)
                            })
                    }
                }
            }

            const buffer = c.toBuffer('image/png')
            fs.writeFileSync('./data/cards/weapon_' + interaction.locale + '_' + id + '.png', buffer)

            interaction.editReply({
                content: translate("{0}'s weapon card", interaction.locale).replace('{0}',itemName),
                files: [{name: interaction.locale + '_' + itemName +'.png', attachment: buffer}],
                embeds: [],
                components: []
            });
        }
    }
}

module.exports = {name, description, options, filter, execute};