# Webpage HTML Export

Export html from single files, canvas pages, or whole vaults. Direct access to the exported HTML files allows you to publish your digital garden anywhere. Focuses on flexibility, features, and style parity.
Demo / docs: [docs.obsidianweb.net](https://docs.obsidianweb.net/)

![image](https://github.com/KosmosisDire/obsidian-webpage-export/assets/39423700/b8e227e4-b12c-47fb-b341-5c5c2f092ffa)

![image](https://github.com/KosmosisDire/obsidian-webpage-export/assets/39423700/06f29e1a-c067-45e7-9882-f9d6aa83776f)

> [!NOTE]  
> Although the plugin is fully functional it is still under development, so there may be frequent large changes between updates that could effect your workflow! Bugs are also not uncommon, please report anything you find, I am working to make the plugin more stable.
>
> Fork Notes:
> All features i need are currently working. More features (track all/selected markdown documents, disable notification for unexported changes, ...) will probably **not be implemented**.

## Features:
- Full text search
- File navigation tree
- Document outline
- Graph view
- Theme toggle
- Optimized for web and mobile
- Most plugins supported (dataview, tasks, etc...)
- Option to export html and dependencies into one single file

Fork:
- track changes in markdown documents and export them separately into html
- get notification on startup if some modified documents weren't exported again

## Using the Plugin
Check out the new docs for details on using the plugin:
https://docs.obsidianweb.net/

- Fork adds command `Export modified markdown documents (separately)` and Buttons with the same name.
  - the plugin tracks changes in markdown documents
    - tracks changes only for files that are opened in Obsidian. If a document isn't opened in one session, 
it is no longer tracked until opened again.
  - Command exports every document separately ( .html file is in the
same folder and has the same name as the markdown file)
  - tracked changes can be disregarded with the `Disregard modified markdown documents`-command


## Installation

~~Install from Obsidian Community Plugins: [Open in Obsidian](https://obsidian.md/plugins?id=webpage-html-export)~~

- Download `main.js`, `manifest.json` and `styles.css` into folder `path2urVault/.obsidian/plugins/obsidian-webpage-export-separately`
- run Obsidian and activate the plugin


### Manual Installation

1. ~~Download the `.zip` file from the [Latest Release](https://github.com/KosmosisDire/obsidian-webpage-export/releases/latest), or from any other release version.~~
2. ~~Unzip into: `{VaultFolder}/.obsidian/plugins/`~~
3. ~~Reload obsidian~~

see [Build the plugin](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)

### Beta Installation

Either follow the instructions above for a beta release, or:

1. ~~Install the [BRAT plugin](https://obsidian.md/plugins?id=obsidian42-brat)~~
2. ~~Open the brat settings~~
3. ~~Select add beta plugin~~
4. ~~Enter `https://github.com/KosmosisDire/obsidian-webpage-export` as the repository.~~
5. ~~Select Add Plugin~~

## Contributing

Only start work on features which have an issue created for them and have been accepted by me!
A contribution guide may come soon.

## Support This Plugin

This plugin takes a lot of work to maintain and continue adding features. If you want to fund the continued development of this plugin you can do so here:

<a href="https://www.buymeacoffee.com/nathangeorge"><img src="https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=&slug=nathangeorge&button_colour=3ebba4&font_colour=ffffff&font_family=Poppins&outline_colour=ffffff&coffee_colour=FFDD00"></a>

or if you prefer paypal: 

<a href="https://www.paypal.com/donate/?business=HHQBAXQQXT84Q&no_recurring=0&item_name=Hey+%F0%9F%91%8B+I+am+a+Computer+Science+student+working+on+obsidian+plugins.+Thanks+for+your+support%21&currency_code=USD"><img src="https://pics.paypal.com/00/s/MGNjZDA4MDItYzk3MC00NTQ1LTg4ZDAtMzM5MTc4ZmFlMGIy/file.PNG" style="width: 150px;"></a>

## Testing

This project is tested with BrowserStack.
[BrowserStack](https://www.browserstack.com/open-source) offers free web testing to open source projects, but does not support this project in any other way.
