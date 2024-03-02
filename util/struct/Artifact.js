class Artifact {
    level;
    mainStat;
    owner;
    rarity;
    setId;
    slot;
    substats = {};
    wielder;

    constructor(data, uid, wielderId) {
        if (data.flat.itemType !== 'ITEM_RELIQUARY') throw 'Invalid artifact data.';
        if (!Artifact.verifyUid(uid)) throw 'Invalid UID';

        this.owner = uid;
        this.wielder = wielderId;

        this.level = data.reliquary.level - 1;
        this.mainStat = data.flat.reliquaryMainstat.mainPropId.replace('FIGHT_PROP_', '');
        this.rarity = data.flat.rankLevel;
        this.setId = data.flat.icon.split('_')[2];
        this.slot = {
            EQUIP_BRACER: 0,
            EQUIP_NECKLACE: 1,
            EQUIP_SHOES: 2,
            EQUIP_RING: 3,
            EQUIP_DRESS: 4
        }[data.flat.equipType];

        for (const { appendPropId, statValue } of data.flat.reliquarySubstats ?? []){
            const substatName = appendPropId.replace('FIGHT_PROP_', '');
            this.substats[substatName] = statValue;
        }
    }

    compareTo(artifact){
        if (this.mainStat !== artifact.mainStat) return false;
        if (this.owner !== artifact.owner) return false;
        if (this.slot !== artifact.slot) return false;

        const substatLevel1 = Math.floor(this.level / 4);
        const substatLevel2 = Math.floor(artifact.level / 4);

        if (substatLevel1 === substatLevel2){
            for (const [name, value] of Object.entries(this.substats)) if (artifact.substats[name] !== value) return false;
            return true;
        } else {
            for (const name of Object.keys(this.substats)) if (!artifact.substats[name]) return false;

            let marginOfError = Math.abs(substatLevel2 - substatLevel1);
            if (marginOfError > 5) marginOfError = 4;

            for (const [name, value] of Object.entries(this.substats)) if (artifact.substats[name] !== value) marginOfError--;
            return marginOfError === 0;
        }
    }

    static compare(artifact1, artifact2){
        return Artifact.fromParsed(artifact1).compareTo(artifact2);
    }

    static fromParsed(data){
        return new Artifact({
            reliquary: {
                level: data.level + 1
            },
            flat: {
                equipType: ['EQUIP_BRACER', 'EQUIP_NECKLACE', 'EQUIP_SHOES', 'EQUIP_RING', 'EQUIP_DRESS'][data.slot],
                icon: '__' + data.setId,
                rankLevel: data.rarity,
                reliquaryMainstat: {
                    mainPropId: data.mainStat
                },
                reliquarySubstats: Object.entries(data.substats)
                    .map(([k, v]) => ({
                        appendPropId: k,
                        statValue: v
                    })),
                itemType: 'ITEM_RELIQUARY'
            }
        }, data.owner, data.wielder);
    }

    static verifyUid(uid){
        return /[125-9]\d{8}/.test(uid);
    }
}

module.exports = Artifact;