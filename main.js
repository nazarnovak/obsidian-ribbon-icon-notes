const { Plugin, PluginSettingTab, Setting } = require("obsidian");

// TODO:
// 1. If paths are wrong - give feedback to the user about it and not save it
// 1.1 How to give user feedback immediately when they enter path? Now it works, but only if you close and open the modal again
// 1.9 How to also update the ribbon if the path is empty, and remove it dynamically?
// 2. If time and interest - do it so you can add them dynamically with a (+) icon and remove them

const icons = [
  "any-key",
  "audio-file",
  "blocks",
  "broken-link",
  "bullet-list",
  "calendar-with-checkmark",
  "checkmark",
  "create-new",
  "cross",
  "cross-in-box",
  "crossed-star",
  "dice",
  "document",
  "documents",
  "dot-network",
  "enter",
  "expand-vertically",
  "filled-pin",
  "folder",
  "gear",
  "go-to-file",
  "hashtag",
  "help",
  "horizontal-split",
  "image-file",
  "info",
  "install",
  "languages",
  "left-arrow",
  "left-arrow-with-tail",
  "lines-of-text",
  "link",
  "logo-crystal",
  "magnifying-glass",
  "microphone",
  "microphone-filled",
  "open-vault",
  "pane-layout",
  "paper-plane",
  "pdf-file",
  "pencil",
  "pin",
  "popup-open",
  "presentation",
  "reset",
  "right-arrow",
  "right-arrow-with-tail",
  "right-triangle",
  "search",
  "sheets-in-box",
  "star",
  "star-list",
  "switch",
  "three-horizontal-bars",
  "trash",
  "two-columns",
  "up-and-down-arrows",
  "uppercase-lowercase-a",
  "vault",
  "vertical-split",
  "vertical-three-dots",
];

// Settings
class RibbonIconNotesSettingsTab extends PluginSettingTab {
  constructor(app, plugin, saveIconNotesData) {
    super(app, plugin);
    this.app = app;
    this.plugin = plugin;
    this.saveIconNotesData = saveIconNotesData;
    this.notFoundNotes = [];
  }

  changeName = (i, name) => {
    if (!(i in this.plugin.pluginData.iconNotes)) {
      this.plugin.pluginData.iconNotes[i] = {
        icon: "",
        name,
        path: "",
      };
      return;
    }

    this.plugin.pluginData.iconNotes[i].name = name;
    this.saveIconNotesData();
  };

  changeIcon = (i, icon) => {
    if (!(i in this.plugin.pluginData.iconNotes)) {
      this.plugin.pluginData.iconNotes[i] = {
        icon,
        name: "",
        path: "",
      };
      return;
    }

    this.plugin.pluginData.iconNotes[i].icon = icon;
    this.saveIconNotesData();
  };

  changePath = (i, path) => {
    if (!(i in this.plugin.pluginData.iconNotes)) {
      this.plugin.pluginData.iconNotes[i] = {
        icon: "",
        name: "",
        path,
      };

      this.saveIconNotesData();
      return;
    }

    this.plugin.pluginData.iconNotes[i].path = path;
    this.saveIconNotesData();
  };

  deleteNote = (i) => {
    if (!(i in this.plugin.pluginData.iconNotes)) {
      return;
    }

    delete this.plugin.pluginData.iconNotes[i];
    this.saveIconNotesData();
  };

