/*:
 * @plugindesc Creates a menu that overlays the map without scene changes
 * @author Claude
 *
 * @help 
 * This plugin replaces the default menu with an overlay menu
 * that doesn't require reloading the map scene.
 * 
 * Press ESC to toggle the menu.
 */

(function() {
    'use strict';
    
    // Create our overlay menu window class
    function Window_OverlayMenu() {
        this.initialize.apply(this, arguments);
    }

    Window_OverlayMenu.prototype = Object.create(Window_Command.prototype);
    Window_OverlayMenu.prototype.constructor = Window_OverlayMenu;

    Window_OverlayMenu.prototype.initialize = function() {
        Window_Command.prototype.initialize.call(this, 0, 0);
        this.x = (Graphics.boxWidth - this.width) / 2;
        this.y = (Graphics.boxHeight - this.height) / 2;
        this.deactivate();
        this.hide();
    };

    Window_OverlayMenu.prototype.windowWidth = function() {
        return 240;
    };

    Window_OverlayMenu.prototype.makeCommandList = function() {
        this.addCommand('Items', 'items');
        this.addCommand('Skills', 'skills');
        this.addCommand('Status', 'status');
    };

    // Enhanced Window_OverlayItems with proper item display
    function Window_OverlayItems() {
        this.initialize.apply(this, arguments);
    }

    Window_OverlayItems.prototype = Object.create(Window_ItemList.prototype);
    Window_OverlayItems.prototype.constructor = Window_OverlayItems;

    Window_OverlayItems.prototype.initialize = function(helpWindow) {
        this._helpWindow = helpWindow;
        // Initialize the item list window below the help window
        var y = this._helpWindow.height;
        var height = Graphics.boxHeight - y;
        Window_ItemList.prototype.initialize.call(this, 0, y, Graphics.boxWidth, height);
        
        this.hide();
        this.deactivate();
        this.setHandler('ok', this.onItemOk.bind(this));
        this.setHandler('cancel', this.onItemCancel.bind(this));
        this.refresh();
    };

    Window_OverlayItems.prototype.show = function() {
        Window_ItemList.prototype.show.call(this);
        if (this._helpWindow) {
            this._helpWindow.show();
        }
    };

    Window_OverlayItems.prototype.hide = function() {
        Window_ItemList.prototype.hide.call(this);
        if (this._helpWindow) {
            this._helpWindow.hide();
        }
    };

    Window_OverlayItems.prototype.includes = function(item) {
        return DataManager.isItem(item);
    };

    Window_OverlayItems.prototype.isEnabled = function(item) {
        return $gameParty.canUse(item);
    };

    Window_OverlayItems.prototype.onItemOk = function() {
        $gameParty.setLastItem(this.item());
        this.playSeForItem();
        this.useItem();
        this.refresh();
        this.activate();
    };

    Window_OverlayItems.prototype.playSeForItem = function() {
        SoundManager.playUseItem();
    };

    Window_OverlayItems.prototype.useItem = function() {
        var item = this.item();
        var actor = $gameParty.members()[0];
        if (item && actor) {
            actor.useItem(item);
        }
    };

    Window_OverlayItems.prototype.updateHelp = function() {
        this._helpWindow.setItem(this.item());
    };

    Window_OverlayItems.prototype.onItemCancel = function() {
        this.hide();
        this.deactivate();
        SceneManager._scene._overlayMenuWindow.show();
        SceneManager._scene._overlayMenuWindow.activate();
    };


    function Window_OverlaySkills() {
        this.initialize.apply(this, arguments);
    }

    Window_OverlaySkills.prototype = Object.create(Window_SkillList.prototype);
    Window_OverlaySkills.prototype.constructor = Window_OverlaySkills;

    Window_OverlaySkills.prototype.initialize = function() {
        Window_SkillList.prototype.initialize.call(this, 0, 0, Graphics.boxWidth, Graphics.boxHeight);
        this.x = 0;
        this.y = 0;
        this.hide();
        this.deactivate();
        this.refresh();
    };

    function Window_OverlayStatus() {
        this.initialize.apply(this, arguments);
    }

    Window_OverlayStatus.prototype = Object.create(Window_Status.prototype);
    Window_OverlayStatus.prototype.constructor = Window_OverlayStatus;

    Window_OverlayStatus.prototype.initialize = function() {
        Window_Status.prototype.initialize.call(this);
        this.x = 0;
        this.y = 0;
        this.hide();
        this.deactivate();
        this.refresh();
    };

    // Override Scene_Map's isMenuEnabled to check our overlay windows
    Scene_Map.prototype.isOverlayMenuVisible = function() {
        return this._overlayMenuWindow.visible || 
               this._overlayItemsWindow.visible || 
               this._overlaySkillsWindow.visible || 
               this._overlayStatusWindow.visible;
    };

    // Override player movement when menu is open
    var _Scene_Map_processMapTouch = Scene_Map.prototype.processMapTouch;
    Scene_Map.prototype.processMapTouch = function() {
        if (!this.isOverlayMenuVisible()) {
            _Scene_Map_processMapTouch.call(this);
        }
    };

    var _Scene_Map_updateDestination = Scene_Map.prototype.updateDestination;
    Scene_Map.prototype.updateDestination = function() {
        if (!this.isOverlayMenuVisible()) {
            _Scene_Map_updateDestination.call(this);
        }
    };

    // Override player input
    var _Game_Player_moveByInput = Game_Player.prototype.moveByInput;
    Game_Player.prototype.moveByInput = function() {
        if (SceneManager._scene instanceof Scene_Map && 
            SceneManager._scene.isOverlayMenuVisible()) {
            return;
        }
        _Game_Player_moveByInput.call(this);
    };

     // Modify Scene_Map to handle our overlay menu
    var _Scene_Map_createAllWindows = Scene_Map.prototype.createAllWindows;
    Scene_Map.prototype.createAllWindows = function() {
        _Scene_Map_createAllWindows.call(this);
        this.createOverlayMenuWindows();
    };

    // Modify Scene_Map to handle our overlay menu
    Scene_Map.prototype.createOverlayMenuWindows = function() {
        // Create help window first
        this._overlayHelpWindow = new Window_Help(2);
        this._overlayHelpWindow.x = 0;
        this._overlayHelpWindow.y = 0;
        this._overlayHelpWindow.hide();

        // Create other windows
        this._overlayMenuWindow = new Window_OverlayMenu();
        this._overlayItemsWindow = new Window_OverlayItems(this._overlayHelpWindow);
        this._overlaySkillsWindow = new Window_OverlaySkills();
        this._overlayStatusWindow = new Window_OverlayStatus();
        
        // Add windows to scene in correct order
        this.addWindow(this._overlayHelpWindow);
        this.addWindow(this._overlayMenuWindow);
        this.addWindow(this._overlayItemsWindow);
        this.addWindow(this._overlaySkillsWindow);
        this.addWindow(this._overlayStatusWindow);

        // Set handlers for menu commands
        this._overlayMenuWindow.setHandler('items', this.showOverlayItems.bind(this));
        this._overlayMenuWindow.setHandler('skills', this.showOverlaySkills.bind(this));
        this._overlayMenuWindow.setHandler('status', this.showOverlayStatus.bind(this));
    };

    Scene_Map.prototype.showOverlayItems = function() {
        this._overlayItemsWindow.show();
        this._overlayItemsWindow.activate();
        this._overlayMenuWindow.hide();
    };

    Scene_Map.prototype.showOverlaySkills = function() {
        this._overlaySkillsWindow.show();
        this._overlaySkillsWindow.activate();
        this._overlayMenuWindow.hide();
    };

    Scene_Map.prototype.showOverlayStatus = function() {
        this._overlayStatusWindow.show();
        this._overlayStatusWindow.activate();
        this._overlayMenuWindow.hide();
    };

    Scene_Map.prototype.hideAllOverlayWindows = function() {
        this._overlayMenuWindow.hide();
        this._overlayItemsWindow.hide();
        this._overlaySkillsWindow.hide();
        this._overlayStatusWindow.hide();
        
        this._overlayMenuWindow.deactivate();
        this._overlayItemsWindow.deactivate();
        this._overlaySkillsWindow.deactivate();
        this._overlayStatusWindow.deactivate();
    };

    // Override the menu call check to use our overlay menu
    var _Scene_Map_isMenuCalled = Scene_Map.prototype.isMenuCalled;
    Scene_Map.prototype.isMenuCalled = function() {
        if (_Scene_Map_isMenuCalled.call(this)) {
            if (this.isOverlayMenuVisible()) {
                this.hideAllOverlayWindows();
            } else {
                this._overlayMenuWindow.show();
                this._overlayMenuWindow.activate();
                this._overlayMenuWindow.select(0);
            }
            return false;
        }
        return false;
    };

    // Add handling for back/cancel in sub-menus
    var _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        
        if (Input.isTriggered('cancel')) {
            if (this._overlayItemsWindow.visible || 
                this._overlaySkillsWindow.visible || 
                this._overlayStatusWindow.visible) {
                this.hideAllOverlayWindows();
                this._overlayMenuWindow.show();
                this._overlayMenuWindow.activate();
                this._overlayMenuWindow.select(0);
            }
        }
    };
})();
