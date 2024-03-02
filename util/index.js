const axios = require('axios');
const fs = require('fs');

async function ambrApi(endpoint, discordLocale = 'en'){
    if (!endpoint.startsWith('/')) endpoint = '/' + endpoint;
    const locale = ambrLocale(discordLocale);

    try {
        const { data } = await axios.get('https://api.ambr.top/v2/' + locale + endpoint);
        return data.data;
    } catch(e){
        return e.request.data;
    }
}

function ambrLocale(locale = 'en'){
    if (locale === 'static') return 'static';

    const locales = {
        'en-GB': 'en',
        'en-US': 'en',
        'es-ES': 'es',
        'pt-BR': 'pt',
        'it':'it',
        'ko': 'kr',
        'ja': 'jp',
        'ru': "ru",
        'tr' : 'tr',
        'zh-CN': 'chs',
        'zh-TW': 'cht'
    }
    const loc = jsonParse('./data/loc.json', {});
    const discordLocale = locale;
    return locales[discordLocale] ?? (loc[discordLocale] ? discordLocale : 'en');
}

function capitalise(str){
    return str.toLowerCase().replace(/^[a-z]|\s[a-z]/g, letter => letter.toUpperCase());
}

function editDistance(s1, s2){
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();
    const costs = [];
    for (let i = 0; i <= s1.length; i++){
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++){
            if (i === 0) costs[j] = j;
            else if (j > 0){
                let newValue = costs[j - 1];
                if (s1.charAt(i - 1) !== s2.charAt(j - 1)) newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                costs[j - 1] = lastValue;
                lastValue = newValue;
            }
        }
        if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
}

function getClosest(query, list){
    const requiredSimilarity = 0.75;

    if (!query) return null;
    const getSimilarity = item => similarity(query?.toLowerCase(), item?.toLowerCase());
    return list
        .sort((a, b) => getSimilarity(b) - getSimilarity(a))
        .filter(c => getSimilarity(c) >= requiredSimilarity)
        .shift();
}

function getUserSettings(id){
    return jsonParse('./data/users/' + id + '.json', jsonParse('./data/defaultSettings.json', {}));
}

function jsonParse(path, fallback){
    try {
        return JSON.parse(fs.readFileSync(path).toString());
    } catch(ignored){
        return fallback;
    }
}

function jsonSave(path, data){
    return fs.writeFileSync(path, JSON.stringify(data, null, '\t'));
}

function readFile(path){
    if (fs.existsSync(path)) return fs.readFileSync(path).toString();
    return null;
}

function readFileImg(path){
    if (fs.existsSync(path)) return fs.readFileSync(path);
    return null;
}

function similarity(s1, s2){
    let longer = s1;
    let shorter = s2;
    if (s1.length < s2.length) {
        longer = s2;
        shorter = s1;
    }
    const longerLength = longer.length;
    if (longerLength === 0) return 1;
    return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}

function translate(phrase, lang = 'en-GB'){
    if (phrase === '') return '';
    if (phrase.includes('\n')) return phrase
        .split('\n')
        .map(ln => translate(ln, lang))
        .join('\n');
    const en = jsonParse('./data/lang/en-GB.json', []);
    if (!en.includes(phrase)){
        en.push(phrase);
        jsonSave('./data/lang/en-GB.json', en);
        console.log('Added "' + phrase + '" to translation strings.');
    }

    if (lang === 'en-GB') return phrase;
    const local = jsonParse('./data/lang/' + lang + '.json', []);
    const index = en.findIndex(p => p === phrase);
    return local[index] || phrase;
}

//Might need more testing to work properly in certain use cases
function untranslate(phrase, lang = 'en-GB'){
    const local = jsonParse('./data/lang/' + lang + '.json', []);
    if (!local.includes(phrase)) return phrase;

    const en = jsonParse('./data/lang/en-GB.json', []);
    const index = local.findIndex(p => p === phrase);
    return en[index] || phrase;
}

function writeFile(path, data) {
    return fs.writeFileSync(path, data.toString());
}

function haveSameData(object1, object2) {
    const keys1 = Object.keys(object1);
    const keys2 = Object.keys(object2);
    if (keys1.length !== keys2.length) {
        return false;
    }
    for (const key of keys1) {
        const val1 = object1[key];
        const val2 = object2[key];
        const areObjects = isObject(val1) && isObject(val2);
        if (
            areObjects && !haveSameData(val1, val2) ||
            !areObjects && val1 !== val2
        ) {
            return false;
        }
    }
    return true;
}

function isObject(object) {
    return object != null && typeof object === 'object';
}

module.exports = {
    ambrApi,
    ambrLocale,
    capitalise,
    getClosest,
    getUserSettings,
    jsonParse,
    jsonSave,
    readFile,
    readFileImg,
    translate,
    untranslate,
    writeFile,
    haveSameData
}