  display() {
    const { containerEl } = this;
    containerEl.empty();

    var h1 = containerEl.createEl("h1");
    h1.classList.add("settings-header");
    h1.setText("Ribbon icon notes settings");

    for (const key in this.plugin.pluginData.iconNotes) {
      const noteNumber = +key + 1;

      new Setting(containerEl)
        .setName(
          this.plugin.pluginData.iconNotes[key].name
            ? this.plugin.pluginData.iconNotes[key].name
            : "Icon note " + noteNumber
        )
        .setDesc(
          "Choose icon, and path to the note that will be opened when you press on the button"
        )
        .addText((text) => {
          text
            .setPlaceholder(
              this.plugin.pluginData.iconNotes[key].name
                ? ""
                : "Icon note " + noteNumber
            )
            .setValue(
              this.plugin.pluginData.iconNotes[key].name
                ? this.plugin.pluginData.iconNotes[key].name
                : ""
            )
            .onChange(async (value) => {
              this.changeName(key, value);
            });
        })
        .addDropdown((dropdown) => {
          icons.forEach((icon) => dropdown.addOption(icon, icon));
          return dropdown
            .setValue(this.plugin.pluginData.iconNotes[key].icon)
            .onChange((value) => {
              this.changeIcon(key, value);
            });
        })
        .addText((text) => {
          if (this.notFoundNotes.includes(key)) {
            text.inputEl.classList.add("error-input");
          }

          text
            .setPlaceholder(
              this.plugin.pluginData.iconNotes[key].path ? "" : "Path to note"
            )
            .setValue(
              this.plugin.pluginData.iconNotes[key].path
                ? this.plugin.pluginData.iconNotes[key].path
                : ""
            )
            .onChange(async (value) => {
              let foundNote = false;
              for (const key in this.app.vault.fileMap) {
                if (key !== value) {
                  continue;
                }

                foundNote = true;
              }

              if (!foundNote) {
                this.notFoundNotes.push(key);
              }

              this.changePath(key, value);
            });
        });
      // Later on I could delete dynamically icon note buttons
      //   .addButton((cb) => {
      //     cb.setButtonText("X");
      //     cb.setCta();
      //     cb.onClick(() => {
      //       this.deleteNote(0);
      //     });
      //   });
    }

    if (this.notFoundNotes.length) {
      var div = containerEl.createDiv();
      div.setAttribute("id", "not-found-paths");
      div.setAttribute("class", "error-text");
      div.setText("Paths not found for inputs that are outlined in red");
    }
  }
}

// Main Plugin class
class RibbonIconNotesPlugin extends Plugin {
  constructor(app, manifest) {
    super(app, manifest);
    this.pluginData = {
      iconNotes: [],
      settings: {},
    };
  }

  loadIconNotesData() {
    if (this.pluginData.iconNotes) {
      Promise.resolve(this.pluginData);
    }

    return this.loadData()
      .then((data) => {
        // File already contains something - return it
        if (data) {
          // This is needed so it's local. Less opening of the file
          this.pluginData = data;
          this.saveIconNotesData();
          return data;
        }

        // Data file doesn't exist - create a default 1 icon
        this.pluginData = {
          iconNotes: [
            { icon: "star", path: "" },
            { icon: "star-list", path: "" },
            { icon: "switch", path: "" },
          ],
          settings: {},
        };
        this.saveIconNotesData();
        return this.pluginData;
      })
      .catch((err) => {
        throw "Error loading data.json: " + err;
      });
  }

  saveIconNotesData() {
    this.saveData(this.pluginData);
  }

  onload = async () => {
    this.loadIconNotesData().then((pluginData) => {
      this.addSettingTab(
        new RibbonIconNotesSettingsTab(this.app, this, () => {
          this.saveIconNotesData();
        })
      );

      for (const key in this.pluginData.iconNotes) {
        // Skip render if no path is set
        if (!this.pluginData.iconNotes[key].path) {
          continue;
        }

        const noteNumber = +key + 1;
        // TODO: Check path against an existing file and draw it only then
        // Show that in settings too somehow when onchange is happening
        this.addRibbonIcon(
          this.pluginData.iconNotes[key].icon,
          this.pluginData.iconNotes[key].name
            ? this.pluginData.iconNotes[key].name
            : "Icon note " + noteNumber,
          async () => {
            // If the path is wrong - we need to tell user that!
            let foundNote = false;
            for (const pathKey in this.app.vault.fileMap) {
              if (pathKey !== this.pluginData.iconNotes[key].path + ".md") {
                continue;
              }

              foundNote = true;
            }

            if (!foundNote) {
              new Notice(
                "Note not found with path you have set: " +
                  this.pluginData.iconNotes[key].path + ".md",
                3000
              );
              return;
            }

            // Called when the user clicks the icon.
            this.app.workspace.openLinkText(
              this.pluginData.iconNotes[key].path + ".md",
              "",
              false,
              {
                active: true,
              }
            );
          }
        );
      }
    });
  };
}

module.exports = RibbonIconNotesPlugin;
