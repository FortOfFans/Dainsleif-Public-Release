const {MessageEmbed, MessageActionRow, MessageSelectMenu, CommandInteractionOptionResolver, Collection, MessageButton} = require('discord.js');
const {getClosest, getUserSettings, jsonParse, translate, untranslate, ambrApi, ambrLocale, readFile, readFileImg} = require('../util');
const fs = require('fs');
const PagedEmbed = require('../util/PagedEmbed');
const PagedMessage = require("../util/PagedMessage");
const C = require('canvas');
const {createCanvas, registerFont, loadImage, CanvasRenderingContext2D} = require('canvas');

const name = translate('ascendcard');
const description = translate('Creates an image with a character\'s Ascension Materials');
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
        // .filter(i => !i.beta)
        // .filter(i => !i.route.includes('Traveler'))
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

            const typesname = {
                Electric: 'Electro',
                Fire: 'Pyro',
                Grass: 'Dendro',
                Ice: 'Cryo',
                Rock: 'Geo',
                Water: 'Hydro',
                Wind: 'Anemo'
            }

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

    const {id} = Object.values(items).find(w => w.route === closest) ?? {id: idToSearch};
    const {ascension, constellation: charConst, name: itemName, element, rank, icon, route, talent, upgrade, weaponType, other} = await ambrApi('/avatar/' + id, locs(interaction.locale));

    const locales = {
        'en-GB': 'en',
        'en-US': 'en',
        'es-ES': 'es',
        'pt-BR': 'pt',
        'ko': 'kr',
        'ja': 'jp',
        'ru': "ru",
        'zh-CN': 'chs',
        'zh-TW': 'cht'
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

    const asn = Object.keys(upgrade.promote[1].addProps)[3]
    const asv = upgrade.promote.reduce((p, c) => p + (Object.values(c.addProps ?? {})?.[3] ?? 0), 0)
    const gacha = jsonParse('./data/maps/genshinAvatar.json', {})

    const lup1 = upgrade.promote.map(item => Object.keys(item.costItems ?? {}))
    const tup1 = Object.entries(talent[0].promote[2].costItems).map(([id, amt]) => id)
    const tup2 = Object.entries(talent[0].promote[3].costItems).map(([id, amt]) => id)
    const tup3 = Object.entries(talent[0].promote[7].costItems).map(([id, amt]) => id)


    let reg = /{F#.*?}|{M#|}|#/g
    if (typeof id === "string") {
        if (id.includes("10000007")) {
            reg = /{F#|}|{M#.*?}|#/g
        }
    }

    let file;
    try {
        file = fs.readFileSync('./data/cards/ascend_' + interaction.locale + '_' + id + '.png');
    } catch (ignored) {
    }


    if (file) {
        interaction.editReply({
            content: translate("{0}'s ascension card", interaction.locale).replace('{0}',itemName),
            embeds: [],
            files: [{name: 'card.png', attachment: file}],
            components: []
        });
    } else if (!file) {

//Canvas generation
        {
            const c = C.createCanvas(1620, 1080);
            const ctx = c.getContext('2d');
            const background = await C.loadImage('./data/ascension/bg.png')
            ctx.drawImage(background, 0, 0, c.width, c.height)

            registerFont('./data/fonts/FolkMulti-Bold.ttf', {
                family: 'Folk Multi',
                weight: 'B'
            });
            registerFont('./data/fonts/zh-cn.ttf', {
                family: 'ZHWenHei-85W'
            });

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
                await loadImage((fs.readFileSync('./data/ascension/blend.png')))
                    .then((img) => {
                        ctx.drawImage(img, 0, 0, 1620, 1080, 0, 0, img.width, img.height)
                    })
                await loadImage((fs.readFileSync('./data/ascension/itemsborder.png')))
                    .then((img) => {
                        ctx.drawImage(img, 0, 0, 1620, 1080, 0, 0, img.width, img.height)
                    })
                await loadImage((fs.readFileSync('./data/ascension/Logo_new.png')))
                    .then((img) => {
                        ctx.drawImage(img, 0, 0, 1620, 1080, 0, 900, img.width, img.height)
                    })
                await loadImage((fs.readFileSync('./data/ascension/items.png')))
                    .then((img) => {
                        ctx.drawImage(img, 0, 0, 1620, 1080, 0, 0, img.width, img.height)
                    })

                ctx.shadowColor = "#ffffff";
                ctx.shadowBlur = 0;
                const as1 = Object.entries(ascension).map(([id, amt]) => id)
            }
            // Text Generation
            {
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.font = '50px HYWenHei-85W'
                ctx.shadowColor = "#e25407";
                ctx.shadowBlur = 15;
                ctx.fillStyle = 'white';
                ctx.fillText(translate('{0} Ascension Guide', interaction.locale).replace('{0}', cT(itemName)), 1050, 120)
                ctx.fillText(translate('Ascension / Talent / Mora Cost', interaction.locale), 1050, 190)

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

                //Crystals & boss Mats

                let first = await ambrApi('/material/' + lup1[1]?.[1], locs(interaction.locale));
                let sec = await ambrApi('/material/' + lup1[2]?.[1], locs(interaction.locale));
                let third = await ambrApi('/material/' + lup1[4]?.[1], locs(interaction.locale));
                let fourth = await ambrApi('/material/' + lup1[6]?.[1], locs(interaction.locale));
                let fifth = await ambrApi('/material/' + lup1[6]?.[3], locs(interaction.locale));
                let sixt = await ambrApi('/material/' + tup3[2], locs(interaction.locale));
                let seventh = await ambrApi('/material/' + lup1[6]?.[0], locs(interaction.locale));


                {
                    await loadImage('https://api.ambr.top/assets/UI/' + (first?.icon ? first?.icon : 'UI_Icon_Item_Temp') + '.png')
                        .then((img) => {
                            ctx.drawImage(img,527, 242, 140.8, 140.8)
                        })


                    await loadImage('https://api.ambr.top/assets/UI/' + (sec?.icon ? sec?.icon : 'UI_Icon_Item_Temp') + '.png')
                        .then((img) => {
                            ctx.drawImage(img,704, 242, 140.8, 140.85)
                        })


                    await loadImage('https://api.ambr.top/assets/UI/' + (third?.icon ? third?.icon : 'UI_Icon_Item_Temp') + '.png')
                        .then((img) => {
                            ctx.drawImage(img,874, 242, 140.8, 140.8)
                        })


                    await loadImage('https://api.ambr.top/assets/UI/' + (fourth?.icon ? fourth?.icon : 'UI_Icon_Item_Temp') + '.png')
                        .then((img) => {
                            ctx.drawImage(img, 528, 430, 140.8, 140.8)
                        })
                    //boss drop
                    await loadImage('https://api.ambr.top/assets/UI/' + (fifth?.icon ? fifth?.icon : 'UI_Icon_Item_Temp') + '.png')
                        .then((img) => {
                            ctx.drawImage(img,702, 425, 140.8, 140.8)
                        })

                    // weekly drop
                    await loadImage('https://api.ambr.top/assets/UI/' + (sixt?.icon ? sixt?.icon : 'UI_Icon_Item_Temp') + '.png')
                        .then((img) => {
                            ctx.drawImage(img,1247, 855, 140.8, 140.8)
                        })

                    //regional material
                    await loadImage('https://api.ambr.top/assets/UI/' + (seventh?.icon ? seventh?.icon : 'UI_Icon_Item_Temp') + '.png')
                        .then((img) => {
                            ctx.drawImage(img, 527, 850, 140.8, 140.8)
                        })


                }

                //Talent books
                {
                    const {name:iten} = await ambrApi('/material/' + tup3[0], locs(interaction.locale));
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'bottom';
                    ctx.font = '22px HYWenHei-85W'
                    ctx.shadowColor = "#e25407";
                    ctx.shadowBlur = 15;
                    ctx.fillStyle = 'white';
                    ctx.fillText(cT(iten).toLowerCase().split(' ').pop(), 1319.6, 448)

                    ctx.shadowColor = "#ffffff";
                    ctx.shadowBlur = 0;
                    await loadImage('https://api.ambr.top/assets/UI/UI_ItemIcon_' + tup1[0] + '.png')
                        .then((img) => {
                            ctx.drawImage(img, 0, 0, 256, 256, 1084, 235, img.width * .55, img.height * .55)
                        })
                    await loadImage('https://api.ambr.top/assets/UI/UI_ItemIcon_' + tup2[0] + '.png')
                        .then((img) => {
                            ctx.drawImage(img, 0, 0, 256, 256, 1254, 235, img.width * .55, img.height * .55)
                        })

                    await loadImage('https://api.ambr.top/assets/UI/UI_ItemIcon_' + tup3[0] + '.png')
                        .then((img) => {
                            ctx.drawImage(img, 0, 0, 256, 256, 1424, 235, img.width * .55, img.height * .55)
                        })
                }
                //mob mats row 1
                {
                    await loadImage('https://api.ambr.top/assets/UI/UI_ItemIcon_' + tup1[1] + '.png')
                        .then((img) => {
                            ctx.drawImage(img, 0, 0, 256, 256, 527, 659, img.width * .55, img.height * .55)
                        })
                    await loadImage('https://api.ambr.top/assets/UI/UI_ItemIcon_' + tup2[1] + '.png')
                        .then((img) => {
                            ctx.drawImage(img, 0, 0, 256, 256, 707, 659, img.width * .55, img.height * .55)
                        })

                    await loadImage('https://api.ambr.top/assets/UI/UI_ItemIcon_' + tup3[1] + '.png')
                        .then((img) => {
                            ctx.drawImage(img, 0, 0, 256, 256, 877, 659, img.width * .55, img.height * .55)
                        })
                }

                //mob mats row 2
                {
                    await loadImage('https://api.ambr.top/assets/UI/UI_ItemIcon_' + tup1[1] + '.png')
                        .then((img) => {
                            ctx.drawImage(img, 0, 0, 256, 256, 1077, 659, img.width * .55, img.height * .55)
                        })
                    await loadImage('https://api.ambr.top/assets/UI/UI_ItemIcon_' + tup2[1] + '.png')
                        .then((img) => {
                            ctx.drawImage(img, 0, 0, 256, 256, 1254, 659, img.width * .55, img.height * .55)
                        })

                    await loadImage('https://api.ambr.top/assets/UI/UI_ItemIcon_' + tup3[1] + '.png')
                        .then((img) => {
                            ctx.drawImage(img, 0, 0, 256, 256, 1424, 659, img.width * .55, img.height * .55)
                        })
                }

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
                        ctx.drawImage(img, 0, 0, img.width, img.height, 50, 50, img.width , img.height)
                    })

            }

            const buffer = c.toBuffer('image/png')
            fs.writeFileSync('data/cards/ascend_' + interaction.locale + '_' + id + '.png', buffer)

            interaction.editReply({
                content: translate("{0}'s ascension card", interaction.locale).replace('{0}',itemName),
                embeds: [],
                files: [{name: 'Character_' + itemName +'.png', attachment: buffer}],
                components: []
            });
        }
    }
}

module.exports = {name, description, options, filter, execute};