const { MessageEmbed, MessageActionRow, MessageSelectMenu, CommandInteractionOptionResolver, Collection, MessageButton} = require('discord.js');
const { getClosest, getUserSettings, jsonParse, translate, untranslate, ambrApi } = require('../util');
const fs = require('fs');
const PagedEmbed = require('../util/PagedEmbed');
const PagedMessage = require("../util/PagedMessage");
const axios = require('axios');

const name = translate('sheets');
const description = translate('Displays a character cheat sheet.');
const filter = () => true;
const options = [
    {
        type: 3, //str
        name: translate('name'),
        description: translate('The character to search for.'),
        required: false
    }
];

async function execute(interaction){

    const { data } = await axios.get('https://discord.com/api/v8/applications/'+ interaction.client.user.id +'/commands', {headers: {Authorization: 'Bot ' + interaction.client.token}})

    const basePath = './data/guides/character';
    let dirPath = basePath + '/' + interaction.locale;
    if (!fs.existsSync(dirPath)) dirPath = basePath + '/en-GB';
    const enPath = basePath + '/en-GB';

    const aliases = jsonParse('./data/aliases/character.json', {});
    const query = interaction.options.getString('name') ?? '';


    const lols = fs.readdirSync(enPath).map(f => f.split('.')[0])
    const closest = getClosest((aliases[query] ?? query), fs.readdirSync(enPath).map(f => f.split('.')[0]));

    if (!closest || !query){
        const emojiMap = jsonParse('./data/emojis/characterEmojis.json', {});
        let list = [];
        for (const name of Object.keys(emojiMap)){
            if (name?.startsWith('Traveler')) continue
            const itemName = name;
            list.push(itemName);
        }
        list = list.sort();

        const listEmbed = new MessageEmbed()
            .setColor(getUserSettings(interaction.user.id).color)
            // .setDescription('## Characters released after Genshin v4.0 will not receive a Character Sheet!\n\n\n__**Summary as to why it is not feasible to maintain Genshin cheat sheets**__:\n • Unlike many in the Genshin community I got a life outside my room <:kek:1126792950802829338> \n • We have ~72 different characters in the game, which many of them have multiple playstyles/roles and therefore require multiple build sheets.\n • Frequent release of universal &/ overpowered artifact sets / weapons &/ support characters requiring many reworks of otherwise well made cheat sheets.\n • Sun got a working laptop again, that means most of his free time is spent in valorant not doing some cheat sheets. More info in my legendary rant: https://discord.com/channels/703074062024441887/1126839469899784212/1156563149357584416\n\nPlease select a different character to view their guide.');
            .setDescription('Select Your Character!');

        const pages = [];
        const pageSize = 25;

        for (let i = 0; i <= list.length; i += pageSize){
            const embed = listEmbed;
            const row = new MessageActionRow();
            const selectMenu = new MessageSelectMenu()
                .setCustomId('itemselect');

            const options = list.slice(i, i + pageSize)
                .map(item => ({ value: item, label: item, emoji: emojiMap[item] }));
            selectMenu.addOptions(options);
            row.addComponents(selectMenu);

            pages.push({ embeds: [embed], components: [row] });
        }

        const pagedMsg = new PagedMessage(interaction, pages);
        const { message } = await pagedMsg.update();

        const filter = i => interaction.user.id === i.user.id;
        const time = 10 * 60 * 1000;
        const collector = message?.createMessageComponentCollector({ filter, time });

        collector?.on('collect', async i => {
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

        collector?.on('end', () => interaction.editReply({ components: [] }));
        return null;
    }

    const {items} = await ambrApi('/avatar', 'en-GB');
    const {id} = Object.values(items).find(w => w.route.includes(closest));

    const {name: itemName, icon, fetter: {detail, constellation, title}, element, rank, weaponType} = await ambrApi('/avatar/' + id, 'en-GB');

    const data2 = jsonParse(dirPath + '/' + closest + '.json',
        jsonParse(basePath + '/en-GB/' + closest + '.json', []));

    const newarning = new MessageEmbed()
        .setAuthor({
            name: closest?.replace(' Boy', '') + ' - Cheat Sheet',
            iconURL: 'https://api.ambr.top/assets/UI/' + icon + '.png'})
        .setDescription('The usage of the sheet command has changed, unfortunately I am forced to do this change as discord has some weird caching system for images received from direct links.', true)
        .setColor('#f42069')

    const row = new MessageActionRow();

    if (data2[0]?.desc) newarning.addField('Info', data2[0]?.desc, false)
    if (data2[0]?.role1){
        const btn = new MessageButton()
            .setURL('https://raw.githubusercontent.com/FortOfFans/GI/main/sheets/' + (closest.includes('Traveler') ? closest?.split(' ')[1] + '_' + closest?.split(' ')[0]: closest?.replaceAll(' ', '%20')) + '_' + data2[0]?.role1?.replaceAll(' ', '%20') + '.jpg')
            .setLabel(data2[0]?.role1?.replace(/_/gi, ' '))
            .setStyle('LINK');
        row.addComponents(btn);
    }
    if (data2[0]?.role2){
        const btn = new MessageButton()
            .setURL('https://raw.githubusercontent.com/FortOfFans/GI/main/sheets/' + (closest.includes('Traveler') ? closest?.split(' ')[1] + '_' + closest?.split(' ')[0]: closest?.replaceAll(' ', '%20')) + '_' + data2[0]?.role2?.replaceAll(' ', '%20') + '.jpg')
            .setLabel(data2[0]?.role2?.replace(/_/gi, ' '))
            .setStyle('LINK');
        row.addComponents(btn);
    }
    if (data2[0]?.role3){
        const btn = new MessageButton()
            .setURL('https://raw.githubusercontent.com/FortOfFans/GI/main/sheets/' + (closest.includes('Traveler') ? closest?.split(' ')[1] + '_' + closest?.split(' ')[0]: closest?.replaceAll(' ', '%20')) + '_' + data2[0]?.role3?.replaceAll(' ', '%20') + '.jpg')
            .setLabel(data2[0]?.role3?.replace(/_/gi, ' '))
            .setStyle('LINK');
        row.addComponents(btn);
    }
    if (data2[0]?.video){
        const btn = new MessageButton()
            .setURL(data2[0]?.video)
            .setLabel('Build Video')
            .setStyle('LINK');
        row.addComponents(btn);
    }
    if (data2[0]?.rotation){
        const btn = new MessageButton()
            .setURL(data2[0]?.rotation)
            .setLabel('Rotation Video')
            .setStyle('LINK');
        row.addComponents(btn);
    }

    const pagedMsg = new PagedMessage(interaction, [{
        embeds: [newarning],
        components: [row]
    }]);
    if (pagedMsg.actionRow?.components?.length > 5) pagedMsg.actionRow.components.pop();
    pagedMsg.actionRow?.addComponents(btn);
    return pagedMsg.update();
}

module.exports = { name, description, options, filter, execute };