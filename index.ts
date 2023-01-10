import { ButtonInteraction, StringSelectMenuInteraction, Client, EmbedBuilder, SelectMenuComponentOptionData, ButtonBuilder, Message, InteractionCollector, MessageActionRowComponent, StringSelectMenuBuilder, ButtonComponentData, TextBasedChannel, ActionRow, ActionRowBuilder } from "discord.js";
import { EventEmitter } from "events"
import { random } from "lodash"
export type ButtonCallback = (btn: ButtonInteraction) => void
export type SelectCallback = (row: StringSelectMenuInteraction) => void

let client: Client;


export function setClient(c: Client) {
    client = c;
}


export enum RowTypes {
    SelectMenu = 0,
    ButtonMenu = 1
}


export class Row {
    buttons: ButtonOption[] | MenuOption[];
    rowType: RowTypes;
    constructor(buttons: MenuOption[], rowType: RowTypes.SelectMenu)
    constructor(buttons: ButtonOption[], rowType: RowTypes.ButtonMenu)
    constructor(buttons: MenuOption[] | ButtonOption[], rowType: RowTypes) {
        this.buttons = buttons;
        this.rowType = rowType;
    }

}

export class MenuOption {
    listOption: SelectMenuComponentOptionData;
    callback: SelectCallback | string;
    constructor(listOption: SelectMenuComponentOptionData, callback: SelectCallback | string) {
        this.listOption = listOption;
        this.callback = callback;
    }

}

export class ButtonOption {
    listOption: ButtonComponentData;
    callback: ButtonCallback | string;
    constructor(listOption: ButtonComponentData, callback: ButtonCallback | string) {
        this.listOption = listOption;
        this.callback = callback;
    }

}


/**
 * A page object that the menu can display.
 */
export class Page {
    name: string;
    content: EmbedBuilder;
    rows: Row[];
    index?: number;
    constructor(name: string, content: EmbedBuilder, rows: Row[], index?: number) {
        this.name = name
        this.content = content
        this.rows = rows
        this.index = index

    }
}

/**
 * @noInheritDoc only for typedoc. Commenting a comment lol.
 */

export class Menu extends EventEmitter {

