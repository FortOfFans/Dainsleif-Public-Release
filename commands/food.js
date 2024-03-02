const {MessageEmbed, MessageActionRow, MessageSelectMenu, CommandInteractionOptionResolver, Collection, MessageButton} = require('discord.js');
const {getClosest, getUserSettings, jsonParse, translate, untranslate, ambrApi, ambrLocale} = require('../util');
const fs = require('fs');
const PagedEmbed = require('../util/PagedEmbed');
const PagedMessage = require("../util/PagedMessage");

const name = translate('food');
const description = translate('Displays a recipe and its ingredients.');
const filter = () => true;
const options = [
    {
        type: 3, //str
        name: translate('name'),
        description: translate('The recipe to search for.'),
        required: false
    }
];

async function execute(interaction, idToSearch) {
    const aliases = jsonParse('./data/aliases/recipe.json', {});
    const query = interaction.options.getString('name') ?? '';

    const {items} = await ambrApi('/food', interaction.locale);

    const list = Object.values(items)
        .filter(i => i.type === 'food' && i.recipe === true)
        .filter(i => i.beta !== true)
        .map(w => w.name)
        .sort();
    const closest = getClosest((aliases[query] ?? query), list);

    if (!idToSearch && (!closest || !query)) {
        const emojiMap = jsonParse('./data/emojis/materialEmojis.json', {});

        const listEmbed = new MessageEmbed()
            .setColor(getUserSettings(interaction.user.id).color)
            .setDescription(translate('Please select a recipe to view its ingredients.', interaction.locale));

        const pages = [];
        const pageSize = 25;

        for (let i = 0; i <= list.length; i += pageSize) {
            const embed = listEmbed;
            const row = new MessageActionRow();
            const selectMenu = new MessageSelectMenu()
                .setCustomId('itemselect');

            const typesname = {
                Recovery: translate('Recovery Dish', interaction.locale),
                Atk: translate('ATK-Boosting Dish', interaction.locale),
                Other: translate('Adventurer\'s Dish', interaction.locale),
                Def: translate('DEF-Boosting Dish', interaction.locale)
            }

            const options = list.slice(i, i + pageSize)
                .map(item => ({
                    value: item.replace(/\\"/g, '"'),
                    label: item.replace(/\\"/g, '"'),
                    description: ' ' + Object.values(items).find(i => i.route === item)?.rank + '-Star ' + typesname[Object.values(items).find(i => i.route === item)?.effectIcon.split('_')[3]] ?? effectIcon + ' Recipe',
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

    const {id} = Object.values(items).find(w => w.name === closest) ?? {id: idToSearch};
    const materialEmoji = jsonParse('./data/emojis/materialEmojis.json');
    const {
        name: itemName,
        description,
        recipe: {effect, effectIcon, input},
        rank,
        icon
    } = await ambrApi('/food/' + id, interaction.locale);

    const friendlyNames = {
        Recovery: translate('Recovery Dish', interaction.locale),
        Atk: translate('ATK-Boosting Dish', interaction.locale),
        Other: translate('Adventurer\'s Dish', interaction.locale),
        Def: translate('DEF-Boosting Dish', interaction.locale)
    }

    function cleanText(text) {
        return text
            .replace(/<\/?color(=#[A-F0-9]{8})?>/gi, '**')
            .replace(/\\+n/g, '\n').replace(/·/g, '**•** ')
            .replace(/\{LAYOUT_(\w)+#(\w)+/g, data => data.includes('LAYOUT_PC') ? data.split('#')[1] : '')
            .replace(/\}|#/g, '')
            .replace(/\\"/g, "")
            //.replace(/["']/g, "")
            .replace(/<\/?i>/g, '*')
            .replace(/{NON_BREAK_SPACE/g, '')
    }

    const embed = new MessageEmbed()
        .setAuthor({name: cleanText(itemName), iconURL: 'https://api.ambr.top/assets/UI/' + effectIcon + '.png'})
        .setColor([0, 0xB7BFC6, 0x60BF00, 0x00AFFF, 0xD05CFC, 0xFF9933][rank])
        .setDescription(description)
        .addField(translate('Ingredients', interaction.locale), Object.values(input).map(i => materialEmoji[i?.icon.replace('UI_ItemIcon_', '')] + ' **' + i?.count + '**').join(' '), true)
        .addField('Rarity', '[' + '<:GenshinStar:1127847008670060544>'.repeat(rank) + ']', true)
        .addField(translate('Effect', interaction.locale), Object.values(effect).map(e => e.replace(/<\/?color(=#[A-F0-9]{8})?>/gi, '**')).join('\n'))
        .setThumbnail('https://api.ambr.top/assets/UI/' + icon + '.png')
        .setFooter({text: friendlyNames[effectIcon.split('_')[3]] ?? effectIcon});

    const locale = ambrLocale(interaction.locale);

    const row = new MessageActionRow();
    const btn = new MessageButton()
        .setStyle('LINK')
        .setURL('https://ambr.top/' + locale + '/archive/food/' + id)
        .setEmoji('ambr:1127674504198508674');
    row.addComponents(btn);

    return interaction.editReply({embeds: [embed], components: [row]});
}

module.exports = {name, description, options, filter, execute};