// imports from obsidian API
import { Notice, Plugin, TFile, TFolder, requestUrl,moment, MarkdownPreviewRenderer, MarkdownPreviewView, MarkdownRenderer, Component, FileSystemAdapter} from 'obsidian';

// modules that are part of the plugin
import { AssetHandler } from 'src/plugin/asset-loaders/asset-handler';
import { Settings, SettingsPage } from 'src/plugin/settings/settings';
import { HTMLExporter } from 'src/plugin/exporter';
import { Path } from 'src/plugin/utils/path';
import { ExportModal } from 'src/plugin/settings/export-modal';
import { _MarkdownRendererInternal, ExportLog, MarkdownRendererAPI } from 'src/plugin/render-api/render-api';
import { DataviewRenderer } from './render-api/dataview-renderer';
import { Website } from './website/website';
import { i18n } from './translations/language';
import Dict = NodeJS.Dict;



export default class HTMLExportPlugin extends Plugin {
	static updateInfo: {
		updateAvailable: boolean;
		latestVersion: string;
		currentVersion: string;
		updateNote: string;
	} = {
		updateAvailable: false,
		latestVersion: "0",
		currentVersion: "0",
		updateNote: "",
	};
	static pluginVersion: string = "0.0.0";
	public api = MarkdownRendererAPI;
	public internalAPI = _MarkdownRendererInternal;
	public settings = Settings;
	public assetHandler = AssetHandler;
	public Path = Path;
	public dv = DataviewRenderer;
	public Website = Website;

	// possible changed documents. check later for changes
	modifiedMarkdownDocuments:Dict<number> | null = null;

	//dont know how often events are called
	// --> prevent unnecessary dictionary lookups
	lastOpenedMarkdownDocument: string = "";

	public async exportDocker() {
		await HTMLExporter.export(true, undefined, new Path("/output"));
	}

	public async exportVault(path: string) {
		await HTMLExporter.exportVault(new Path(path), true, false);
	}

