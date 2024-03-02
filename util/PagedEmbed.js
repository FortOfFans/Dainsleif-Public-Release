const PagedMessage = require('./PagedMessage');

class PagedEmbed extends PagedMessage {
    constructor(interaction, pages, startPage = 0, time = 10 * 60 * 1000) {
        pages = pages.map(pg => Object({ embeds: [pg], components: [] }));
        super(interaction, pages, startPage, time);
    }
}

module.exports = PagedEmbed;