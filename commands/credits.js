const { MessageEmbed } = require('discord.js');
const { getUserSettings, translate } = require('../util');
const fs = require('fs');
const PagedEmbed = require('../util/PagedEmbed');

const name = translate('credits');
const description = translate('Displays credits for the bot.');
const filter = () => true;
const options = [];

async function execute(interaction){
    const credits = {
        'Developers': ['a.bakedpotato', 'FortOfFans', 'Paloys'],
        'APIs/Modules': ['[Ambr.top](https://ambr.top/en)', '[Axios](https://www.npmjs.com/package/axios)', '[ShinShin.moe](https://shinshin.moe)', '[GenshinData Repo](https://github.com/Dimbreath/GenshinData)', '[Enka.network](https://enka.shinshin.moe)', '[HoYoLab Wrapper](https://vermaysha.github.io/hoyolab-api/index.html)'].map(e => e),
        'Major Helpers': ['Algoinde', 'Anonbelle', 'FrozenNight'],
        'Contributors': ['FortOfFans (info + visual)', 'Sun (info)', 'Kira (info)', 'Fingaa (info)',
            'Alice (visual)', 'Iuhence (visual)', 'a.bakedpotato (translated visuals)'].map(e => e)
    }

    const ignoreCase = (a, b) => a.toLowerCase().localeCompare(b.toLowerCase());
    const embed = new MessageEmbed()
        .setTitle(translate('{0} Credits', interaction.locale).replace('{0}', interaction.client.user.username))
        .setColor(getUserSettings(interaction.user.id).color);
    for (const [ title, entries ] of Object.entries(credits)){
        const name = translate(title, interaction.locale);
        const inline = entries.length <= 6;
        const value = inline ? entries.sort(ignoreCase).join('\n') : entries.sort(ignoreCase).join(', ');
        embed.addField(name, value, inline);
    }

    const translationPages = [];
    const translationCredits = fs.readFileSync('./data/translatorCredits.txt').toString().split('\r\n').sort();
    const pageSize = 40;
    for (let i = 0; i < translationCredits.length; i += pageSize){
        const pageData = translationCredits.slice(i, i + pageSize);
        const embed = new MessageEmbed()
            .setColor(getUserSettings(interaction.user.id).color)
            .setTitle(translate('Translation Credits', interaction.locale))
            .setDescription(pageData.join(', '));

        translationPages.push(embed);
    }

    return new PagedEmbed(interaction, [embed, ...translationPages], 0, 60 * 1000);
}

module.exports = { name, description, options, filter, execute };