const { MessageMenu } = require("discord-buttons");
const { Client } = require("discord.js");
const { EventEmitter } = require('events');
const requiredPerms = ['SEND_MESSAGES', 'EMBED_LINKS', 'ADD_REACTIONS', 'MANAGE_MESSAGES']
const { random } = require("lodash");

let client;

/**
 * Initializes
 * @param {Client} c 
 */
module.exports = (c) => {
    client = c;
}

/**
 * A page object that the menu can display.
 */
class ButtonPage {
    constructor(name, content, buttons, index) {
        this.name = name
        this.content = content
        this.buttons = buttons
        this.index = index
    }
}

module.exports.MenuOption = class MenuOption {
    listOption;
    callback;
    constructor(listOption, callback) {
        this.listOption = listOption;
        this.callback = callback;
    }
}

module.exports.MenuButton = class MenuButton {
    buttonOption;
    callback;
    constructor(buttonOption, callback) {
        this.buttonOption = buttonOption;
        this.callback = callback;
    }
}

module.exports.MenuOptionsList = class MenuOptionsList {

    list;
    constructor() {
        this.list = new Map();
    }

    addOption(menuOption) {
        this.list.set(menuOption.listOption, menuOption.callback);
        return this;
    }

    addOptions(menuOptions) {
        for (const menuOption of menuOptions) {
            this.list.set(menuOption.listOption, menuOption.callback);
        }
        return this;
    }

    removeOption(listOption) {
        this.list.delete(listOption);
        return this;
    }

}

module.exports.MenuButtonsList = class MenuButtonsList {

    list;
    constructor() {
        this.list = new Map();
    }

    addButton(buttonOption) {
        this.list.set(buttonOption.buttonOption, buttonOption.callback);
        return this;

    }

    addButtons(buttonOptions) {
        for (const buttonOption of buttonOptions) {
            this.list.set(buttonOption.buttonOption, buttonOption.callback);

        }
        return this;
    }

    removeButton(buttonOption) {
        this.list.delete(buttonOption);
        return this;

    }

}


/**
 * A page object that the menu can display.
 */
class Page {

    constructor(name, content, buttons, index) {
        this.name = name
        this.content = content
        this.buttons = buttons
        this.index = index

    }
}

/**
 * A menu with customisable reactions for every page.
 * Blacklisted page names are: `first, last, previous, next, stop, delete`.
 * These names perform special functions and should only be used as reaction destinations.
 */
