"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Menu = exports.ButtonMenu = exports.Page = exports.MenuButton = exports.MenuOption = exports.ButtonPage = void 0;
const discord_js_1 = require("discord.js");
const events_1 = require("events");
const lodash_1 = require("lodash");
let client;
/**
 * Initializes
 * @param {Client} c
 */
exports.default = (c) => {
    client = c;
};
/**
 * A page object that the menu can display.
 */
class ButtonPage {
    name;
    content;
    buttons;
    index;
    constructor(name, content, buttons, index) {
        this.name = name;
        this.content = content;
        this.buttons = buttons;
        this.index = index;
    }
}
exports.ButtonPage = ButtonPage;
class MenuOption {
    listOption;
    callback;
    constructor(listOption, callback) {
        this.listOption = listOption;
        this.callback = callback;
    }
}
exports.MenuOption = MenuOption;
class MenuButton {
    buttonOption;
    callback;
    constructor(buttonOption, callback) {
        this.buttonOption = buttonOption;
        this.callback = callback;
    }
}
exports.MenuButton = MenuButton;
/**
 * A page object that the menu can display.
 */
class Page {
    name;
    content;
    buttons;
    index;
    constructor(name, content, buttons, index) {
        this.name = name;
        this.content = content;
        this.buttons = buttons;
        this.index = index;
    }
}
exports.Page = Page;
/**
 * A menu with customisable reactions for every page.
 * Blacklisted page names are: `first, last, previous, next, stop, delete`.
 * These names perform special functions and should only be used as reaction destinations.
 */