    channel: TextBasedChannel;
    userID: string;
    ms: number;
    pages: Page[];
    currentPage: Page;
    pageIndex: number;
    buttons: MenuOption[];
    menu: Message;
    selectCollector: InteractionCollector<StringSelectMenuInteraction>;
    buttonCollector: InteractionCollector<ButtonInteraction>;
    components: ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[];
    /**
     * 
     * @param channel A channel that the menu will be displayed in
     * @param userID The userId that the bot will assign the menu to
     * @param pages Array of pages to display
     * @param ms Time before the menu stops
     */
    constructor(channel: TextBasedChannel, userID: string, pages: Page[], ms = 180000) {
        if (!client) throw new Error("Client hasn't been set");
        super()
        this.channel = channel
        this.userID = userID
        this.ms = ms

        /**
         * List of pages available to the Menu.
         * @type {Page[]}
         */
        this.pages = []

        let i = 0
        pages.forEach((page: Page) => {
            this.pages.push(new Page(page.name, page.content, page.rows, i))
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

        this.components = [];



    }

    /**
     * 
     * Send the message with all of the buttons in the page, then listen for events
     */
    async start() {
        // TODO: Sort out documenting this as a TSDoc event.
        this.emit('pageChange', this.currentPage)
        //@ts-ignore
        if (this.currentPage.rows.length <= 0) return this.menu = await this.channel.send({ embeds: [this.currentPage.content] }).catch(console.log);

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
            this.selectCollector.stop()
        if (this.buttonCollector)
            this.buttonCollector.stop();
    }

    /**
     * Stop listening for new events but without clearing buttons
     */
    async stopWithoutClearingButtons() {
        if (this.selectCollector)
            this.selectCollector.stop("clear")
        if (this.buttonCollector)
            this.buttonCollector.stop("clear");

    }
    /**
     * 
     * @param rowIndex The row index that contains the button
     * @param buttonIndex Index of the button/select menu option
     * @param i A value to pass into the callback since no interaction data is created 
     */
    forceCallback(rowIndex: number, buttonIndex: number, i) {
        if (typeof this.pages[this.currentPage.index].rows[rowIndex].buttons[buttonIndex].callback != "function") return;
        //@ts-ignore
        this.pages[this.currentPage.index].rows[rowIndex].buttons[buttonIndex].callback(i);
    }

    /**
     * Delete the menu message.
     */
    async delete() {
        if (!this.menu) return;
        await this.menu.delete().catch(console.log);
        //for some reason this shit doesn't set itself to true automatically after deleting the message, we'll do it for them
        //Alright now I know why this shit doesn't set itself to true automatically after deleting the message, because it was a buggy mess and they...
        //...finally deprecated it. Whatever I'll use it anyway
        //@ts-ignore
        this.menu.deleted = true;

        if (this.selectCollector)
            this.selectCollector.stop()
        if (this.buttonCollector)
            this.buttonCollector.stop();
    }

    /**
     * Remove all reactions from the menu message.
     */
    async clearButtons() {
        if (!this.menu) return;
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
    async setPage(page: number = 0) {
        if (!this.menu) return;
        this.emit('pageChange', this.pages[page])
        this.pageIndex = page
        this.currentPage = this.pages[this.pageIndex]
        this.selectCollector.stop()
        this.buttonCollector.stop();
        this.addRows();
        if (this.currentPage.rows.length <= 0) return this.menu.edit({ embeds: [this.currentPage.content] }).catch(console.log);

        this.menu.edit({ embeds: [this.currentPage.content], components: this.components }).catch(console.log);
        this.awaitMenu();
        this.awaitButtons();
    }

    /**
     * Add all of the rows to the page
     */
    addRows() {
        if (this.currentPage.rows.length > 5) throw new Error(`Maximum amount of rows is 5, passed ${this.currentPage.rows.length} rows.`)
        this.components = [];
        //For each row we're checking the row type
        for (const row of this.currentPage.rows) {
            if (row.rowType == RowTypes.ButtonMenu)
                //If the row type is buttons then we add a row to out row array with all of the buttons option
                this.components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(row.buttons.map(btn => new ButtonBuilder(btn.listOption))));
            else
                this.components.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(new StringSelectMenuBuilder().setCustomId(randomButtonId()).addOptions(row.buttons.map(btn => btn.listOption))));
        }
    }

    /**
     * Start an interaction collector and switch pages where required
     */
    awaitMenu() {
        this.selectCollector = new InteractionCollector<StringSelectMenuInteraction>(client, { filter: (i) => i.member.user.id == this.userID && i.isStringSelectMenu(), idle: this.ms })
        //@ts-ignore
        this.selectCollector.on("end", (i, reason: string) => {
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
                    return (row.buttons[buttonIndex].callback as Function)(i);
                }
                await i.deferUpdate();
                switch (row.buttons[buttonIndex].callback) {
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
                        this.setPage(this.pages.findIndex((p: { name: any; }) => p.name === row.buttons[buttonIndex].callback))
                        break
                }
            }
        })
    }

    /**
     * Start an interaction collector and switch pages where required.
     */
    awaitButtons() {
        this.buttonCollector = new InteractionCollector<ButtonInteraction>(client, { filter: (i) => i.member.user.id === this.userID && i.channel.id === this.channel.id && i.isButton(), idle: this.ms, })
        // this.menu.createButtonCollector((button: { clicker: { id: any; }; }) => button.clicker.id === this.userID, { idle: this.ms })

        //@ts-ignore
        this.buttonCollector.on("end", (i, reason: string) => {
            if (reason != "clear")
                return this.clearButtons().catch(console.log);
        })


        this.buttonCollector.on('collect', async (i) => {
            let buttonIndex;
            let row = this.currentPage.rows[this.currentPage.rows.findIndex(r => r.buttons[r.buttons.findIndex(opt => opt.listOption.customId == i.customId)])];
            buttonIndex = row.buttons.findIndex(opt => opt.listOption.customId == i.customId);


            if (buttonIndex != -1) {
                if (typeof row.buttons[buttonIndex].callback === 'function') {
                    return (row.buttons[buttonIndex].callback as Function)(i);
                }
                await i.deferUpdate();

                switch (row.buttons[buttonIndex].callback) {
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
                        this.setPage(this.pages.findIndex((p: Page) => p.name === row.buttons[buttonIndex].callback));
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

