import { ButtonInteraction, Client, InteractionCollector, Message, MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu, MessageSelectMenuOptions, MessageSelectOptionData, SelectMenuInteraction, TextChannel } from "discord.js";
import { EventEmitter } from "events"
import { random } from "lodash"
export type ButtonCallback = (btn: ButtonInteraction) => void
export type SelectCallback = (row: SelectMenuInteraction) => void

let client: Client;



/**
 * Initializes
 * @param {Client} c 
 */
export default (c: Client) => {
    client = c;
}


/**
 * A page object that the menu can display.
 */
export class ButtonPage {
    name: string;
    content: MessageEmbed;
    buttons: MenuButton[];
    index: number
    constructor(name: string, content: MessageEmbed, buttons: MenuButton[], index: number) {
        this.name = name
        this.content = content
        this.buttons = buttons
        this.index = index
    }
}

export class MenuOption {
    listOption: MessageSelectOptionData;
    callback: SelectCallback | string;
    constructor(listOption: MessageSelectOptionData, callback: SelectCallback | string) {
        this.listOption = listOption;
        this.callback = callback;
    }

}

export class MenuButton {
    buttonOption: MessageButton;
    callback: ButtonCallback | string;
    constructor(buttonOption: MessageButton, callback: ButtonCallback | string) {
        this.buttonOption = buttonOption;
        this.callback = callback;
    }
}

 


/**
 * A page object that the menu can display.
 */