class ButtonMenu extends events_1.EventEmitter {
    channel;
    userID;
    ms;
    pages;
    currentPage;
    pageIndex;
    buttons;
    menu;
    buttonCollector;
    constructor(channel, userID, pages, ms = 180000) {
        super();
        this.channel = channel;
        this.userID = userID;
        this.ms = ms;
        /**
         * List of pages available to the Menu.
         * @type {ButtonPage[]}
         */
        this.pages = [];
        let i = 0;
        pages.forEach((page) => {
            this.pages.push(new ButtonPage(page.name, page.content, page.buttons, i));
            i++;
        });
        /**
         * The page the Menu is currently displaying in chat.
         * @type {ButtonPage}
         */
        this.currentPage = this.pages[0];
        /**
         * The index of the Pages array we're currently on.
         * @type {Number}
         */
        this.pageIndex = 0;
        this.buttons = [];
    }
    /**
     * Send the Menu and begin listening for reactions.
     */
    async start() {
        // TODO: Sort out documenting this as a TSDoc event.
        this.emit('pageChange', this.currentPage);
        this.addButtons();
        const components = [];
        for (const button of this.buttons) {
            components.push(button.buttonOption);
        }
        this.menu = await this.channel.send({ embeds: [this.currentPage.content], components: [new discord_js_1.MessageActionRow().addComponents(components)] });
        this.awaitButtons();
    }
    /**
     * Stop listening for new reactions.
     */
    stop() {
        if (this.buttonCollector) {
            this.buttonCollector.stop();
        }
    }
    stopWithoutClearingButtons() {
        if (this.buttonCollector) {
            this.buttonCollector.stop("clear");
        }
    }
    /**
     * Delete the menu message.
     */
    async delete() {
        if (this.menu) {
            await this.menu.delete();
            //for some reason this shit doesn't set itself to true automatically after deleting the message, we'll do it for them
            this.menu.deleted = true;
        }
        if (this.buttonCollector)
            this.buttonCollector.stop();
    }
    /**
     * Remove all reactions from the menu message.
     */
    async clearButtons() {
        //if the menu is deleted, we cant set it's components to nothing because it doesnt exist anymore and we would
        //get the unknown message error from discord
        if (!this.menu.deleted) {
            return await this.menu.edit({ embeds: [this.currentPage.content], components: [] });
        }
    }
    async setPage(page = 0) {
        this.emit('pageChange', this.pages[page]);
        this.pageIndex = page;
        this.currentPage = this.pages[this.pageIndex];
        this.buttonCollector.stop();
        this.addButtons();
        if (this.currentPage.buttons.length != 0) {
            this.menu.components = [];
            const components = [];
            for (const button of this.buttons) {
                components.push(button.buttonOption);
            }
            this.menu.edit({ embeds: [this.currentPage.content], components: [new discord_js_1.MessageActionRow().addComponents(components)] });
        }
        else
            this.menu.edit({ embeds: [this.currentPage.content], components: [] });
        this.awaitButtons();
    }
    /**
     * React to the new page with all of it's defined reactions
     */
    addButtons() {
        this.buttons = [];
        for (const btn of this.currentPage.buttons) {
            this.buttons.push(btn);
        }
    }
    /**
     * Start a reaction collector and switch pages where required.
     */
    awaitButtons() {
        this.buttonCollector = new discord_js_1.InteractionCollector(client, { filter: (i) => i.member.user.id === this.userID && i.isButton(), idle: 180000, });
        // this.menu.createButtonCollector((button: { clicker: { id: any; }; }) => button.clicker.id === this.userID, { idle: this.ms })
        //@ts-ignore
        this.buttonCollector.on("end", (i, reason) => {
            if (reason != "clear")
                return this.clearButtons();
        });
        this.buttonCollector.on('collect', async (i) => {
            let buttonIndex;
            //@ts-ignore
            buttonIndex = this.currentPage.buttons.findIndex(btn => btn.buttonOption.customId == i.customId);
            if (buttonIndex != -1) {
                if (typeof this.currentPage.buttons[buttonIndex].callback === 'function') {
                    //@ts-ignore this shit tells me that string is not callable bitch i just fucking checked if it's a function so stfu
                    return this.currentPage.buttons[buttonIndex].callback(i);
                }
                await i.deferUpdate();
                switch (this.currentPage.buttons[buttonIndex].callback) {
                    case 'first':
                        this.setPage(0);
                        break;
                    case 'last':
                        this.setPage(this.pages.length - 1);
                        break;
                    case 'previous':
                        if (this.pageIndex > 0) {
                            this.setPage(this.pageIndex - 1);
                        }
                        break;
                    case 'next':
                        if (this.pageIndex < this.pages.length - 1) {
                            this.setPage(this.pageIndex + 1);
                        }
                        break;
                    case 'stop':
                        this.stop();
                        break;
                    case 'delete':
                        this.delete();
                        break;
                    default:
                        this.setPage(this.pages.findIndex((p) => p.name === this.currentPage.buttons[buttonIndex].callback));
                        break;
                }
            }
        });
    }
}
exports.ButtonMenu = ButtonMenu;
class Menu extends events_1.EventEmitter {
    channel;
    userID;
    ms;
    pages;
    currentPage;
    pageIndex;
    buttons;
    menu;
    buttonCollector;
    buttonMenu;
    constructor(channel, userID, pages, ms = 180000) {
        super();
        this.channel = channel;
        this.userID = userID;
        this.ms = ms;
        /**
         * List of pages available to the Menu.
         * @type {Page[]}
         */
        this.pages = [];
        let i = 0;
        pages.forEach((page) => {
            this.pages.push(new Page(page.name, page.content, page.buttons, i));
            i++;
        });
        /**
         * The page the Menu is currently displaying in chat.
         * @type {Page}
         */
        this.currentPage = this.pages[0];
        /**
         * The index of the Pages array we're currently on.
         * @type {Number}
         */
        this.pageIndex = 0;
        this.buttonMenu = new discord_js_1.MessageSelectMenu()
            .setCustomId(randomButtonId());
    }
    /**
     * Send the Menu and begin listening for reactions.
     */
    async start() {
        // TODO: Sort out documenting this as a TSDoc event.
        this.emit('pageChange', this.currentPage);
        this.addButtons();
        this.menu = await this.channel.send({ embeds: [this.currentPage.content], components: [new discord_js_1.MessageActionRow().addComponents([this.buttonMenu])] });
        this.awaitButtons();
    }
    /**
     * Stop listening for new reactions.
     */
    stop() {
        if (this.buttonCollector) {
            this.buttonCollector.stop();
        }
    }
    stopWithoutClearingButtons() {
        if (this.buttonCollector) {
            this.buttonCollector.stop("clear");
        }
    }
    /**
     * Delete the menu message.
     */
    async delete() {
        if (this.menu) {
            await this.menu.delete();
            //for some reason this shit doesn't set itself to true automatically after deleting the message, we'll do it for them
            this.menu.deleted = true;
        }
        if (this.buttonCollector)
            this.buttonCollector.stop();
    }
    /**
     * Remove all reactions from the menu message.
     */
    async clearButtons() {
        //if the menu is deleted, we cant set it's components to nothing because it doesnt exist anymore and we would
        //get the unknown message error from discord
        if (!this.menu.deleted) {
            return await this.menu.edit({ embeds: [this.currentPage.content], components: [] });
        }
    }
    /**
     * Jump to a new page in the Menu.
     * @param {Number} page The index of the page the Menu should jump to.
     */
    async setPage(page = 0) {
        this.emit('pageChange', this.pages[page]);
        this.pageIndex = page;
        this.currentPage = this.pages[this.pageIndex];
        this.buttonCollector.stop();
        this.addButtons();
        if (this.buttonMenu.options.length != 0) {
            this.menu.components = [];
            this.menu.edit({ embeds: [this.currentPage.content], components: [new discord_js_1.MessageActionRow().addComponents([this.buttonMenu])] });
        }
        else
            this.menu.edit({ embeds: [this.currentPage.content], components: [] });
        this.awaitButtons();
    }
    /**
     * React to the new page with all of it's defined reactions
     */
    addButtons() {
        this.buttonMenu.options = [];
        for (const btn of this.currentPage.buttons) {
            this.buttonMenu.addOptions(btn.listOption);
        }
    }
    /**
     * Start a reaction collector and switch pages where required.
     */
    awaitButtons() {
        this.buttonCollector = new discord_js_1.InteractionCollector(client, { filter: (i) => i.member.user.id == this.userID && i.isSelectMenu(), idle: 180000 });
        // this.menu.createMenuCollector((button: { clicker: { id: any; }; }) => button.clicker.id === this.userID, { idle: this.ms })
        //@ts-ignore
        this.buttonCollector.on('end', (i, reason) => {
            if (reason != "clear")
                return this.clearButtons();
        });
        this.buttonCollector.on('collect', async (i) => {
            // If the name exists, prioritise using that, otherwise, use the ID. If neither are in the list, don't run anything.
            let buttonIndex;
            buttonIndex = this.currentPage.buttons.findIndex(opt => opt.listOption.value == i.values[0]);
            if (buttonIndex != -1) {
                if (typeof this.currentPage.buttons[buttonIndex].callback === 'function') {
                    //@ts-ignore this shit tells me that string is not callable bitch i just fucking checked if it's a function so stfu
                    return this.currentPage.buttons[buttonIndex].callback(i);
                }
                await i.deferReply();
                switch (this.currentPage.buttons[buttonIndex].callback) {
                    case 'first':
                        this.setPage(0);
                        break;
                    case 'last':
                        this.setPage(this.pages.length - 1);
                        break;
                    case 'previous':
                        if (this.pageIndex > 0) {
                            this.setPage(this.pageIndex - 1);
                        }
                        break;
                    case 'next':
                        if (this.pageIndex < this.pages.length - 1) {
                            this.setPage(this.pageIndex + 1);
                        }
                        break;
                    case 'stop':
                        this.stop();
                        break;
                    case 'delete':
                        this.delete();
                        break;
                    default:
                        this.setPage(this.pages.findIndex((p) => p.name === this.currentPage.buttons[buttonIndex].callback));
                        break;
                }
            }
        });
    }
}
exports.Menu = Menu;
const buttonAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const buttonNumbers = "0123456789";
function randomButtonId() {
    let buttonId = "";
    for (let index = 0; index < 40; index++) {
        if ((0, lodash_1.random)(0, 1, false) == 0)
            buttonId += buttonAlphabet[(0, lodash_1.random)(0, buttonAlphabet.length - 1, false)];
        else
            buttonId += buttonNumbers[(0, lodash_1.random)(0, buttonNumbers.length - 1)];
    }
    return buttonId;
}
