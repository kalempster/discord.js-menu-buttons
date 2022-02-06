# discord.js-menu-buttons
At first I would like to clarify that this package is just a modification to an already existing package discord.js-menu-reactions but since the autor of that package
is unactive and the package is stuck in discord.jsV12 I made a modified version of this package that is up to date. Also some of the readme will be stripped of right 
from the original package since I'm too lazy to type this shit in.

# Docs
Here are the [docs](https://kalempster.github.io/discord.js-menu-buttons-docs/) for the module although you can see the usage below 

### Usage
Using this package is quite simple and simmilar to the original so if you've used Jowsey's package before you'll be familiar with this setup.
In this example I'm creating a menu that has 2 pages, "page 1" and "page 2". "page 1" has two buttons one for the bot to send a message saying hello
and the other to move to page 2. All of the code will be in typescript (and I highly encourage you to use it). Everything in the bot is documented in typescript so you don't have to worry
about not working intelisense.

# Initializing
The bot requires giving it a client variable since InteractionCollector needs it.
To initialize the bot you have to execute the function named setClient
```typescript
import { Client, MessageEmbed } from "discord.js";
import { Menu } from "discord.js-menu-buttons";
const client = new Client({ intents: ["GUILDS", "GUILD_MESSAGES"] });
setClient(client);
```

# Menu
```typescript
const menu = new Menu(message.channel, message.author.id, [
{
    name: "page1",
    content: new MessageEmbed().setTitle("Hello!"),
    rows: [
        new Row([
            new ButtonOption(
                {
                    customId: "thisHasToBeRandomAndDifferentFromEveryButton",
                    style: "PRIMARY",
                    label: "Button1"
                },
                (i) => {
                    i.deferUpdate();
                    console.log("Clicked button1 " + i.customId)
                }
            ),
            new ButtonOption(
                {
                    customId: "thisHasToBeRandomAndDifferentFromEveryButton1",
                    style: "PRIMARY",
                    label: "Button2"
                },
                (i) => {
                    i.deferUpdate();
                    console.log("Clicked button1 " + i.customId)
                    
                }
            )
        ], RowTypes.ButtonMenu),
        new Row([
            new MenuOption(
                {
                    label: "lbl",
                    value: "value",
                },
                (i) => {
                    i.deferUpdate();
                    console.log(i.values[0]); //value
                }
            )
        ], RowTypes.SelectMenu),
        new Row([
            new MenuOption(
                {
                    label: "label",
                    description: "description",
                    value: "val"
                },
                "page2"
            )
        ], RowTypes.SelectMenu)
    ]
},
{
    name: "page2",
    content: new MessageEmbed().setTitle("Page2"),
    rows: [
        new Row([
            new MenuOption(
                {
                    label: "label1",
                    value: "value1",
                },
                (i) => {
                    i.deferUpdate();
                    console.log(i.values[0]);
                }
            ),
            new MenuOption(
                {
                    label: "go to page1",
                    value: "value2"
                },
                "page1"
            )
        ], RowTypes.SelectMenu)
    ]
}
])
menu.start();
```


### Special Destinations
You may have noticed I mentioned "special destinations" above.   
discord.js-menu-buttons comes with 6 pre-defined destinations with specific uses.

| Destination 	| Function                                                      	|
|-------------	|---------------------------------------------------------------	|
| first       	| Goes to the first page in the array.                          	|
| last        	| Goes to the last page in the array.                           	|
| previous    	| Goes to the previous page in the array.                       	|
| next        	| Goes to the next page in the array.                           	|
| stop        	| Removes reactions from the embed and stops updating the menu. 	|
| delete      	| Stops the menu and deletes the message.                       	|

Note that whilst calling a page one of these wouldn't break anything (the page would still be accessible using, ironically, the special destinations) you wouldn't be able to directly link to it.

### Acknowledgements
Major parts of this project were by Jowsey's [discord.js-menu](https://github.com/jowsey/discord.js-menu).  