import { ButtonInteraction, StringSelectMenuInteraction, Client, EmbedBuilder, SelectMenuComponentOptionData, ButtonBuilder, Message, InteractionCollector, StringSelectMenuBuilder, ButtonComponentData, TextBasedChannel, ActionRowBuilder } from "discord.js";
import { EventEmitter } from "events";
export declare type ButtonCallback = (btn: ButtonInteraction) => void;
export declare type SelectCallback = (row: StringSelectMenuInteraction) => void;
export declare function setClient(c: Client): void;
export declare enum RowTypes {
    SelectMenu = 0,
    ButtonMenu = 1
}
export declare class Row {
    buttons: ButtonOption[] | MenuOption[];
    rowType: RowTypes;
    constructor(buttons: MenuOption[], rowType: RowTypes.SelectMenu);
    constructor(buttons: ButtonOption[], rowType: RowTypes.ButtonMenu);
}
export declare class MenuOption {
    listOption: SelectMenuComponentOptionData;
    callback: SelectCallback | string;
    constructor(listOption: SelectMenuComponentOptionData, callback: SelectCallback | string);
}
export declare class ButtonOption {
    listOption: ButtonComponentData;
    callback: ButtonCallback | string;
    constructor(listOption: ButtonComponentData, callback: ButtonCallback | string);
}
/**
 * A page object that the menu can display.
 */
export declare class Page {
    name: string;
    content: EmbedBuilder;
    rows: Row[];
    index?: number;
    constructor(name: string, content: EmbedBuilder, rows: Row[], index?: number);
}
/**
 * @noInheritDoc only for typedoc. Commenting a comment lol.
 */
export declare class Menu extends EventEmitter {
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
    constructor(channel: TextBasedChannel, userID: string, pages: Page[], ms?: number);
    /**
     *
     * Send the message with all of the buttons in the page, then listen for events
     */
    start(): Promise<void | Message<boolean>>;
    /**
     * Stop listening for new events
     */
    stop(): void;
    /**
     * Stop listening for new events but without clearing buttons
     */
    stopWithoutClearingButtons(): void;
    /**
     *
     * @param rowIndex The row index that contains the button
     * @param buttonIndex Index of the button/select menu option
     * @param i A value to pass into the callback since no interaction data is created
     */
    forceCallback(rowIndex: number, buttonIndex: number, i: any): void;
    /**
     * Delete the menu message.
     */
    delete(): Promise<void>;
    /**
     * Remove all reactions from the menu message.
     */
    clearButtons(): Promise<void | Message<boolean>>;
    /**
     * Jump to a new page in the Menu.
     * @param page The index of the page the Menu should jump to.
     */
    setPage(page?: number): Promise<void | Message<boolean>>;
    /**
     * Add all of the rows to the page
     */
    addRows(): void;
    /**
     * Start an interaction collector and switch pages where required
     */
    awaitMenu(): void;
    /**
     * Start an interaction collector and switch pages where required.
     */
    awaitButtons(): void;
}
