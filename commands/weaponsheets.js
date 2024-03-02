const { MessageEmbed, MessageActionRow, MessageSelectMenu, CommandInteractionOptionResolver, Collection, MessageButton} = require('discord.js');
const { getClosest, getUserSettings, jsonParse, translate, untranslate } = require('../util');
const fs = require('fs');
const PagedEmbed = require('../util/PagedEmbed');
const PagedMessage = require("../util/PagedMessage");

const name = translate('weaponusage');
const description = translate('Displays a weapon\'s recommended usage.');
const filter = () => true;
const options = [
    {
        type: 3, //str
        name: translate('name'),
        description: translate('The weapon to search for.'),
        required: false
    }
];
async function execute(interaction){
    const basePath = './data/guides/weapon';
    let dirPath = basePath + '/' + interaction.locale;
    if (!fs.existsSync(dirPath)) dirPath = basePath + '/en-GB';
    const enPath = basePath + '/en-GB';

    const aliases = jsonParse('./data/aliases/weapon.json', {});
    const query = untranslate(interaction.options.getString('name') ?? '', interaction.locale);

    const closest = getClosest((aliases[query] ?? query), fs.readdirSync(enPath).map(f => f.split('.')[0]));

    if (!closest || !query){
        const emojiMap = jsonParse('./data/emojis/weaponEmojis.json', {});
        let list = [];
        for (const name of Object.keys(emojiMap)){
            const itemName = name;
            list.push(itemName);
        }
        list = list.sort();

        const listEmbed = new MessageEmbed()
            .setColor(getUserSettings(interaction.user.id).color)
            .setDescription(translate('Please select a weapon to view its guide.', interaction.locale));
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
    const gitUrl = 'https://raw.githubusercontent.com/FortOfFans/GI/main/Weapons/'

    const wi = jsonParse('./data/maps/weapons.json')
    const data = jsonParse(dirPath + '/' + untranslate(closest, interaction.locale) + '.json',
        jsonParse(basePath + '/en-GB/' + untranslate(closest, interaction.locale) + '.json', []))
        .map((pg, i, arr) => Object({
            ...pg,
            title: untranslate(closest, interaction.locale),
            thumbnail: {url: 'https://api.ambr.top/assets/UI/UI_EquipIcon_' + wi[untranslate(closest, interaction.locale)] + '.png'},
            color: (getUserSettings(interaction.user.id).color),
            footer: {
                //pg.footer.text
                text: translate('Page {0} of {0}', interaction.locale)
                    .replace('{0}', i + 1)
                    .replace('{0}', arr.length)
            }
        }));

    const ce = jsonParse('./data/emojis/characterEmojis.json', [])
    const rows = [];
    const rec = data[data.length - 1].fields[0].value
        .split('\n')
        .map(c => c.split(' (')[0]);
    const cope = data[data.length - 1].fields[1].value
        .split('\n')
        .map(c => c.split(' (')[0])
        .filter(c => !rec.includes(c));
    let row = [];
    for (const char of rec){
        if (char === '/') continue;
        if (row.length === 5){
            const actionRow = new MessageActionRow();
            actionRow.addComponents(...row);
            rows.push(actionRow);
            row = [];
        }

        const btn = new MessageButton()
            .setCustomId(char)
            .setLabel(char)
            .setEmoji(ce[char] || '<:UI_ItemIcon_QUESTION:997149126032638022>')
            .setStyle('SECONDARY');
        row.push(btn);
    }
    //for (const char of cope){
    //    if (char === '/') continue;
    //    if (row.length === 5){
    //        const actionRow = new MessageActionRow();
    //        actionRow.addComponents(...row);
    //        rows.push(actionRow);
    //        row = [];
    //    }
//
    //    const btn = new MessageButton()
    //        .setCustomId(char)
    //        .setLabel(char)
    //        .setStyle('DANGER');
    //    row.push(btn);
    //}
    if (row.length){
        const actionRow = new MessageActionRow();
        actionRow.addComponents(...row);
        rows.push(actionRow);
    }

    const pages = data.map(pg => ({ embeds: [pg], components: [] }));
    pages[pages.length - 1].components = rows.slice(0, 4);

    const pagedMsg = new PagedMessage(interaction, pages);
    const { message } = await pagedMsg.update();

    const filter = i => interaction.user.id === i.user.id && !pagedMsg.buttons.includes(i.customId);
    const time = 10 * 60 * 1000;
    const max = 1;
    const collector = message?.createMessageComponentCollector({ filter, time, max });

    collector?.on('collect', async i => {
        await i.deferUpdate().catch(() => {});
        await pagedMsg.end(false);

        const cmdOptions = [{
            name: 'name',
            type: 'STRING',
            value: i.customId
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
        const gg = i.customId === 'Traveler'
        if (gg) return interaction.client.commands.get('travelersheets').execute(interaction, 3)
        interaction.client.commands.get('charcards').execute(interaction, 3);
    });

    collector?.on('end', () => interaction.editReply({ components: [] }));
}

module.exports = { name, description, options, filter, execute };