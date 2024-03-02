const {MessageEmbed, MessageActionRow, MessageSelectMenu, CommandInteractionOptionResolver, Collection, MessageButton} = require('discord.js');
const {getClosest, getUserSettings, jsonParse, translate, untranslate, ambrApi, ambrLocale} = require('../util');
const fs = require('fs');
const PagedEmbed = require('../util/PagedEmbed');
const PagedMessage = require("../util/PagedMessage");

const name = translate('characterinfo');
const description = translate('Displays a character\'s info.');
const filter = () => true;const options = [
    {
        type: 3, //str
        name: translate('name'),
        description: translate('The character to search for.'),
        required: false
    }
];

async function execute(interaction, idToSearch) {
    const aliases = jsonParse('./data/aliases/character.json', {});
    const query = interaction.options.getString('name') ?? '';

    const {items} = await ambrApi('/avatar', interaction.locale);

    const list = Object.values(items)
        .filter(i => !i.beta)
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

            const typesname ={
                Electric: 'Electro',
                Fire: 'Pyro',
                Grass: 'Dendro',
                Ice:'Cryo',
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

    function cT(text) {
        return text
            .replace(/<\/?color(=#?[A-F0-9]{8})?>/gi, '**')
            .replace(/\\+n/g, '\n').replace(/·/g, '**•** ')
            .replace(/\\+n/g, '\n').replace(/·/g, '**•** ')
            .replace(/\{LAYOUT_(\w)+#(\w)+/g, data => data.includes('LAYOUT_PC') ? data.split('#')[1] : '')
            .replace(/\}|#/g, '')
            .replace(/ß{3,}/gi, '')
            .replace(/<\/?i>/g, '*')
            .replace(/{NON_BREAK_SPACE/g, '')

    }

    const {id} = Object.values(items).find(w => w.route === closest) ?? { id: idToSearch };

    const elementEmoji = jsonParse('./data/emojis/elementEmojis.json');
    const lengths = {en: 17, de: 31, es: 36, pt: 29, kr: 13, jp: 9, chs: 7, cht: 7, ru: 14};
    const {ascension, name: itemName, fetter: {detail, constellation, title}, element, rank, icon, effectIcon, upgrade, talent, promote: up, constellation: charConstellation, other, release} = await ambrApi('/avatar/' + id, interaction.locale);
    const {cost, cooldown} = await ambrApi('/avatar/' + id, interaction.locale);

    const materialIds = Object.keys(ascension)

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

    const statEmojis = jsonParse('./data/emojis/statEmojis.json', {});
    const matsEmoji = jsonParse('./data/emojis/materialEmojis.json', {});
    const astat = Object.values(upgrade.promote[1].addProps)[3]
    const asn = Object.keys(upgrade.promote[1].addProps)[3]
    const asv = upgrade.promote.reduce((p, c) => p + (Object.values(c.addProps ?? {})?.[3] ?? 0), 0)

    const as1 = Object.entries(upgrade.promote[1].costItems).map(([id, amt]) => (matsEmoji[id] || '<:UI_ItemIcon_QUESTION:997149126032638022>') + ' **' + amt + '**  ').join(' ')
    const as2 = Object.entries(upgrade.promote[2].costItems).map(([id, amt]) => (matsEmoji[id] || '<:UI_ItemIcon_QUESTION:997149126032638022>') + ' **' + amt + '**  ').join(' ')
    const as3 = Object.entries(upgrade.promote[3].costItems).map(([id, amt]) => (matsEmoji[id] || '<:UI_ItemIcon_QUESTION:997149126032638022>') + ' **' + amt + '**  ').join(' ')
    const as4 = Object.entries(upgrade.promote[4].costItems).map(([id, amt]) => (matsEmoji[id] || '<:UI_ItemIcon_QUESTION:997149126032638022>') + ' **' + amt + '**  ').join(' ')
    const as5 = Object.entries(upgrade.promote[5].costItems).map(([id, amt]) => (matsEmoji[id] || '<:UI_ItemIcon_QUESTION:997149126032638022>') + ' **' + amt + '**  ').join(' ')
    const as6 = Object.entries(upgrade.promote[6].costItems).map(([id, amt]) => (matsEmoji[id] || '<:UI_ItemIcon_QUESTION:997149126032638022>') + ' **' + amt + '**  ').join(' ')

    const tu = Object.entries(talent[0].promote[2].costItems)

    const tu1 = Object.entries(talent[0].promote[2].costItems).map(([id, amt]) => (matsEmoji[id] || '<:UI_ItemIcon_QUESTION:997149126032638022>') + ' **' + amt + '**  ').join(' ')
    const tu2 = Object.entries(talent[0].promote[3].costItems).map(([id, amt]) => (matsEmoji[id] || '<:UI_ItemIcon_QUESTION:997149126032638022>') + ' **' + amt + '**  ').join(' ')
    const tu3 = Object.entries(talent[0].promote[4].costItems).map(([id, amt]) => (matsEmoji[id] || '<:UI_ItemIcon_QUESTION:997149126032638022>') + ' **' + amt + '**  ').join(' ')
    const tu4 = Object.entries(talent[0].promote[5].costItems).map(([id, amt]) => (matsEmoji[id] || '<:UI_ItemIcon_QUESTION:997149126032638022>') + ' **' + amt + '**  ').join(' ')
    const tu5 = Object.entries(talent[0].promote[6].costItems).map(([id, amt]) => (matsEmoji[id] || '<:UI_ItemIcon_QUESTION:997149126032638022>') + ' **' + amt + '**  ').join(' ')
    const tu6 = Object.entries(talent[0].promote[7].costItems).map(([id, amt]) => (matsEmoji[id] || '<:UI_ItemIcon_QUESTION:997149126032638022>') + ' **' + amt + '**  ').join(' ')
    const tu7 = Object.entries(talent[0].promote[8].costItems).map(([id, amt]) => (matsEmoji[id] || '<:UI_ItemIcon_QUESTION:997149126032638022>') + ' **' + amt + '**  ').join(' ')
    const tu8 = Object.entries(talent[0].promote[9].costItems).map(([id, amt]) => (matsEmoji[id] || '<:UI_ItemIcon_QUESTION:997149126032638022>') + ' **' + amt + '**  ').join(' ')
    const tu9 = Object.entries(talent[0].promote[10].costItems).map(([id, amt]) => (matsEmoji[id] || '<:UI_ItemIcon_QUESTION:997149126032638022>') + ' **' + amt + '**  ').join(' ')

    let reg = /{F#.*?}|{M#|}|#/g
    if (typeof id === "string") {
        if (id.includes("10000007")) {
            reg = /{F#|}|{M#.*?}|#/g
        }
    }
    const embed1 = new MessageEmbed()
        .setTitle(itemName + ' ' + elementEmoji[element])
        .setColor([0, 0xB7BFC6, 0x60BF00, 0x00AFFF, 0xD05CFC, 0xFF9933][rank])
        .setDescription(translate('Release: ', interaction.locale) + '<t:' + release + ':F>')
        .addField(title || translate('Traveler', interaction.locale), detail.replace(reg, ''))
        .addField("Ascension Stat", statEmojis[asn] + " " + '__' + fNc[asn] + '__' + ': **' + (Math.round((asv * 100 / 3) * 10) / 10).toString() + '**%', true)
        .addField(translate('Rarity', interaction.locale), '<:GenshinStar:1127847008670060544>'.repeat(rank), true)
        .setThumbnail('https://api.ambr.top/assets/UI/' + icon + '.png')
        .setFooter({
            text: translate('{0}\'s General info', interaction.locale).replace('{0}', cT(itemName)),
            iconURL: 'https://api.ambr.top/assets/UI/' + icon + '.png'});

    if (['FIGHT_PROP_ELEMENT_MASTERY'].includes((Object.keys(upgrade.promote[1].addProps)[3]))) embed1.spliceFields(1, 1, {
        name: 'Ascension Stat',
        value: statEmojis[asn] + " " + '__' + fNc[asn] + '__' + ': **' + (Math.round(asv / 3).toString() + '**'),
    inline: true});

    if (other) {embed1.addField(other.nameCard.name, cT(other.nameCard.description.substr(lengths[ambrLocale(interaction.locale)])), false).setImage('https://api.ambr.top/assets/UI/namecard/' + (other.nameCard.icon).replace(/Icon/gi, "Pic") + '_P.png'), false}

    if (!other) {embed1.setImage('https://api.ambr.top/assets/UI/namecard/UI_NameCardPic_0_P.png')};

    const matiEmojis = jsonParse('./data/emojis/materialEmojis.json', {});
    const names = {};
    const materials = await ambrApi('/material', interaction.locale);
    for (const id of Object.keys(ascension)) names[id] = materials.items[id].route

    const embed2 = new MessageEmbed()
        .setTitle(translate('{0}\'s Ascension Materials', interaction.locale).replace('{0}', cT(itemName)))
        .addField(translate('Ascension Stage I', interaction.locale), as1, false)
        .addField(translate('Ascension Stage II', interaction.locale), as2, false)
        .addField(translate('Ascension Stage III', interaction.locale), as3, false)
        .addField(translate('Ascension Stage IV', interaction.locale), as4, false)
        .addField(translate('Ascension Stage V', interaction.locale), as5, false)
        .addField(translate('Ascension Stage VI', interaction.locale), as6, false)
        .addField('Material Overview', Object.entries(ascension).map(([k, v]) => (matiEmojis[k] || '<:UI_ItemIcon_QUESTION:997149126032638022>')+ ' **' + names[k] + '**').join('\n'), false)
        .setColor([0, 0xB7BFC6, 0x60BF00, 0x00AFFF, 0xD05CFC, 0xFF9933][rank])
        .setThumbnail('https://api.ambr.top/assets/UI/' + icon + '.png')
        .setFooter({text: translate('{0}\'s Ascension Materials', interaction.locale).replace('{0}', cT(itemName))});

    const embed3 = new MessageEmbed()
        .setTitle(translate('{0}\'s Talent Upgrade Materials', interaction.locale).replace('{0}', cT(itemName)))
        .addField(translate('Talent level 2', interaction.locale), tu1, true)
        .addField(translate('Talent level 3', interaction.locale), tu2, true)
        .addField(translate('Talent level 4', interaction.locale), tu3, true)
        .addField(translate('Talent level 5', interaction.locale), tu4, true)
        .addField(translate('Talent level 6', interaction.locale), tu5, true)
        .addField(translate('Talent level 7', interaction.locale), tu6, true)
        .addField(translate('Talent level 8', interaction.locale), tu7, true)
        .addField(translate('Talent level 9', interaction.locale), tu8, true)
        .addField(translate('Talent level 10', interaction.locale), tu9, true)
        .setColor([0, 0xB7BFC6, 0x60BF00, 0x00AFFF, 0xD05CFC, 0xFF9933][rank])
        .setThumbnail('https://api.ambr.top/assets/UI/' + icon + '.png')
        .setFooter({text:translate('{0}\'s Talent Upgrade Materials', interaction.locale).replace('{0}', cT(itemName))});

    const embed4 = new MessageEmbed()
        .setTitle(translate('{0}\'s Constellations', interaction.locale).replace('{0}', cT(itemName)))
        .setColor([0, 0xB7BFC6, 0x60BF00, 0x00AFFF, 0xD05CFC, 0xFF9933][rank])
        .addField(cT(charConstellation[0].name) + ' (C1)', cT(charConstellation[0].description))
        .addField(cT(charConstellation[1].name) + ' (C2)', cT(charConstellation[1].description))
        .addField(cT(charConstellation[2].name) + ' (C3)', cT(charConstellation[2].description))
        .addField(cT(charConstellation[3].name) + ' (C4)', cT(charConstellation[3].description))
        .addField(cT(charConstellation[4].name) + ' (C5)', cT(charConstellation[4].description))
        .addField(cT(charConstellation[5].name) + ' (C6)', cT(charConstellation[5].description))
        .setThumbnail('https://api.ambr.top/assets/UI/' + icon + '.png')
        .setFooter({
            text: translate('{0}\'s Constellations', interaction.locale).replace('{0}', cT(itemName)),
            iconURL: 'https://api.ambr.top/assets/UI/' + charConstellation[0].icon + '.png'
        });

    const embed5 = new MessageEmbed()
        .setTitle(cT(talent[0].name))
        .setDescription(cT(talent[0].description))
        .setThumbnail('https://api.ambr.top/assets/UI/' + talent[0].icon + '.png')
        .setFooter({
            text: translate('Normal Attack', interaction.locale),
            iconURL: 'https://api.ambr.top/assets/UI/' + talent[0].icon + '.png'
        });


    const embed6 = new MessageEmbed()
        .setTitle(translate('Elemental Skill: ', interaction.locale) + cT(talent[1].name))
        .setDescription(cT(talent[1].description))
        .addField('===========================', '__** **__', false)
        .addField(translate('Cooldown', interaction.locale), talent[1]?.cooldown.toLocaleString(interaction.locale), true)
        .setThumbnail('https://api.ambr.top/assets/UI/' + talent[1].icon + '.png')
        .setFooter({
            text: translate('Elemental Skill', interaction.locale),
            iconURL: 'https://api.ambr.top/assets/UI/' + talent[1].icon + '.png'
        });

    const embed7 = new MessageEmbed()
        .setTitle(translate('Elemental Burst: ', interaction.locale) + cT(talent[[10000002, 10000041].includes(id) ? 2 : 3].name))
        .setDescription(cT(talent[[10000002, 10000041].includes(id) ? 2 : 3].description))
        .addField('===========================', '__** **__', false)
        .addField(translate('Cooldown', interaction.locale), talent[[10000002, 10000041].includes(id) ? 2 : 3]?.cooldown.toLocaleString(interaction.locale), true)
        .addField(translate('Energy Cost', interaction.locale), talent[[10000002, 10000041].includes(id) ? 2 : 3]?.cost.toLocaleString(interaction.locale), true)
        .setThumbnail('https://api.ambr.top/assets/UI/' + talent[[10000002, 10000041].includes(id) ? 2 : 3].icon + '.png')
        .setFooter({
            text: translate('Elemental Burst', interaction.locale),
            iconURL: 'https://api.ambr.top/assets/UI/' + talent[[10000002, 10000041].includes(id) ? 2 : 3].icon + '.png'
        });

    const embed8 = new MessageEmbed()
        .setTitle(translate('{0}\'s Passive Talents', interaction.locale).replace('{0}', cT(itemName)))
        .addField(cT(talent[4].name), cT(talent[4].description))
        .addField(cT(talent[5].name), cT(talent[5].description))
        .setThumbnail('https://api.ambr.top/assets/UI/' + talent[4].icon + '.png')
        .setFooter({
            text: translate('{0}\'s Passive Talents', interaction.locale).replace('{0}', cT(itemName)),
            iconURL: 'https://api.ambr.top/assets/UI/' + talent[4].icon + '.png'
        });

    if (talent[6])
        embed8.addField(talent[[10000052].includes(id) ? 8 : 6].name, cT(talent[id === 10000052 ? 8 : 6].description))


    const locale = ambrLocale(interaction.locale);

    const row = new MessageActionRow();
    const btn = new MessageButton()
        .setStyle('LINK')
        .setURL('https://ambr.top/' + locale + '/archive/avatar/' + id)
        .setEmoji('ambr:1127674504198508674');
    row.addComponents(btn);


    const pages = [embed1, embed2, embed3, embed4, embed5, embed6, embed7, embed8];
    if (other?.specialFood) {
        const materialEmoji = jsonParse('./data/emojis/materialEmojis.json', {});
        const fNf = {
            Recovery: translate('Recovery Dish', interaction.locale),
            Atk: translate('ATK-Boosting Dish', interaction.locale),
            Other: translate('Adventurer\'s Dish', interaction.locale),
            Def: translate('DEF-Boosting Dish', interaction.locale)
        }
        const {name: itemName, description, recipe: {effect, effectIcon, input}, rank, icon} = await ambrApi('/food/' + other?.specialFood?.id, interaction.locale);
        const embed9 = new MessageEmbed()
            .setAuthor({
                name: cT(itemName),
                iconURL: 'https://res.cloudinary.com/genshin/image/upload/v1/sprites/' + effectIcon + '.png'
            })
            .setColor([0, 0xB7BFC6, 0x60BF00, 0x00AFFF, 0xD05CFC, 0xFF9933][rank])
            .setDescription(description)
            .addField(translate('Ingredients', interaction.locale), Object.entries(input).map(([id, {count}]) => materialEmoji[id] + ' **' + count + '**').join(' '), true)
            .addField('Rarity', '[' + '<:GenshinStar:1127847008670060544>'.repeat(rank) + ']', true)
            //.addField(translate('Effect', interaction.locale), Object.values(effect).map(e => e?.replace?.(/<\/?color(=#[A-F0-9]{8})?>/gi, '**')).join('\n'))
            .setThumbnail('https://api.ambr.top/assets/UI/' + icon + '.png')
            .setFooter({
                text: fNf[effectIcon.split('_')[3]] ?? effectIcon,
                iconURL: 'https://res.cloudinary.com/genshin/image/upload/v1/sprites/' + effectIcon + '.png'
            })
        pages.push(embed9);
    }

    const pagedMsg = new PagedMessage(interaction, pages.map((pg, i, arr) => ({
        ...pg,
        footer: {
            text: (pg.footer?.text ? pg.footer.text + ' • ' : '') + translate('Page {0} of {0}', interaction.locale).replace('{0}', (i + 1)).replace('{0}', arr.length),
            iconURL: pg.footer?.iconURL ?? undefined
        }
    })).map(embed => ({embeds: [embed]})));
    pagedMsg.actionRow.addComponents(btn);
    return pagedMsg.update();
}

module.exports = {name, description, options, filter, execute};