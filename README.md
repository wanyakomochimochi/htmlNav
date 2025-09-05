# html-jump-navigator

This VS Code extension provides intuitive navigation within HTML code.
It allows you to jump between parent/child nodes, sibling nodes, and tag attributes, making editing complex HTML structures faster and more efficient.

---

## Features

- **Jump to Parent**
  Move the cursor from the current node to its parent tag.

  - If inside an attribute value (`"..."`), jump back to the attribute name.
  - Otherwise, jump to the enclosing parent tag.

- **Jump to Child**
  Move the cursor to the first valid child node.

  - If on an attribute, jump inside its value (if it exists).
  - If on a tag, jump into its contents, skipping line-ending-only nodes.

- **Jump to Sibling**
  Move to the next or previous sibling node.

  - When inside content (text/tag), attribute nodes are skipped.
  - When inside attributes, content nodes are skipped.
  - When inside an attribute value, you can jump directly to other attribute values in the same tag.

- **Jump Inside**
  From a tag or self-closing tag, jump directly into its first attribute.

---

## Example

Given the following code:

```html
<form action="./payment_page" method="get">
  <h2>Register for the meetup</h2>
  <p>
    <label for="comments">Any other comments:</label>
    <textarea id="comments" name="comments"></textarea>
  </p>
</form>
```

- From `<textarea ...>`, `Jump Inside` will move into the `id` attribute.
- From `id="comments"`, `Jump Parent` moves back to `id`.
- From `id="comments"`, `Jump Sibling (next)` moves to `name="comments"`.
- From the `<label>` tag, `Jump Child` moves into its text content.

---

## Commands

| Command                     | Description                      | Default Keybinding (example) |
| --------------------------- | -------------------------------- | ---------------------------- |
| `extension.jumpParent`      | Jump to the parent node          | `Alt+Up`                     |
| `extension.jumpChild`       | Jump to the first child node     | `Alt+Down`                   |
| `extension.jumpSiblingNext` | Jump to the next sibling         | `Alt+Right`                  |
| `extension.jumpSiblingPrev` | Jump to the previous sibling     | `Alt+Left`                   |
| `extension.jumpInside`      | Jump inside the tag’s attributes | `Alt+I`                      |

_(No default keybindings are set by the extension; you can assign them in VS Code.)_

---

## Keybindings Example

You can add keybindings in your `keybindings.json` to trigger the commands in HTML files only. Example:

```jsonc
[
  {
    "key": "ctrl+alt+up",
    "command": "extension.jumpParent",
    "when": "editorTextFocus && editorLangId == 'html'"
  },
  {
    "key": "ctrl+alt+down",
    "command": "extension.jumpChild",
    "when": "editorTextFocus && editorLangId == 'html'"
  },
  {
    "key": "ctrl+alt+right",
    "command": "extension.jumpSiblingNext",
    "when": "editorTextFocus && editorLangId == 'html'"
  },
  {
    "key": "ctrl+alt+left",
    "command": "extension.jumpSiblingPrev",
    "when": "editorTextFocus && editorLangId == 'html'"
  },
  {
    "key": "ctrl+alt+i",
    "command": "extension.jumpInside",
    "when": "editorTextFocus && editorLangId == 'html'"
  }
]
```

This ensures the shortcuts work only when editing HTML files, avoiding conflicts with other languages.

---

## Installation

You can install **HTML Navigation for VS Code** directly from the Visual Studio Code Marketplace:

1. Open Visual Studio Code.
2. Go to the **Extensions** view by clicking the Extensions icon in the Activity Bar or pressing `Ctrl+Shift+X`.
3. Search for `HTML Navigation`.
4. Click **Install** on the extension published by `wanyako`.

Once installed, the extension commands are available immediately. You can access them via the Command Palette (`Ctrl+Shift+P`) or assign your own keyboard shortcuts.

## Requirements

- VS Code version 1.60 or later
- Node.js installed (for building the extension)

## Known Limitations

- The HTML parser is simplified and may not cover 100% of edge cases (e.g., malformed HTML).
- Attribute parsing is limited to double-quoted values ("...").

## License

MIT License

---

May your bugs be tiny and your commits legendary. 🚀

Developed by Wanyako, a developer from Japan.
Check out the repository: [https://github.com/wanyakomochimochi/htmlNav.git]
