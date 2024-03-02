const { MessageEmbed } = require('discord.js');
const { getUserSettings, translate } = require('../util');
const PagedEmbed = require('../util/PagedEmbed');
const axios = require('axios');

const name = 'help';
const description = 'Displays a list of all commands.';
const filter = () => true;
const options = [];

async function execute(interaction){
    const commands = interaction.client.commands.map(i => i).filter(c => c.filter(interaction) && ![2, 3].includes(c.type));
    const { data } = await axios.get('https://discord.com/api/v8/applications/'+ interaction.client.user.id +'/commands', {headers: {Authorization: 'Bot ' + interaction.client.token}})

    const pages = [];
    for (let i = 0; i < data.length; i += 9){
        const page = data.map(i => i.name).sort().slice(i, i + 9);
        const embed = new MessageEmbed()
            .setTitle(translate('Help for {0}', interaction.locale).replace('{0}', interaction.client.user.username))
            .setDescription(translate('**__How to Set-up the bot properly__**: https://youtu.be/yV2Y8VeJe4I' , interaction.locale))
            .setThumbnail(interaction.client.user.avatarURL())
            .setColor(getUserSettings(interaction.user.id).color)
            .setFooter({
                text: translate('Page {0} of {0}', interaction.locale)
                    .replace('{0}', Math.floor(i / 9) + 1)
                    .replace('{0}', Math.ceil(data.length / 9))
            });

        for (const item of page) {
            if (!data.find(cmd => cmd.name === item).description) continue
            embed.addField(
            '</' + data.find(cmd => cmd.name === item).name + ':' + data.find(cmd => cmd.name === item).id + '>',
                data.find(cmd => cmd.name === item).description,
            page.length > 5
        )
            ;
        }

        pages.push(embed);
    }

    return new PagedEmbed(interaction, pages);
}

module.exports = { name, description, options, filter, execute };