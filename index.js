"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Menu = exports.Page = exports.ButtonOption = exports.MenuOption = exports.Row = exports.RowTypes = exports.setClient = void 0;
const discord_js_1 = require("discord.js");
const events_1 = require("events");
const lodash_1 = require("lodash");
let client;
function setClient(c) {
    client = c;
}
exports.setClient = setClient;
var RowTypes;
(function (RowTypes) {
    RowTypes[RowTypes["SelectMenu"] = 0] = "SelectMenu";
    RowTypes[RowTypes["ButtonMenu"] = 1] = "ButtonMenu";
})(RowTypes = exports.RowTypes || (exports.RowTypes = {}));
class Row {
    buttons;
    rowType;
    constructor(buttons, rowType) {
        this.buttons = buttons;
        this.rowType = rowType;
    }
}
exports.Row = Row;
class MenuOption {
    listOption;
    callback;
    constructor(listOption, callback) {
        this.listOption = listOption;
        this.callback = callback;
    }
}
exports.MenuOption = MenuOption;
class ButtonOption {
    listOption;
    callback;
    constructor(listOption, callback) {
        this.listOption = listOption;
        this.callback = callback;
    }
}
exports.ButtonOption = ButtonOption;
/**
 * A page object that the menu can display.
 */
class Page {
    name;
    content;
    rows;
    index;
    constructor(name, content, rows, index) {
        this.name = name;
        this.content = content;
        this.rows = rows;
        this.index = index;
    }
}
exports.Page = Page;
/**
 * @noInheritDoc only for typedoc. Commenting a comment lol.
 */
