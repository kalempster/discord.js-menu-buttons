import { MessageButtonOptions, MessageComponent, MessageMenuOption } from "discord-buttons";
import { Channel, Client, MessageEmbed } from "discord.js";

declare function init(client: Client): void;
export default init;
export type ButtonCallback = (btn : MessageComponent) => void

declare class Page {
    constructor(name: string, content: MessageEmbed, buttons: Map<MessageMenuOption, string | ButtonCallback>, index: number)
    name: string
    content: MessageEmbed
    buttons: Map<MessageMenuOption, string | ButtonCallback /* Hey if you specified a function as the map value I'm passing btn : MessageComponent */>
}

export class Menu {
    constructor(channel: Channel, userID: string, pages: Page[], ms?: number)
    start(): Promise<void>
    stop(): void
    delete(): void
    clearButtons(): void
    setPage(): Promise<void>
    addButtons(): void
    awaitButtons(): void
}

export class MenuButton{
    constructor(buttonOption : MessageButtonOptions, callback : string | ButtonCallback)
    buttonOption : MessageButtonOptions
    callback : string | ButtonCallback
}

export class MenuOption{
    constructor(listOption : MessageMenuOption, callback : string | ButtonCallback)
    listOption : MessageMenuOption
    callback : string | ButtonCallback
}

export class MenuButtonsList{
    list : Map<MessageButtonOptions, string | ButtonCallback>;
    addButton(buttonOption : MenuButton) : MenuButtonsList
    addButtons(buttonOptions : MenuButton[]) : MenuButtonsList
    removeButton(buttonOption : MessageButtonOptions) : MenuButtonsList
}

export class MenuOptionsList{
    list : Map<MessageMenuOption, string | ButtonCallback>;
    addOption(listOption : MenuOption) : MenuOptionsList
    addOptions(listOptions : MenuOption[]) : MenuOptionsList
    removeOption(listOption : MessageMenuOption) : MenuOptionsList
}


declare class ButtonPage {
    constructor(name: string, content: MessageEmbed, buttons: Map<MessageMenuOption, string | ButtonCallback>, index: number)
    name: string
    content: MessageEmbed
    buttons: Map<MessageButtonOptions, string | ButtonCallback>
}

export class ButtonMenu {
    constructor(channel: Channel, userID: string, pages: ButtonPage[], ms?: number)
    start(): Promise<void>
    stop(): void
    delete(): void
    clearButtons(): void
    setPage(): Promise<void>
    addButtons(): void
    awaitButtons(): void
}

