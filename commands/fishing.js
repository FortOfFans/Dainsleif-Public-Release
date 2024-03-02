const { MessageEmbed, MessageActionRow, MessageSelectMenu, CommandInteractionOptionResolver, Collection} = require('discord.js');
const { getClosest, getUserSettings, jsonParse, translate, untranslate } = require('../util');
const fs = require('fs');
const PagedEmbed = require('../util/PagedEmbed');
const PagedMessage = require("../util/PagedMessage");

const name = translate('fishing');
const description = translate('Displays a fishing cheat sheet.');
const filter = () => true;
const options = [
    {
        type: 3, //str
        name: translate('region'),
        description: translate('The fishing location to search for.'),
        required: true,
        choices: [
            {
                name:'All Fish',
                value:'All Fish'
            },
            {
                name:'Catch',
                value:'Catch'
            },
            {
                name:'End of the Line',
                value:'End of the Line'
            },
            {
                name:'Mondstadt',
                value:'Mondstadt'
            },
            {
                name:'Dragonspine',
                value:'Dragonspine'
            },
            {
                name:'Liyue',
                value:'Liyue'
            },
            {
                name:'Chasm',
                value:'Chasm'
            },
            {
                name:'Inazuma',
                value:'Inazuma'
            },
            {
                name:'Enkanomiya',
                value:'Enkanomiya'
            },
            {
                name:'Sumeru',
                value:'Sumeru'
            }
        ]
    }
];

async function execute(interaction){
    const basePath = './data/guides/fishing';
    let dirPath = basePath + '/' + interaction.locale;
    if (!fs.existsSync(dirPath)) dirPath = basePath + '/en-GB';
    const enPath = basePath + '/en-GB';

    const aliases = jsonParse('./data/aliases/fishing.json', {});
    const query = untranslate(interaction.options.getString('region') ?? '', interaction.locale);

    const closest = getClosest((aliases[query] ?? query), fs.readdirSync(enPath).map(f => f.split('.')[0]));

    if (!closest || !query){
        const emojiMap = jsonParse('./data/emojis/regionalEmojis.json', {});
        let list = [];
        for (const name of Object.keys(emojiMap)){
            const itemName = name;
            list.push(itemName);
        }
        list = list.sort();

        const listEmbed = new MessageEmbed()
            .setColor(getUserSettings(interaction.user.id).color)
            .setDescription(translate('Please select a region to view its fishing points.', interaction.locale));

        const pages = [];
        const pageSize = 25;

        for (let i = 0; i <= list.length; i += pageSize){
            const embed = listEmbed;
            const row = new MessageActionRow();
            const selectMenu = new MessageSelectMenu()
                .setCustomId('itemselect');

            const options = list.slice(i, i + pageSize)
                .map(item => ({ value: item, label: item, emoji: emojiMap[untranslate(item, interaction.locale)] }));
            selectMenu.addOptions(options);
            row.addComponents(selectMenu);

            pages.push({ embeds: [embed], components: [row] });
        }

        const pagedMsg = new PagedMessage(interaction, pages);
        const { message } = await pagedMsg.update();

        const filter = i => interaction.user.id === i.user.id;
        const time = 10 * 60 * 1000;
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
    }

    const data = jsonParse(dirPath + '/' + untranslate(closest, interaction.locale) + '.json',
        jsonParse(basePath + '/en-GB/' + untranslate(closest, interaction.locale) + '.json', []))
        .map((pg, i, arr) => Object({
            ...pg,
            footer: {
                text: pg.footer.text + ' • ' + translate('Page {0} of {0}', interaction.locale)
                    .replace('{0}', i + 1)
                    .replace('{0}', arr.length)
            }
        }));
    return new PagedEmbed(interaction, data);
}

module.exports = { name, description, options, filter, execute };