export class Page {
    name: string;
    content: MessageEmbed;
    buttons: MenuOption[];
    index: number;
    constructor(name: string, content: MessageEmbed, buttons: MenuOption[], index: number) {
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
 export class ButtonMenu extends EventEmitter {

    channel: TextChannel;
    userID: string;
    ms: number;
    pages: ButtonPage[];
    currentPage: ButtonPage;
    pageIndex: number;
    buttons: MenuButton[];
    menu: Message;
    buttonCollector: InteractionCollector<ButtonInteraction>;
    constructor(channel: TextChannel, userID: string, pages: ButtonPage[], ms = 180000) {
        super()
        this.channel = channel
        this.userID = userID
        this.ms = ms

        /**
         * List of pages available to the Menu.
         * @type {ButtonPage[]}
         */
        this.pages = []

        let i = 0
        pages.forEach((page: ButtonPage) => {
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
        const components : MessageButton[] = [];
        for (const button of this.buttons) {
            components.push(button.buttonOption);
        }
        this.menu = await this.channel.send({ embeds: [this.currentPage.content], components: [new MessageActionRow().addComponents(components)] });
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
    async delete() {
        if (this.buttonCollector) this.buttonCollector.stop()
        if (this.menu) await this.menu.delete()
    }

    /**
     * Remove all reactions from the menu message.
     */
    clearButtons() {
        if (this.menu) {
            return this.menu.edit({ embeds: [this.currentPage.content], components: [] });
        }
    }


    async setPage(page: number = 0) {
        this.emit('pageChange', this.pages[page])

        this.pageIndex = page
        this.currentPage = this.pages[this.pageIndex]

        this.buttonCollector.stop()
        this.addButtons()
        if (this.currentPage.buttons.length != 0) {
            this.menu.components = [];
            const components : MessageButton[] = [];
            for (const button of this.buttons) {
                components.push(button.buttonOption)
            }
            this.menu.edit({ embeds: [this.currentPage.content], components: [new MessageActionRow().addComponents(components)] })

        }
        else
            this.menu.edit({ embeds: [this.currentPage.content], components: [] })

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
        this.buttonCollector = new InteractionCollector<ButtonInteraction>(client, { filter: (i) => i.member.user.id === this.userID && i.isButton(), idle: 180000 })
        // this.menu.createButtonCollector((button: { clicker: { id: any; }; }) => button.clicker.id === this.userID, { idle: this.ms })

        //@ts-ignore
        this.buttonCollector.on("end", (i) => {
            return this.clearButtons();
        })


        this.buttonCollector.on('collect', async (i) => {
            let buttonIndex;
            
            buttonIndex = this.currentPage.buttons.findIndex(btn => btn.buttonOption.customId == i.customId);

           
            if (buttonIndex != -1) {
                if (typeof this.currentPage.buttons[buttonIndex].callback === 'function') {
                    //@ts-ignore this shit tells me that string is not callable bitch i just fucking checked if it's a function so stfu
                    return this.currentPage.buttons[buttonIndex].callback(i);
                }
                await i.deferUpdate();

                switch (this.currentPage.buttons[buttonIndex].callback) {
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
                        this.setPage(this.pages.findIndex((p: ButtonPage) => p.name === this.currentPage.buttons[buttonIndex].callback))
                        break
                }
            }
        })
    }
}

export class Menu extends EventEmitter {

    channel: TextChannel;
    userID: string;
    ms: number;
    pages: Page[];
    currentPage: Page;
    pageIndex: number;
    buttons: MenuOption[];
    menu: Message;
    buttonCollector: InteractionCollector<SelectMenuInteraction>;
    buttonMenu: MessageSelectMenu;
    constructor(channel: TextChannel, userID: string, pages: Page[], ms = 180000) {
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
        pages.forEach((page : Page) => {
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

        this.buttonMenu = new MessageSelectMenu()
            .setCustomId(randomButtonId())
    }

    /**
     * Send the Menu and begin listening for reactions.
     */
    async start() {
        // TODO: Sort out documenting this as a TSDoc event.
        this.emit('pageChange', this.currentPage)
        this.addButtons();
        
        this.menu = await this.channel.send({ embeds: [this.currentPage.content], components: [new MessageActionRow().addComponents([this.buttonMenu])] });
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
    async delete() {
        if (this.buttonCollector) this.buttonCollector.stop()
        if (this.menu) await this.menu.delete()
    }

    /**
     * Remove all reactions from the menu message.
     */
    clearButtons() {
        if (this.menu) {
            return this.menu.edit({ embeds: [this.currentPage.content], components: [] });
        }
    }

    /**
     * Jump to a new page in the Menu.
     * @param {Number} page The index of the page the Menu should jump to.
     */
    async setPage(page: number = 0) {
        this.emit('pageChange', this.pages[page])

        this.pageIndex = page
        this.currentPage = this.pages[this.pageIndex]

        this.buttonCollector.stop()
        this.addButtons()
        if (this.buttonMenu.options.length != 0) {
            this.menu.components = [];
            this.menu.edit({ embeds: [this.currentPage.content], components: [new MessageActionRow().addComponents([this.buttonMenu])] })
        }
        else
            this.menu.edit({ embeds: [this.currentPage.content], components: [] })
        this.awaitButtons()
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
        this.buttonCollector = new InteractionCollector<SelectMenuInteraction>(client, { filter: (i) => i.member.user.id == this.userID && i.isSelectMenu(), idle: 180000 })
        // this.menu.createMenuCollector((button: { clicker: { id: any; }; }) => button.clicker.id === this.userID, { idle: this.ms })
        //@ts-ignore
        this.buttonCollector.on('end', (i: any) => {
            return this.clearButtons()
        })

        this.buttonCollector.on('collect', async (i) => {
            // If the name exists, prioritise using that, otherwise, use the ID. If neither are in the list, don't run anything.
            let buttonIndex;
           
            buttonIndex = this.currentPage.buttons.findIndex(opt => opt.listOption.value == i.values[0])

           
            if (buttonIndex != -1) {
                if (typeof this.currentPage.buttons[buttonIndex].callback === 'function') {
                    //@ts-ignore this shit tells me that string is not callable bitch i just fucking checked if it's a function so stfu
                    return this.currentPage.buttons[buttonIndex].callback(i);
                }
                await i.deferReply();
                switch (this.currentPage.buttons[buttonIndex].callback) {
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
                        this.setPage(this.pages.findIndex((p: { name: any; }) => p.name === this.currentPage.buttons[buttonIndex].callback))
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
 