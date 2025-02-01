import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, SuggestModal, TFolder } from 'obsidian';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	defaultNoteName: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	defaultNoteName: ''
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Create note in folder', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-create-note-in-folder',
			name: 'Open menu to create note in a specific folder',
			callback: () => {
				new FindFolderModal(this.app, this).open();
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class FindFolderModal extends SuggestModal<any> {
	private plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app);
		this.plugin = plugin;
	}

	getSuggestions(query: string): TFolder[] {
		return this.app.vault.getAllFolders();
	}
	renderSuggestion(folder: TFolder, el: HTMLElement): void {
		el.createEl("div", { text: folder.path });
	}
	onChooseSuggestion(folder: TFolder, evt: MouseEvent | KeyboardEvent): void {
		new CreateNoteModal(this.app, folder, this.plugin).open();
	}
}

class CreateNoteModal extends Modal {
	folder: TFolder;
	private note_name: HTMLInputElement;
	private plugin: MyPlugin;

	constructor(app: App, folder: TFolder, plugin: MyPlugin) {
		super(app);
		this.folder = folder;
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl } = this;

		this.note_name = contentEl.createEl('input', {
			attr: {
				type: 'text',
				placeholder: 'Enter note name'
			},
			cls: 'mod-cta'
		});

		const createNoteButton = contentEl.createEl('button', {
			text: 'Create Note',
			cls: 'submit-button'
		});

		createNoteButton.onclick = () => {
			const fileName = this.note_name.value;
			if (fileName) {
				this.app.vault.create(this.folder.path + '/' + fileName + '.md', '');
				this.close();
			} else {
				this.app.vault.create(this.folder.path + '/' + this.plugin.settings.defaultNoteName + '.md', '');
				this.close();
			}
		};

		this.note_name.addEventListener('keypress', (e) => {
			if (e.key === 'Enter') {
				createNoteButton.click();
			}
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}


class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h1', { text: 'New Note in Folder Plugin' });
		containerEl.createEl('p', { text: 'To fix the very tedious problem of creating a note in a folder without using the mouse and changing to the sidebar explorer.' });

		new Setting(containerEl)
			.setName('Default Note Name')
			.setDesc('The default name for a note. Used when the user does not provide a name.')
			.addText(text => text
				.setPlaceholder('untitiled')
				.setValue(this.plugin.settings.defaultNoteName)
				.onChange(async (value) => {
					this.plugin.settings.defaultNoteName = value;
					await this.plugin.saveSettings();
				}));
	}
}
