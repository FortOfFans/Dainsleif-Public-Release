const { getUserSettings, translate } = require('../util');
const { MessageEmbed } = require("discord.js");
const axios = require('axios');
const PagedEmbed = require('../util/PagedEmbed');

const name = translate('events');
const description = translate('Gives an overview of the current events.');
const filter = () => true;
const options = [];

async function execute(interaction){
    const { data } = await axios.get('https://api.ambr.top/assets/data/event.json');

    const pages = [];
    for (const [, event] of Object.entries(data)){
        const locale = interaction.locale === 'ru' ? 'RU'
            : interaction.locale === 'zh-CN' ? 'CHS'
            : interaction.locale === 'zh-TW' ? 'CHT'
            : interaction.locale === 'ko' ? 'KR'
            : interaction.locale === 'ja' ? 'JP'
            : 'EN';

        let description = event.description[locale]
            .replace(/<\/?strong>/g, '**')
            .replace(/<\/(p|div)>|<br\/>/g, '\n')
            .replace(/<t class="t_(lc|gl)">|<\/t>/g, '__')
            .replace(/\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}/g, time => {
                const date = new Date(time.replace(/\//g, '-').replace(' ', 'T') + 'Z');
                return '<t:' + Math.floor(date.getTime() / 1000) + ':f>';
            })
            .replace(/<(p|div|\/?span|\/li|\/?colgroup|col\/|\/?tbody)>|〓|<table>(.|\n)+<\/table>/g, '');

        while (description.includes('<ol>')){
            description = description.replace('<ol>', '');

            const endIdx = description.indexOf('</ol>');
            let i = 0;
            while (description.indexOf('<li>') !== -1 && description.indexOf('<li>') < endIdx){
                description = description.replace('<li>', ++i + '. ');
            }
            description = description.replace('</ol>', '');
        }

        if (description.length > 2048) description = description.substr(0, 2045) + '...';

        const endDate = new Date(event.endAt.replace(' ', 'T') + 'Z');
        const endTimestamp = Math.floor(endDate.getTime() / 1000);

        const embed = new MessageEmbed()
            .setColor(getUserSettings(interaction.user.id).color)
            .setTitle(event.name[locale])
            .setDescription(description)
            .setImage(event.banner[locale])
            .addField(translate('Event Ends:', interaction.locale), '<t:' + endTimestamp + ':f>');
        pages.push(embed);
    }

    return new PagedEmbed(interaction, pages.map((pg, i) => new MessageEmbed(pg)
        .setFooter({
            text: translate('Page {0} of {0}', interaction.locale)
                .replace('{0}', (i + 1).toLocaleString(interaction.locale))
                .replace('{0}', pages.length.toLocaleString(interaction.locale))
        }))
    );
}

module.exports = { name, description, options, filter, execute };