module.exports.ButtonMenu = class ButtonMenu extends EventEmitter {

    constructor(channel, userID, pages, ms = 180000) {
        super()
        this.channel = channel
        this.userID = userID
        this.ms = ms

        const missingPerms = []
        // this usually means it's a dm channel that hasn't been created
        if (!this.channel) {
            this.channel.client.users.cache.get(this.userID).createDM(true)
        }
        if (this.channel.type !== 'dm') {
            requiredPerms.forEach(perm => {
                if (!this.channel.permissionsFor(this.channel.client.user).toArray().includes(perm)) {
                    missingPerms.push(perm)
                }
            })
            if (missingPerms.length) console.log(`\x1B[96m[discord.js-menu]\x1B[0m Looks like you're missing ${missingPerms.join(', ')} in #${this.channel.name} (${this.channel.guild.name}). This perm is needed for basic menu operation. You'll probably experience problems sending menus in this channel.`)
        } else {
            console.log(`\x1B[96m[discord.js-menu]\x1B[0m Looks like you're trying to send a menu as a DM (to ${this.channel.recipient.tag}). DMs don't allow removing other people's reactions, making the menu fundamentally broken. The menu will still send, but you have been warned that what you're doing almost certainly won't work, so don't come complaining to me.`)
        }

        /**
         * List of pages available to the Menu.
         * @type {ButtonPage[]}
         */
        this.pages = []

        let i = 0
        pages.forEach(page => {
            this.pages.push(new ButtonPage(page.name, page.content, page.buttons, i))
            i++
        })

        /**
         * The page the Menu is currently displaying in chat.
         * @type {ButtonPage}
         */
        this.currentPage = this.pages[0]
        /**
         * The index of the Pages array we're currently on.
         * @type {Number}
         */
        this.pageIndex = 0

        this.buttons = [];
    }

    /**
     * Send the Menu and begin listening for reactions.
     */
    async start() {
        // TODO: Sort out documenting this as a TSDoc event.
        this.emit('pageChange', this.currentPage)
        this.addButtons()
        this.menu = await this.channel.send(this.currentPage.content, { buttons: this.buttons });
        this.awaitButtons();
    }

    /**
     * Stop listening for new reactions.
     */
    stop() {
        if (this.buttonCollector) {
            this.buttonCollector.stop()
        }
    }

    /**
     * Delete the menu message.
     */
    delete() {
        if (this.buttonCollector) this.buttonCollector.stop()
        if (this.menu) this.menu.delete()
    }

    /**
     * Remove all reactions from the menu message.
     */
    clearButtons() {
        if (this.menu) {
            return this.menu.edit(this.currentPage.content, { components: [] });
        }
    }

    /**
     * Jump to a new page in the Menu.
     * @param {Number} page The index of the page the Menu should jump to.
     */
    async setPage(page = 0) {
        this.emit('pageChange', this.pages[page])

        this.pageIndex = page
        this.currentPage = this.pages[this.pageIndex]

        this.buttonCollector.stop()
        this.addButtons()
        if (this.currentPage.buttons.size != 0)
            this.menu.edit(this.currentPage.content, { components: [], buttons: this.buttons })
        else
            this.menu.edit(this.currentPage.content, { components: [] })

        this.awaitButtons()
    }

    /**
     * React to the new page with all of it's defined reactions
     */
    addButtons() {
        this.buttons = [];
        for (const btn of this.currentPage.buttons) {
            this.buttons.push(btn[0]);
        }
    }

    /**
     * Start a reaction collector and switch pages where required.
     */
    awaitButtons() {
        this.buttonCollector = this.menu.createButtonCollector((button) => button.clicker.id === this.userID, { idle: this.ms })

        this.buttonCollector.on('end', (i) => {
            // Whether the end was triggered by pressing a reaction or the menu just ended.

            return this.clearButtons()

        })

        this.buttonCollector.on('collect', async (i) => {
            // If the name exists, prioritise using that, otherwise, use the ID. If neither are in the list, don't run anything.
            let button;
            for (const buttons of this.currentPage.buttons) {
                if (buttons[0].custom_id == i.id) {
                    button = buttons[0];
                }

            }
            if (button) {
                if (typeof this.currentPage.buttons.get(button) === 'function') {
                    return this.currentPage.buttons.get(button)(i);
                }
                await i.reply.defer(false);

                switch (this.currentPage.buttons.get(button)) {
                    case 'first':
                        this.setPage(0)
                        break
                    case 'last':
                        this.setPage(this.pages.length - 1)
                        break
                    case 'previous':
                        if (this.pageIndex > 0) {
                            this.setPage(this.pageIndex - 1)
                        }
                        break
                    case 'next':
                        if (this.pageIndex < this.pages.length - 1) {
                            this.setPage(this.pageIndex + 1)
                        }
                        break
                    case 'stop':
                        this.stop()
                        break
                    case 'delete':
                        this.delete()
                        break
                    default:
                        this.setPage(this.pages.findIndex(p => p.name === this.currentPage.buttons.get(button)))
                        break
                }
            }
        })
    }
}

