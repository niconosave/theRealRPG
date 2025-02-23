/*:
 * @plugindesc Enhances the status window to display more information about characters, including custom stats and attributes, replacing the original block2 method entirely.
 * @author YourName
 * 
 * @help
 * This plugin modifies the status window to display a full set of attributes
 * such as Max HP, Max MP, and various rates, as well as equipment with benefits
 * and detriments highlighted in green and red respectively.
 */

(function() {

    Window_Status.prototype.drawBlock3 = function(y) {
        const lineHeight = this.lineHeight();
        const x = this.textPadding();
        const actor = this._actor;

        if (!actor) return;

        // Display Parameters
        const params = ["Max HP", "Max MP", "Attack", "Defense", "M.Attack", "M.Defense", "Agility", "Luck"];
        const paramIds = [0, 1, 2, 3, 4, 5, 6, 7];
        for (let i = 0; i < params.length; i++) {
            const name = params[i];
            const value = actor.param(paramIds[i]);
            this.changeTextColor(this.systemColor());
            this.drawText(name + ":", x, y + lineHeight * i, 160);
            this.resetTextColor();
            this.drawText(value, x + 160, y + lineHeight * i, 60, "right");
        }

        // Display Rates
        const rates = [
            { name: "Hit Rate", value: actor.hit },
            { name: "Evasion Rate", value: actor.eva },
            { name: "Critical Rate", value: actor.cri },
            { name: "Magic Reflection Rate", value: actor.mrf },
            { name: "Counter Attack Rate", value: actor.cnt },
            { name: "HP Regeneration Rate", value: actor.hrg },
            { name: "Target Rate", value: actor.tgr },
            { name: "Guard Rate", value: actor.grd },
            { name: "Recovery Rate", value: actor.rec },
            { name: "Pharmacology Rate", value: actor.pha },
            { name: "Physical Damage Rate", value: actor.pdr },
            { name: "Magical Damage Rate", value: actor.mdr },
            { name: "Floor Damage Rate", value: actor.fdr }
        ];

        for (let i = 0; i < rates.length; i++) {
            const name = rates[i].name;
            const value = (rates[i].value * 100).toFixed(1) + "%";
            this.changeTextColor(this.systemColor());
            this.drawText(name + ":", x+260+260*Math.floor(i/6), -260+y + lineHeight * (params.length + i%6), 160);
            this.resetTextColor();
            this.drawText(value, x +260 +260*Math.floor(i/6) + 160, -260+y + lineHeight * (params.length + i%6), 60, "right");
        }

        // Draw Equipment
        this.drawEquipment(x, y + lineHeight * (params.length + rates.length));
    };

    Window_Status.prototype.drawEquipment = function(x, y) {
        const lineHeight = this.lineHeight();
        const actor = this._actor;

        if (!actor) return;

        this.changeTextColor(this.systemColor());
        this.drawText("Equipment:", x, y, 400);

        const equipItems = actor.equips();
        for (let i = 0; i < equipItems.length; i++) {
            const item = equipItems[i];
            const baseY = y + lineHeight * (i + 1);
            if (item) {
                this.drawItemName(item, x, baseY, 300);

                // Highlight parameter changes
                const params = Array(8).fill(0).map((_, id) => {
                    return (item.params[id] !== 0) ? { id, value: item.params[id] } : null;
                }).filter(Boolean);

                params.forEach((param, idx) => {
                    const color = param.value > 0 ? this.powerUpColor() : this.powerDownColor();
                    const text = `${TextManager.param(param.id)}: ${param.value > 0 ? "+" : ""}${param.value}`;
                    this.changeTextColor(color);
                    this.drawText(text, x + 320, baseY + idx * lineHeight, 160, "right");
                });
            }
        }
    };

})();

