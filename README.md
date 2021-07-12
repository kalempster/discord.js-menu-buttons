

## Warning
This is a fork of an existing npm package named discord.js-menu which was created by [Jowsey](https://github.com/jowsey). Since discord added buttons and lists I though that this package could use some modification to fit just that and there it is!

## Project Summary
Create flexible, understandable and performant Discord button and list menus with ease. This package is an addon for Discord.js that automates all aspects of a button/list-based navigation menu.  
Besides creating it, of course. It'd be pretty useless if you couldn't create the menus yourself.

## Learn Discord.js-Menu-Buttons in Y minutes.
Here's a fast, fully-featured demo of Discord.js-menu-buttons. With one read-through of this demo, you should have all you need to create your own menus from scratch.  
All values have been added to .d.ts, so if you use an editor like VSCode, you should get real-time code suggestions and tooltips where appropriate.

```js
/* Import all the usual stuff. This shouldn't be anything new. */
const { Client, MessageEmbed } = require('discord.js')
const btnMenus = require('discord.js-menu-buttons');
const client = new Client();
const disbut = require("discord-buttons");
const { ButtonCallback, ButtonMenu, MenuButton, MenuButtonsList } = require("discord.js-menu-buttons");

disbut(client) //Initializations of buttons
btnMenus(client) //Initialization needed for the buttons to work

/* Run this code every time a new message is sent. */
client.on('message', message => {
    if (message.content === "!command") {
        

        const embed = new MessageEmbed()
            .setColor("#fffff")
            .setTitle("Welcome to discord.js-menu-buttons");

        let btns = new MenuButtonsList()
            .addButtons([ //This is a function that allows you to add multiple buttons instead of doing it over and over again using .addButton
                new MenuButton(
                    {
                        style: 2,
                        type: 2,
                        emoji: "😶",
                        label: "To page",
                        custom_id: randomButtonId(),

                    },
                    "page"
                ),
                new MenuButton(
                    {
                        style: 2,
                        type: 2,
                        emoji: "😂",
                        label: "Send who clicked",
                        custom_id: randomButtonId(),

                    },
                    (b) => { //the b is a class from discord-buttons MessageComponent. You can read the docs at its npm page
                        message.channel.send(b.clicker.user.username); //Sending the username that clicked the button
                        b.reply.defer(false); //ending the interaction
                    }
                ),
            ])


        let btns1 = new MenuButtonsList() //This class has a method for adding a button or multiple buttons
            .addButton( 
                new MenuButton( //This is the default class for the button 
                    {
                        style: 2,
                        type: 2,
                        emoji: "😶",
                        label: "Back",
                        custom_id: randomButtonId(),

                    },
                    "main" //this is the second argument for the MenuButton constructor, it can be a function or a string that indicates 
                )
            )


        const menubtns = new ButtonMenu(message.channel, message.author.id, [{
            name: "main",
            content: embed,
            buttons: btns.list //Adding all of the buttons that were set earlier
        }, {
            name: "page",
            content: embed2,
            buttons: btns1.list //empty
        }])

        menubtns.start();

        /* Run Menu.start() when you're ready to send the menu in chat.
         * Once sent, the menu will automatically handle everything else.
         */ 
        /* The menu also has a singular event you can use for, well, whatever you like.
         * The "pageChange" event fires just before a new page is sent. You can use
         * this to edit pages on the fly, or run some other logic.
         * It's your menu, man, do whatever.
         * 
         * The "destination" is the Page object it's about to change to.
         */
        helpMenu.on('pageChange', destination => {
            destination.content.title = "Hey, " + message.author.username
        })
    }
})

client.login("Get your bot's oauth token at https://discord.com/developers/applications")
```
There's also an option to make the menu list style

```js
/* Import all the usual stuff. This shouldn't be anything new. */
const { Client, MessageEmbed } = require('discord.js')
const btnMenus = require('discord.js-menu-buttons');
const client = new Client();
const disbut = require("discord-buttons");
const { ButtonCallback, Menu, MenuOption, MenuOptionsList } = require("discord.js-menu-buttons");

disbut(client) //Initializations of buttons
btnMenus(client) //Initialization needed for the buttons to work

/* Run this code every time a new message is sent. */
client.on('message', message => {
    if (message.content === "!command") {
        
     const embed2 = new MessageEmbed()
            .setColor("#fffff")
            .setTitle("Second page");

        let lists = new MenuOptionsList()
            .addOptions(
                [
                    new MenuOption(
                        new MessageMenuOption({
                            description: "List option 1",
                            emoji: "🤣",
                            label: "Option 1",
                            value: "myValue",

                        }), (btn) => {
                            message.channel.send(btn.values[0]) //myValue
                            btn.reply.defer(false); //End interaction

                        }
                    ),
                    new MenuOption(
                        new MessageMenuOption({
                            description: "List option 2",
                            emoji: "783645571100704769",
                            label: "Option 2",
                            value: "myValue2",

                        }), "page" /*You can type the page name here aswell*/)

                ]
            );


        const menu = new Menu(message.channel, message.author.id, [{
            name: "main",
            content: embed,
            buttons: lists.list //Adding all of the buttons that were set earlier
        }, {
            name: "page",
            content: embed2,
            buttons: new Map<MessageMenuOption, string | ButtonCallback>() //empty
        }])

        menu.start();

        /* Run Menu.start() when you're ready to send the menu in chat.
         * Once sent, the menu will automatically handle everything else.
         */ 
        /* The menu also has a singular event you can use for, well, whatever you like.
         * The "pageChange" event fires just before a new page is sent. You can use
         * this to edit pages on the fly, or run some other logic.
         * It's your menu, man, do whatever.
         * 
         * The "destination" is the Page object it's about to change to.
         */
        helpMenu.on('pageChange', destination => {
            destination.content.title = "Hey, " + message.author.username
        })
    }
})

client.login("Get your bot's oauth token at https://discord.com/developers/applications")
```


## Special Destinations
You may have noticed I mentioned "special destinations" above.   
Discord.js-menu-buttons comes with 6 pre-defined destinations with specific uses.

| Destination 	| Function                                                      	|
|-------------	|---------------------------------------------------------------	|
| first       	| Goes to the first page in the array.                          	|
| last        	| Goes to the last page in the array.                           	|
| previous    	| Goes to the previous page in the array.                       	|
| next        	| Goes to the next page in the array.                           	|
| stop        	| Removes reactions from the embed and stops updating the menu. 	|
| delete      	| Stops the menu and deletes the message.                       	|

Note that whilst calling a page one of these wouldn't break anything (the page would still be accessible using, ironically, the special destinations) you wouldn't be able to directly link to it.

## Contributing
Right now, the development pipeline is super simple. The [Standard](https://github.com/standard/standard) code style is used to keep styling consistent, but besides that, there's not much going on.  
Feel free to PR anything you think others would find useful. I'll gladly approve new contributions!

## Acknowledgements
Some parts of this project were inspired by Juby210's [discord.js-reaction-menu](https://github.com/Juby210/discord.js-reaction-menu).  
Thank you to Juby210 for releasing their code to the public and thus inspiring me to create my own implementation!