class Menu extends events_1.EventEmitter {
    channel;
    userID;
    ms;
    pages;
    currentPage;
    pageIndex;
    buttons;
    menu;
    selectCollector;
    buttonCollector;
    components;
    /**
     *
     * @param channel A channel that the menu will be displayed in
     * @param userID The userId that the bot will assign the menu to
     * @param pages Array of pages to display
     * @param ms Time before the menu stops
     */
    constructor(channel, userID, pages, ms = 180000) {
        if (!client)
            throw new Error("Client hasn't been set");
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
            this.pages.push(new Page(page.name, page.content, page.rows, i));
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
        this.components = [];
    }
    /**
     *
     * Send the message with all of the buttons in the page, then listen for events
     */
    async start() {
        // TODO: Sort out documenting this as a TSDoc event.
        this.emit('pageChange', this.currentPage);
        //@ts-ignore
        if (this.currentPage.rows.length <= 0)
            return this.menu = await this.channel.send({ embeds: [this.currentPage.content] }).catch(console.log);
        this.addRows();
        //@ts-ignore
        this.menu = await this.channel.send({ embeds: [this.currentPage.content], components: this.components }).catch(console.log);
        this.awaitMenu();
        this.awaitButtons();
    }
    /**
     * Stop listening for new events
     */
    stop() {
        if (this.selectCollector)
            this.selectCollector.stop();
        if (this.buttonCollector)
            this.buttonCollector.stop();
    }
    /**
     * Stop listening for new events but without clearing buttons
     */
    stopWithoutClearingButtons() {
        if (this.selectCollector)
            this.selectCollector.stop("clear");
        if (this.buttonCollector)
            this.buttonCollector.stop("clear");
    }
    /**
     *
     * @param rowIndex The row index that contains the button
     * @param buttonIndex Index of the button/select menu option
     * @param i A value to pass into the callback since no interaction data is created
     */
    forceCallback(rowIndex, buttonIndex, i) {
        if (typeof this.pages[this.currentPage.index].rows[rowIndex].buttons[buttonIndex].callback != "function")
            return;
        //@ts-ignore
        this.pages[this.currentPage.index].rows[rowIndex].buttons[buttonIndex].callback(i);
    }
    /**
     * Delete the menu message.
     */
    async delete() {
        if (!this.menu)
            return;
        await this.menu.delete().catch(console.log);
        //for some reason this shit doesn't set itself to true automatically after deleting the message, we'll do it for them
        //Alright now I know why this shit doesn't set itself to true automatically after deleting the message, because it was a buggy mess and they...
        //...finally deprecated it. Whatever I'll use it anyway
        //@ts-ignore
        this.menu.deleted = true;
        if (this.selectCollector)
            this.selectCollector.stop();
        if (this.buttonCollector)
            this.buttonCollector.stop();
    }
    /**
     * Remove all reactions from the menu message.
     */
    async clearButtons() {
        if (!this.menu)
            return;
        //If the menu is deleted, we cant set it's components to nothing because it doesnt exist anymore and we would...
        //...get the unknown message error from discord
        //@ts-ignore
        if (!this.menu.deleted) {
            return await this.menu.edit({ embeds: [this.currentPage.content], components: [] }).catch(console.log);
        }
    }
    /**
     * Jump to a new page in the Menu.
     * @param page The index of the page the Menu should jump to.
     */
    async setPage(page = 0) {
        if (!this.menu)
            return;
        this.emit('pageChange', this.pages[page]);
        this.pageIndex = page;
        this.currentPage = this.pages[this.pageIndex];
        this.selectCollector.stop();
        this.buttonCollector.stop();
        this.addRows();
        if (this.currentPage.rows.length <= 0)
            return this.menu.edit({ embeds: [this.currentPage.content] }).catch(console.log);
        this.menu.edit({ embeds: [this.currentPage.content], components: this.components }).catch(console.log);
        this.awaitMenu();
        this.awaitButtons();
    }
    /**
     * Add all of the rows to the page
     */
    addRows() {
        if (this.currentPage.rows.length > 5)
            throw new Error(`Maximum amount of rows is 5, passed ${this.currentPage.rows.length} rows.`);
        this.components = [];
        //For each row we're checking the row type
        for (const row of this.currentPage.rows) {
            if (row.rowType == RowTypes.ButtonMenu)
                //If the row type is buttons then we add a row to out row array with all of the buttons option
                this.components.push(new discord_js_1.ActionRowBuilder().addComponents(row.buttons.map(btn => new discord_js_1.ButtonBuilder(btn.listOption))));
            else
                this.components.push(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder().setCustomId(randomButtonId()).addOptions(row.buttons.map(btn => btn.listOption))));
        }
    }
    /**
     * Start an interaction collector and switch pages where required
     */
    awaitMenu() {
        this.selectCollector = new discord_js_1.InteractionCollector(client, { filter: (i) => i.member.user.id == this.userID && i.isSelectMenu(), idle: this.ms });
        //@ts-ignore
        this.selectCollector.on("end", (i, reason) => {
            if (reason != "clear")
                return this.clearButtons().catch(console.log);
        });
        this.selectCollector.on('collect', async (i) => {
            let buttonIndex;
            let row = this.currentPage.rows[this.currentPage.rows.findIndex(r => r.buttons[r.buttons.findIndex(opt => opt.listOption.value == i.values[0])])];
            buttonIndex = row.buttons.findIndex(opt => opt.listOption.value == i.values[0]);
            if (buttonIndex != -1) {
                if (typeof row.buttons[buttonIndex].callback === 'function') {
                    //this shit tells me that string is not callable bitch i just fucking checked if it's a function so stfu
                    // Well I added this comment before knowing ts magic, reading twitter really pays off sometimes lol
                    return row.buttons[buttonIndex].callback(i);
                }
                await i.deferUpdate();
                switch (row.buttons[buttonIndex].callback) {
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
                        this.setPage(this.pages.findIndex((p) => p.name === row.buttons[buttonIndex].callback));
                        break;
                }
            }
        });
    }
    /**
     * Start an interaction collector and switch pages where required.
     */
    awaitButtons() {
        this.buttonCollector = new discord_js_1.InteractionCollector(client, { filter: (i) => i.member.user.id === this.userID && i.channel.id === this.channel.id && i.isButton(), idle: this.ms });
        // this.menu.createButtonCollector((button: { clicker: { id: any; }; }) => button.clicker.id === this.userID, { idle: this.ms })
        //@ts-ignore
        this.buttonCollector.on("end", (i, reason) => {
            if (reason != "clear")
                return this.clearButtons().catch(console.log);
        });
        this.buttonCollector.on('collect', async (i) => {
            let buttonIndex;
            let row = this.currentPage.rows[this.currentPage.rows.findIndex(r => r.buttons[r.buttons.findIndex(opt => opt.listOption.customId == i.customId)])];
            buttonIndex = row.buttons.findIndex(opt => opt.listOption.customId == i.customId);
            if (buttonIndex != -1) {
                if (typeof row.buttons[buttonIndex].callback === 'function') {
                    return row.buttons[buttonIndex].callback(i);
                }
                await i.deferUpdate();
                switch (row.buttons[buttonIndex].callback) {
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
                        this.setPage(this.pages.findIndex((p) => p.name === row.buttons[buttonIndex].callback));
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
