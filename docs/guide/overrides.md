# Overrides

Overrides are a new feature that lets any user (including yourself) enforce the preferences used by Beta Protection.

## How does it work?

Override files are small files that contain (among other things) a set of pre-filled Beta Protection preferences, including censoring options. The extension includes a built-in wizard for creating these files. You can then save them for later or share them with another user.

When a user imports an override file, the preferences stored in the file **override** any pre-existing Beta Protection preferences. What's more, once active an override file cannot be disabled without knowing the key for the file (and optionally after a time delay). Until its disabled, Beta Protection will use the preferences from the override file and ignore/prevent any conflicting preference changes.

If you have the key, you can enter it and disable the override file, at which point Beta Protection will use your regular preferences again.

## Usage

Most things involving overrides are handled from the dedicated Overrides page. You can open this page using the button in the top-right of either the popup or the options page.

### Creating an override file

Switch over to the *Create New* tab at the top of the page and you will be given a short wizard to create your override file. In brief, you will configure the censoring preferences you want to include, optionally add any other settings, set which modes are allowed then set the unlock requirements. Once it's done, you can export your new override file which will be saved as a `.betaoverride` file. 

> You can use the minimum duration combined with limiting censoring modes to make an effective override for yourself as well!

#### Create an override from an existing file

If you already have an override file, either your own or someone else's, you can create a new override based on that file. Switch to the *Create From Existing* tab at the top of the page and import the override file you want to start with. You can then follow the wizard just like usual to create a new override, but the settings in the wizard will be pre-filled based on the override file you imported.

The new override will be a new file with its own key, and will not affect the imported override at all.

### Importing an override file

Once you have an override file, either your own or from another user, you can import it from the Overrides page. Choose the *Import from File* then find the file (it will be a small `.betaoverride` file). Once it imports, the page will update to show the details of the current override.

While the override is active, some preferences will be unavailable.

- Any options included in the override file will be locked on the options page. You won't be able to change these options and Beta Protection will only use the values from the override file as long as its active.
- Override files can lock out certain censoring modes. This may limit which options you have in the mode switch in the popup.
- Some overrides may include a minimum time duration. If they do, you will not be able to disable that override _even if you have the key_ until the required time has been met.