	async onload() {
		console.log("Loading webpage-html-export plugin");
		this.checkForUpdates();
		HTMLExportPlugin.pluginVersion = this.manifest.version;

		// @ts-ignore
		window.WebpageHTMLExport = this;

		this.addSettingTab(new SettingsPage(this));
		await SettingsPage.loadSettings();
		await AssetHandler.initialize();

		this.addRibbonIcon("folder-up", i18n.exportAsHTML, () => {
			HTMLExporter.export(false);
		});

		this.addRibbonIcon("folder-down", "Export modified markdown Documents (separately)",
			() => this.exportUpdatedMarkdowns())


		// register callback for file rename so we can update the saved files to export
		this.registerEvent(
			this.app.vault.on("rename", SettingsPage.renameFile)
		);

		this.addCommand({
			id: "export-html-vault",
			name: "Export using previous settings",
			callback: () => {
				HTMLExporter.export(true);
			},
		});

		this.addCommand({
			id: "export-html-current",
			name: "Export only current file using previous settings",
			callback: () => {
				const file = this.app.workspace.getActiveFile();

				if (!file) {
					new Notice("No file is currently open!", 5000);
					return;
				}

				HTMLExporter.export(true, [file]);
			},
		});

		this.addCommand({
			id: "export-html-setting",
			name: "Set html export settings",
			callback: () => {
				HTMLExporter.export(false);
			},
		});

		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				menu.addItem((item) => {
					item.setTitle(i18n.exportAsHTML)
						.setIcon("download")
						.setSection("export")
						.onClick(() => {
							ExportModal.title =
								i18n.exportModal.exportAsTitle.format(
									file.name
								);
							if (file instanceof TFile) {
								HTMLExporter.export(false, [file]);
							} else if (file instanceof TFolder) {
								const filesInFolder = this.app.vault
									.getFiles()
									.filter((f) =>
										new Path(
											f.path
										).directory.path.startsWith(file.path)
									);
								HTMLExporter.export(false, filesInFolder);
							} else {
								ExportLog.error(
									"File is not a TFile or TFolder! Invalid type: " +
										typeof file +
										""
								);
								new Notice(
									"File is not a File or Folder! Invalid type: " +
										typeof file +
										"",
									5000
								);
							}
						});
				});
			})
		);

		//-----------------------------------------------------------------------------------------------
		//-----------------------------------------------------------------------------------------------
		//-----------------------------------------CUSTOM------------------------------------------------
		//-----------------------------------------------------------------------------------------------
		//-----------------------------------------------------------------------------------------------

		this.addCommand({
			id: "Export modified markdown documents (separately)",
			name: "Export modified markdown documents (separately)",
			callback: () => {
				this.exportUpdatedMarkdowns();
			},
		});

		this.addCommand({
			id: "Disregard modified markdown documents",
			name: "Disregard modified markdown documents",
			callback: () => {
				this.modifiedMarkdownDocuments = {};
				this.detectNewMarkdownFile();
			},
		});

		this.registerEvent(
			this.app.workspace.on("file-menu", (menu) => {
				menu.addItem((item) => {
					item.setTitle("Export modified markdown documents (separately)")
						.setIcon("download")
						.setSection("export")
						.onClick(() => {
							this.exportUpdatedMarkdowns();
						});
				});
			})
		);

		/*this.registerEvent(
			this.app.workspace.on('quit', (tasks) =>
			{
				tasks.add( async () => {
					await this.saveModifiedMarkdownDocumentsData();
				})
			})
		);*/

		this.registerEvent(this.app.workspace.on("active-leaf-change", () => {this.detectNewMarkdownFile();}));
		this.registerEvent(this.app.workspace.on("file-open", () => {this.detectNewMarkdownFile();}));
	}

	async saveModifiedMarkdownDocumentsData(){
		this.settings.modifiedMarkdownDocumentsSinceExportstr = JSON.stringify(this.modifiedMarkdownDocuments);
		await SettingsPage.saveSettings();
	}

	async detectNewMarkdownFile() {
		const activeFile = this.app.workspace.getActiveFile();
		if(activeFile !== null
				&& activeFile.extension == "md"
				&& activeFile.path != this.lastOpenedMarkdownDocument
				&& !(activeFile.path in this.getModifiedMarkDownDict())) {

			this.getModifiedMarkDownDict()[activeFile.path] = activeFile.stat.mtime;
			this.lastOpenedMarkdownDocument = activeFile.path;
			await this.saveModifiedMarkdownDocumentsData(); //keep data backed up
		}
	}

	async exportUpdatedMarkdowns() {
		let exportedSome = false;
		for (const filePath in this.modifiedMarkdownDocuments){
			const oldmTime = this.modifiedMarkdownDocuments[filePath];
			const newFile = this.app.vault.getFileByPath(filePath);
			if(newFile !== null && oldmTime !== undefined
				&& newFile.stat.mtime > oldmTime){

				const oldSiteName = this.settings.exportOptions.siteName;
				const oldPath = this.settings.exportOptions.exportPath;

				let path = newFile.parent?.path;
				if (path === undefined) path = "";

				const adapter = this.app.vault.adapter;
				if (adapter instanceof FileSystemAdapter) {
					path = adapter.getFullPath(path);
				}

				this.settings.exportOptions.exportPath = path;

				this.settings.exportOptions.siteName = newFile.basename;
				await SettingsPage.saveSettings();
				await SettingsPage.loadSettings();
				await HTMLExporter.export(true, [newFile]);

				this.settings.exportOptions.siteName = oldSiteName;
				this.settings.exportOptions.exportPath = oldPath;
				await SettingsPage.saveSettings();
				await SettingsPage.loadSettings();

				exportedSome = true;
			}
		}

		if(!exportedSome) {
			new Notice("No changes detected.", 10000);
		}

		this.lastOpenedMarkdownDocument = "";
		this.modifiedMarkdownDocuments = {};
		await this.detectNewMarkdownFile();
	}

	getModifiedMarkDownDict(){
		if (this.modifiedMarkdownDocuments !== null) {
			return this.modifiedMarkdownDocuments;
		}
		// load modified markdown files
		this.modifiedMarkdownDocuments = {};
		try {
			const dict:Dict<number> = JSON.parse(this.settings.modifiedMarkdownDocumentsSinceExportstr);
			// remove files that havent been changed since
			for (const filePath in dict) {
				const oldmTime = dict[filePath];

				const newFile = this.app.vault.getFileByPath(filePath);
				if (newFile !== null && oldmTime !== undefined) {
					if ( newFile.stat.mtime > oldmTime){
						this.modifiedMarkdownDocuments[filePath] = oldmTime;
					}
				}
			}

			//notify user
			const toExport = Object.keys(this.modifiedMarkdownDocuments);
			if (toExport.length > 0){
				let str = "";
				for (const i in toExport) {
					str += "\n- " + toExport[i];
				}

				new Notice("The following markdown documents haven't been exported yet:" +
					str +
					"\n\n\n Update all or disregard these changes by running:" +
					"\n- 'Export modified markdown documents (separately)'\n" +
					"\n- 'Disregard modified markdown documents'", 30000);
			}

		}catch (e){
			new Notice(e.toLocaleString(), 30000);
		}
		return this.modifiedMarkdownDocuments;
	}

	async checkForUpdates(): Promise<{
		updateAvailable: boolean;
		latestVersion: string;
		currentVersion: string;
		updateNote: string;
	}> {
		const currentVersion = this.manifest.version;

		try {
			let url =
				"https://raw.githubusercontent.com/KosmosisDire/obsidian-webpage-export/master/manifest.json?cache=" +
				Date.now() +
				"";
			if (this.manifest.version.endsWith("b"))
				url =
					"https://raw.githubusercontent.com/KosmosisDire/obsidian-webpage-export/master/manifest-beta.json?cache=" +
					Date.now() +
					"";
			const manifestResp = await requestUrl(url);
			if (manifestResp.status != 200)
				throw new Error("Could not fetch manifest");
			const manifest = manifestResp.json;
			const latestVersion = manifest.version ?? currentVersion;
			const updateAvailable = currentVersion < latestVersion;
			const updateNote = manifest.updateNote ?? "";

			HTMLExportPlugin.updateInfo = {
				updateAvailable: updateAvailable,
				latestVersion: latestVersion,
				currentVersion: currentVersion,
				updateNote: updateNote,
			};

			if (updateAvailable)
				ExportLog.log(
					`${i18n.updateAvailable}: ${currentVersion} ⟶ ${latestVersion}`
				);

			return HTMLExportPlugin.updateInfo;
		} catch {
			ExportLog.log("Could not check for update");
			HTMLExportPlugin.updateInfo = {
				updateAvailable: false,
				latestVersion: currentVersion,
				currentVersion: currentVersion,
				updateNote: "",
			};
			return HTMLExportPlugin.updateInfo;
		}
	}

	onunload() {
		ExportLog.log("unloading webpage-html-export plugin");
	}
}
