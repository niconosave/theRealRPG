/*:
 * @plugindesc Adds a "Make Camp" option to the main menu, triggering a common event.
 * @author Nick
 *
 * @param Common Event ID
 * @type common_event
 * @desc The ID of the common event to call when "Make Camp" is selected.
 * @default 1
 *
 * @help
 * This plugin adds a new option called "Make Camp" to the player menu.
 * When the player selects this option, a common event of the developer's
 * choice (set in the plugin parameters) will be executed.
 *
 * There are no plugin commands for this plugin.
 */

(function() {
    // Retrieve plugin parameters
    const parameters = PluginManager.parameters('MakeCampPlugin');
    const commonEventId = Number(parameters['Common Event ID'] || 1);

    // Extend the Window_MenuCommand to add "Make Camp"
    const _Window_MenuCommand_addOriginalCommands = Window_MenuCommand.prototype.addOriginalCommands;
    Window_MenuCommand.prototype.addOriginalCommands = function() {
        _Window_MenuCommand_addOriginalCommands.call(this);
        this.addCommand("Make Camp", "makeCamp", true);
    };

    // Extend the Scene_Menu to handle "Make Camp"
    const _Scene_Menu_createCommandWindow = Scene_Menu.prototype.createCommandWindow;
    Scene_Menu.prototype.createCommandWindow = function() {
        _Scene_Menu_createCommandWindow.call(this);
        this._commandWindow.setHandler("makeCamp", this.commandMakeCamp.bind(this));
    };

    // Define the function to trigger the common event
    Scene_Menu.prototype.commandMakeCamp = function() {
        if ($dataCommonEvents[commonEventId]) {
            $gameTemp.reserveCommonEvent(commonEventId);
        } else {
            console.error(`Common Event ID ${commonEventId} does not exist.`);
        }
        this.popScene();
    };
})();