module.exports.Menu = class Menu extends EventEmitter {

    constructor(channel, userID, pages, ms = 180000) {
        super()
        this.channel = channel
        this.userID = userID
        this.ms = ms

        const missingPerms = []
        // this usually means it's a dm channel that hasn't been created
        if (!this.channel) {
            this.channel.client.users.cache.get(this.userID).createDM(true)
        }
        if (this.channel.type !== 'dm') {
            requiredPerms.forEach(perm => {
                if (!this.channel.permissionsFor(this.channel.client.user).toArray().includes(perm)) {
                    missingPerms.push(perm)
                }
            })
            if (missingPerms.length) console.log(`\x1B[96m[discord.js-menu]\x1B[0m Looks like you're missing ${missingPerms.join(', ')} in #${this.channel.name} (${this.channel.guild.name}). This perm is needed for basic menu operation. You'll probably experience problems sending menus in this channel.`)
        } else {
            console.log(`\x1B[96m[discord.js-menu]\x1B[0m Looks like you're trying to send a menu as a DM (to ${this.channel.recipient.tag}). DMs don't allow removing other people's reactions, making the menu fundamentally broken. The menu will still send, but you have been warned that what you're doing almost certainly won't work, so don't come complaining to me.`)
        }

        /**
         * List of pages available to the Menu.
         * @type {Page[]}
         */
        this.pages = []

        let i = 0
        pages.forEach(page => {
            this.pages.push(new Page(page.name, page.content, page.buttons, i))
            i++
        })

        /**
         * The page the Menu is currently displaying in chat.
         * @type {Page}
         */
        this.currentPage = this.pages[0]
        /**
         * The index of the Pages array we're currently on.
         * @type {Number}
         */
        this.pageIndex = 0

        this.buttonMenu = new MessageMenu()
            .setID(randomButtonId())
    }

    /**
     * Send the Menu and begin listening for reactions.
     */
    async start() {
        // TODO: Sort out documenting this as a TSDoc event.
        this.emit('pageChange', this.currentPage)
        this.addButtons()
        this.menu = await this.channel.send(this.currentPage.content, { menus: this.buttonMenu });
        this.awaitButtons();
    }

    /**
     * Stop listening for new reactions.
     */
    stop() {
        if (this.buttonCollector) {
            this.buttonCollector.stop()
            this.clearButtons()
        }
    }

    /**
     * Delete the menu message.
     */
    delete() {
        if (this.buttonCollector) this.buttonCollector.stop()
        if (this.menu) this.menu.delete()
    }

    /**
     * Remove all reactions from the menu message.
     */
    clearButtons() {
        if (this.menu) {
            return this.menu.edit(this.currentPage.content, { components: [] });
        }
    }

    /**
     * Jump to a new page in the Menu.
     * @param {Number} page The index of the page the Menu should jump to.
     */
    async setPage(page = 0) {
        this.emit('pageChange', this.pages[page])

        this.pageIndex = page
        this.currentPage = this.pages[this.pageIndex]

        this.buttonCollector.stop()
        this.addButtons()
        if (this.buttonMenu.options.length != 0)
            this.menu.edit(this.currentPage.content, { components: [], menus: this.buttonMenu })
        else
            this.menu.edit(this.currentPage.content, { components: [] })
        this.awaitButtons()
    }

    /**
     * React to the new page with all of it's defined reactions
     */
    addButtons() {
        this.buttonMenu.options = [];
        for (const btn of this.currentPage.buttons) {
            this.buttonMenu.addOption(btn[0]);
        }
    }

    /**
     * Start a reaction collector and switch pages where required.
     */
    awaitButtons() {
        this.buttonCollector = this.menu.createMenuCollector((button) => button.clicker.id === this.userID, { idle: this.ms })

        this.buttonCollector.on('end', (i) => {
            // Whether the end was triggered by pressing a reaction or the menu just ended.

            return this.clearButtons()

        })

        this.buttonCollector.on('collect', async (i) => {
            // If the name exists, prioritise using that, otherwise, use the ID. If neither are in the list, don't run anything.
            let button;
            for (const buttons of this.currentPage.buttons) {
                if (buttons[0].value == i.values[0]) {
                    button = buttons[0];
                }

            }
            if (button) {
                if (typeof this.currentPage.buttons.get(button) === 'function') {
                    return this.currentPage.buttons.get(button)(i);
                }
                await i.reply.defer(false);
                switch (this.currentPage.buttons.get(button)) {
                    case 'first':
                        this.setPage(0)
                        break
                    case 'last':
                        this.setPage(this.pages.length - 1)
                        break
                    case 'previous':
                        if (this.pageIndex > 0) {
                            this.setPage(this.pageIndex - 1)
                        }
                        break
                    case 'next':
                        if (this.pageIndex < this.pages.length - 1) {
                            this.setPage(this.pageIndex + 1)
                        }
                        break
                    case 'stop':
                        this.stop()
                        break
                    case 'delete':
                        this.delete()
                        break
                    default:
                        this.setPage(this.pages.findIndex(p => p.name === this.currentPage.buttons.get(button)))
                        break
                }
            }
        })
    }
}

const buttonAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const buttonNumbers = "0123456789";


function randomButtonId() {
    let buttonId = "";
    for (let index = 0; index < 40; index++) {
        if (random(0, 1, false) == 0)
            buttonId += buttonAlphabet[random(0, buttonAlphabet.length - 1, false)];
        else
            buttonId += buttonNumbers[random(0, buttonNumbers.length - 1)];
    }
    return buttonId;
}
