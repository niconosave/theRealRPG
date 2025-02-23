/*:
 * @plugindesc Restrict player movement to a set radius on the world map.
 * @author Nick
 *
 * @param Restricted Maps
 * @type number[]
 * @desc Array of map IDs where movement restriction will be applied.
 * @default []
 *
 * @param Max Distance
 * @type number
 * @desc The maximum distance (in pixels) the player can move away from the starting point.
 * @default 300
 *
 * @help
 * This plugin restricts the player's movement to a set radius on specific maps. The starting point is reset whenever the player makes camp.
 *
 * Plugin Commands:
 *   SetCamp - Resets the starting point to the player's current location.
 */

(function() {
    const parameters = PluginManager.parameters('RestrictMovement');
    const restrictedMaps = JSON.parse(parameters['Restricted Maps']).map(Number);
    const defaultRadius = Number(parameters['Max Distance'] || 300);

    let campCenter = { x: 0, y: 0 };

    // Plugin command to set the camp point
    var _Game_Interpreter_pluginCommand =
            Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (command === 'SetCamp') {
            	campCenter.x = $gamePlayer._px;
        	campCenter.y = $gamePlayer._py;
        }
    };
    
    // Helper function to clamp position within the radius
    function clampToRadius(x, y) {
        const dx = x - campCenter.x;
        const dy = y - campCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > defaultRadius) {
            const scale = defaultRadius / distance;
            x = campCenter.x + dx * scale;
            y = campCenter.y + dy * scale;
        }

        return { x, y };
    }

    // Extend player movement logic (Straight Movement)
    const _Game_Player_moveStraight = Game_Player.prototype.moveStraight;
    Game_Player.prototype.moveStraight = function(d, distance) {
        distance = distance || this.moveTiles();
        const mapId = $gameMap.mapId();

        if (restrictedMaps.includes(mapId)) {
            if (campCenter.x === 0 && campCenter.y === 0) {
                campCenter = { x: this._px, y: this._py };
            }

            // Allow movement first
            _Game_Player_moveStraight.call(this, d, distance);

            // Clamp position if necessary
            const clampedPosition = clampToRadius(this._px, this._py);
            this._px = clampedPosition.x;
            this._py = clampedPosition.y;
            return;
        }

        _Game_Player_moveStraight.call(this, d, distance);
    };

    // Extend player movement logic (Diagonal Movement)
    const _Game_Player_moveDiagonally = Game_Player.prototype.moveDiagonally;
    Game_Player.prototype.moveDiagonally = function(horz, vert, distance) {
        distance = distance || this.moveTiles();
        const mapId = $gameMap.mapId();

        if (restrictedMaps.includes(mapId)) {
            if (campCenter.x === 0 && campCenter.y === 0) {
                campCenter = { x: this._px, y: this._py };
            }

            // Allow movement first
            _Game_Player_moveDiagonally.call(this, horz, vert, distance);

            // Clamp position if necessary
            const clampedPosition = clampToRadius(this._px, this._py);
            this._px = clampedPosition.x;
            this._py = clampedPosition.y;
            return;
        }

        _Game_Player_moveDiagonally.call(this, horz, vert, distance);
    };

})();

