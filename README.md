# discord.js-menu-buttons
At first I would like to clarify that this package is just a modification to an already existing package discord.js-menu-reactions but since the autor of that package
is unactive and the package is stuck in discord.jsV12 I made a modified version of this package that is up to date. Also some of the readme will be stripped of right 
from the original package since I'm too lazy to type this shit in.

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
import { ButtonMenu, setClient } from "discord.js-menu-buttons";
const client = new Client({ intents: ["GUILDS", "GUILD_MESSAGES"] });
setClient(client);
```

# ButtonMenu
```typescript


const buttonMenu = new ButtonMenu(message.channel, message.author.id, [
    {
        name: "page1",
        content: new MessageEmbed().setTitle("Hey!"),
        buttons: [
            {
                buttonOption: {
                    label: "Hey this is the first option!",
                    customId: "thishastobedifferentforeachbutton",
                    style: "PRIMARY",
                    type: "BUTTON",
                    emoji: "ℹ"
                },
                callback: "page2" //here you can type in a string to get to another page or a function to execute code after clicking
            }
        ]
    },
    {
        name: "page2",
        content: new MessageEmbed().setTitle("Second page!"),
        buttons: [
            {
                buttonOption: {
                    label: "Go back!",
                    customId: "thishastobedifferentforeachbutton",
                    style: "DANGER",
                    type: "BUTTON",
                    emoji: "ℹ"
                },
                callback: "previous" //you can have multiple keywords to operate those pages for example previousm, first, last, 
            },
            {
                buttonOption: {
                    label: "Hey this is the second option of the second page!",
                    customId: "thishastobedifferentforeachbutton1",
                    style: "DANGER",
                    type: "BUTTON",
                    emoji: "ℹ"
                },
                callback: (i) => {  //here you can type in a string to get to another page or a function to execute code after clicking
                    i.deferUpdate() //it tells discord that the interaction was successful
                    message.reply("Hey it's me from the code!");
                    console.log(i.member.user.username);
                    
                }
            }
        ]
    }
])
buttonMenu.start();
```

# Select menu
```typescript
const selectMenu = new Menu(message.channel, message.author.id, [
{
    name: "page1",
    content: new MessageEmbed().setTitle("Hey!"),
    buttons: [
        {
            listOption: {
                label: "option1",
                value: "value1",
                description: "here's a description",
                emoji: "😁"
            },
            callback: "page2"
        },
        {
            listOption: {
                label: "option2",
                value: "value2",
                description: "here's a description2",
                emoji: "😃"
            },
            callback: (i) => {
                i.deferUpdate(); 
                console.log(i.values[0]); //value2
            }
        }
    ]
},
{
    name: "page2",
    content: new MessageEmbed().setTitle("Hey2!"),
    buttons: [
        {
            listOption: {
                label: "option1",
                value: "value1",
                description: "here's a description",
                emoji: "😁"
            },
            callback: "previous"
        },
        {
            listOption: {
                label: "option2",
                value: "value2",
                description: "here's a description2",
                emoji: "😃"
            },
            callback: (i) => {
                i.deferUpdate(); 
                console.log(i.values[0]); //value2
            }
        }
    ]
}
])
selectMenu.start();
```

### Using both
Using both of the menus (on page 1 a menu with buttons and on page 2 a menu with select menu) for now isn't possible because of how the code is structured and to do this
it would need a complete remake.

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