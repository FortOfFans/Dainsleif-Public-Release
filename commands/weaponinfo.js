const { MessageEmbed, MessageActionRow, MessageSelectMenu, CommandInteractionOptionResolver, Collection, MessageButton} = require('discord.js');
const { getClosest, getUserSettings, jsonParse, translate, untranslate, ambrApi, ambrLocale} = require('../util');
const fs = require('fs');
const PagedEmbed = require('../util/PagedEmbed');
const PagedMessage = require("../util/PagedMessage");

const name = translate('weaponinfo');
const description = translate('Displays a weapon info chart.');
const filter = () => true;
const options = [
    {
        type: 3, //str
        name: translate('name'),
        description: translate('The weapon to search for.'),
        required: false
    }
];

async function execute(interaction, idToSearch) {
    const aliases = jsonParse('./data/aliases/weapon.json', {});
    const query = interaction.options.getString('name') ?? '';

    const {items} = await ambrApi('/weapon', interaction.locale);

    const list = Object.values(items)
        //.filter(i => i.rank === 5 && i.element === 'Wind')
        .filter(i => !i.beta)
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

            const typesname ={
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
        const { message } = await pagedMsg.update();

        const filter = i => interaction.user.id === i.user.id;
        const time = 10 * 60 * 1000
        const collector = message.createMessageComponentCollector({ filter, time });

        collector.on('collect', async i => {
            await i.deferUpdate().catch(() => {});

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

    const { id } = Object.values(items).find(w => w.route === closest) ?? { id: idToSearch };
    const weaponData = await ambrApi('/weapon/' + id, interaction.locale);
    const { rank, name: itemName, description, affix, ascension, icon, upgrade } = weaponData;
    const maxLevel = upgrade.promote[upgrade.promote.length - 1].unlockMaxLevel;

    const btn = new MessageButton()
        .setStyle('LINK')
        .setURL('https://ambr.top/' + ambrLocale(interaction.locale) + '/archive/weapon/' + id)
        .setEmoji('ambr:1127674504198508674');

    const friendlyNames = {
        BASE_ATTACK: translate('Base ATK', interaction.locale),
        ELEMENT_MASTERY: translate('EM', interaction.locale),
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
        ADD_HURT: translate('DMG Bonus', interaction.locale),
        HP_PERCENT: translate('HP', interaction.locale),
        HEAL_ADD: translate('Healing Bonus', interaction.locale),
        HEALED_ADD: translate('Incoming HB', interaction.locale),
        DEFENSE_PERCENT: translate('DEF', interaction.locale)
    }
    const serialisations = jsonParse('./data/loc.json', {});

    function getSerialised(id){
        if (id.toString().startsWith('FIGHT_PROP')){
            const short = id.replace('FIGHT_PROP_', '');

            return friendlyNames[short] ?? short;
        }

        const locales = {
            'en-GB': 'en',
            'en-US': 'en',
            'es-ES': 'es',
            'pt-BR': 'pt'
        }
        const locale = locales[interaction.locale] ?? (serialisations[interaction.locale] ? interaction.locale : 'en');
        const found = serialisations[locale][id];

        return found ?? id.toString();
    }

    const weaponCurve = await ambrApi('/weaponCurve', 'static');
    function calculateLVL() {

        // List
        const lvlList = [];
        const upgradeList = { upgrade: {}, items: null };

        // Base Data
        const { prop, promote } = weaponData.upgrade;
        const rank = promote.length - 1;
        const { unlockMaxLevel, addProps, costItems } = promote[rank];

        if (costItems != undefined) upgradeList.items = costItems;
        let baseLvl = rank == 0 ? 1 : promote[rank - 1].unlockMaxLevel;

        for (let lvl = baseLvl; lvl <= unlockMaxLevel; lvl++) {
            if ((lvl % 5 === 0) == true) lvlList.push(lvl);
        }

        // Cycle fuckery
        prop.forEach((item) => {
            if (item.propType != undefined) {
                upgradeList.upgrade[item.propType] = {};
                const { propType, initValue, type } = item;
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

    function cleanText(text){
        return text
            .replace(/<\/?color(=#[A-F0-9]{8})?>/gi, '**')
            .replace(/\\+n/g, '\n').replace(/·/g, '**•** ')
            .replace(/\{LAYOUT_(\w)+#(\w)+/g, data => data.includes('LAYOUT_PC') ? data.split('#')[1] : '')
            .replace(/\}|#/g, '')
            .replace(/\\"/g, "")
            .replace(/<\/?i>/g, '*')
            .replace(/{NON_BREAK_SPACE/g, '')
    }

    const embed1 = new MessageEmbed()
        .setTitle(cleanText(itemName) + translate(' Lv. {0}', interaction.locale).replace('{0}', maxLevel) )
        .setColor([0, 0xB7BFC6, 0x60BF00, 0x00AFFF, 0xD05CFC, 0xFF9933][rank])
        .setThumbnail('https://api.ambr.top/assets/UI/' + icon + '.png')
        .setFooter(cleanText(description));

    for (const [name, values] of Object.entries(calculateLVL().upgrade)){
        const valueKeys = Object.keys(values);
        const maxLevel = valueKeys[valueKeys.length - 1]
        embed1.addField(getSerialised(name), values[maxLevel].toLocaleString(interaction.locale) + (name.includes('PERCENT') ? '%' : '') + (name.includes('ADD_HURT') ? '%' : '') + (name.includes('CRITICAL') ? '%' : ''), true);
    }

    if (affix) {
        embed1.addField(translate('Rarity', interaction.locale), '<:GenshinStar:1127847008670060544>'.repeat(rank), true)
        const passive = Object.values(affix)[0];
        embed1.addField(passive.name + ' <:R1:1127673428288221234>', cleanText(passive.upgrade['0']), false);
        const keys = Object.keys(passive.upgrade);
        embed1.addField(passive.name + ' <:R5:1127673437993848942>', cleanText(passive.upgrade[keys[keys.length - 1]]), false);
    }


    const materialEmojis = jsonParse('./data/emojis/materialEmojis.json', {});
    const amounts = {
        resin: {},
        common: {},
        elite: {},
        exp: {}
    }
    const materialIds = Object.keys(ascension);
    const lup1 = upgrade.promote.map(item => Object.keys(item.costItems ?? {}))
    const {rank:ranki} = await ambrApi('/material/' + lup1[6]?.[0], interaction.locale);

    if (ranki === 4) {
        if (rank === 5) {
            amounts.exp['104013'] = 907;
            amounts.exp['202'] = 906480 + 225000;

            for (let i = 0; i < 3; i++) amounts.elite[materialIds.shift()] = [23, 27, 41][i];
            for (let i = 0; i < 3; i++) amounts.common[materialIds.shift()] = [15, 23, 27][i];
            for (let i = 0; i < 4; i++) amounts.resin[materialIds.shift()] = [5, 14, 14, 6][i];
        } else if (rank === 4) {
            amounts.exp['104013'] = 605;
            amounts.exp['202'] = 604320 + 150000;

            for (let i = 0; i < 3; i++) amounts.elite[materialIds.shift()] = [15, 18, 27][i];
            for (let i = 0; i < 3; i++) amounts.common[materialIds.shift()] = [10, 15, 18][i];
            for (let i = 0; i < 4; i++) amounts.resin[materialIds.shift()] = [3, 9, 9, 4][i];
        } else if (rank === 3) {
            amounts.exp['104013'] = 399;
            amounts.exp['202'] = 398880 + 105000;

            for (let i = 0; i < 3; i++) amounts.elite[materialIds.shift()] = [10, 12, 18][i];
            for (let i = 0; i < 3; i++) amounts.common[materialIds.shift()] = [6, 10, 12][i];
            for (let i = 0; i < 4; i++) amounts.resin[materialIds.shift()] = [2, 6, 6, 3][i];
        } else if (rank === 2) {
            amounts.exp['104013'] = 108;
            amounts.exp['202'] = 108020 + 35000;

            for (let i = 0; i < 2; i++) amounts.elite[materialIds.shift()] = [6, 8][i];
            for (let i = 0; i < 2; i++) amounts.common[materialIds.shift()] = [5, 7][i];
            for (let i = 0; i < 3; i++) amounts.resin[materialIds.shift()] = [1, 4, 1][i];
        } else if (rank === 1) {
            amounts.exp['104013'] = 72;
            amounts.exp['202'] = 72040 + 20000;

            for (let i = 0; i < 2; i++) amounts.elite[materialIds.shift()] = [5, 6][i];
            for (let i = 0; i < 2; i++) amounts.common[materialIds.shift()] = [3, 5][i];
            for (let i = 0; i < 3; i++) amounts.resin[materialIds.shift()] = [1, 3, 1][i];
        }
    }
    else {
        if (rank === 5) {
            amounts.exp['104013'] = 907;
            amounts.exp['202'] = 906480 + 225000;

            for (let i = 0; i < 3; i++) amounts.common[materialIds.shift()] = [15, 23, 27][i];
            for (let i = 0; i < 3; i++) amounts.elite[materialIds.shift()] = [23, 27, 41][i];
            for (let i = 0; i < 4; i++) amounts.resin[materialIds.shift()] = [5, 14, 14, 6][i];
        } else if (rank === 4) {
            amounts.exp['104013'] = 605;
            amounts.exp['202'] = 604320 + 150000;

            for (let i = 0; i < 3; i++) amounts.common[materialIds.shift()] = [10, 15, 18][i];
            for (let i = 0; i < 3; i++) amounts.elite[materialIds.shift()] = [15, 18, 27][i];
            for (let i = 0; i < 4; i++) amounts.resin[materialIds.shift()] = [3, 9, 9, 4][i];
        } else if (rank === 3) {
            amounts.exp['104013'] = 399;
            amounts.exp['202'] = 398880 + 105000;

            for (let i = 0; i < 3; i++) amounts.common[materialIds.shift()] = [6, 10, 12][i];
            for (let i = 0; i < 3; i++) amounts.elite[materialIds.shift()] = [10, 12, 18][i];
            for (let i = 0; i < 4; i++) amounts.resin[materialIds.shift()] = [2, 6, 6, 3][i];
        } else if (rank === 2) {
            amounts.exp['104013'] = 108;
            amounts.exp['202'] = 108020 + 35000;

            for (let i = 0; i < 2; i++) amounts.common[materialIds.shift()] = [5, 7][i];
            for (let i = 0; i < 2; i++) amounts.elite[materialIds.shift()] = [6, 8][i];
            for (let i = 0; i < 3; i++) amounts.resin[materialIds.shift()] = [1, 4, 1][i];
        } else if (rank === 1) {
            amounts.exp['104013'] = 72;
            amounts.exp['202'] = 72040 + 20000;

            for (let i = 0; i < 2; i++) amounts.common[materialIds.shift()] = [3, 5][i];
            for (let i = 0; i < 2; i++) amounts.elite[materialIds.shift()] = [5, 6][i];
            for (let i = 0; i < 3; i++) amounts.resin[materialIds.shift()] = [1, 3, 1][i];
        }
    }

    const names = {};
    const materials = await ambrApi('/material', interaction.locale);
    for (const id of Object.keys(ascension)) names[id] = materials.items[id].route

    const embed2 = new MessageEmbed()
        .setAuthor( { name: cleanText(itemName) , iconURL: 'https://api.ambr.top/assets/UI/' + icon + '.png'})
        .setColor(embed1.color)
        .addField(translate('Mora/EXP', interaction.locale), Object.entries(amounts.exp)
            .map(([k, v]) => (materialEmojis[k] || '<:UI_ItemIcon_QUESTION:997149126032638022>') + ' **' + v.toLocaleString(interaction.locale) + '**').join(' '), false)
        .addField(translate('Domains', interaction.locale), Object.entries(amounts.resin).reverse()
            .map(([k, v]) => (materialEmojis[k] || '<:UI_ItemIcon_QUESTION:997149126032638022>') + ' **' + v.toLocaleString(interaction.locale) + '**x ' + names[k]).join('\n'), false)
        .addField(translate('Common', interaction.locale), Object.entries(amounts.common).reverse()
            .map(([k, v]) => (materialEmojis[k] || '<:UI_ItemIcon_QUESTION:997149126032638022>') + ' **' + v.toLocaleString(interaction.locale) + '**x ' + names[k]).join('\n'), false)
        .addField(translate('Elite', interaction.locale), Object.entries(amounts.elite).reverse()
            .map(([k, v]) => (materialEmojis[k] || '<:UI_ItemIcon_QUESTION:997149126032638022>') + ' **' + v.toLocaleString(interaction.locale) + '**x ' + names[k]).join('\n'), false)
        .setFooter({ text: translate('Upgrade materials', interaction.locale) });

    const pages = [embed1, embed2];

    const pagedMsg = new PagedMessage(interaction, pages.map(embed => ({ embeds: [embed] })));
    pagedMsg.actionRow.addComponents(btn);
    return pagedMsg.update();
}

module.exports = { name, description, options, filter, execute };