# html-jump-navigator

This VS Code extension provides intuitive navigation within HTML code.
It allows you to jump between parent/child nodes, sibling nodes, and tag attributes, making editing complex HTML structures faster and more efficient. It also remembers previous cursor positions when moving up to a parent node, allowing you to jump back to child nodes seamlessly, while skipping content nodes as appropriate.

---

## Features

- **Jump to Parent** (`jumpParent`)

  - Move the cursor from the current node to its parent tag.
  - If inside an attribute value (`"..."`), jump back to the attribute name.
  - Otherwise, jump to the enclosing parent tag.
  - The previous cursor position is stored in a stack for later restoration.

- **Jump to Child** (`jumpChild`)

  - Move the cursor to the first valid child node.
  - Restores the last saved cursor position from the parent stack if available.
  - If on an attribute, jump inside its value (if it exists).
  - Skips attribute nodes and moves to content nodes.

- **Jump to Sibling** (`jumpSiblingNext` / `jumpSiblingPrev`)

  - Move to the next or previous sibling node.
  - When inside content (text/tag), attribute nodes are skipped.
  - When inside attributes, content nodes are skipped.
  - When inside an attribute value, you can jump directly to other attribute values in the same tag.

- **Jump Inside** (`jumpInside`)
  - From a tag or self-closing tag, jump directly to its first child node.
  - Restores saved positions from the stack only for attribute nodes.
  - If the saved position is a content node, it is ignored, and the cursor moves to the first child node.

---

## Node Types

- `"tag"`: Standard HTML tag node
- `"selfTag"`: Self-closing HTML tag node
- `"attribute"`: Attribute name node
- `"attrValue"`: Attribute value node
- `"text"`: Text node

---

## Example

Consider the following HTML code:

```html
<form action="./payment_page" method="get">
  <h2>Register for the meetup</h2>
  <p>
    <label for="comments">Any other comments:</label>
    <textarea id="comments" name="comments"></textarea>
  </p>
  <input type="text" name="username" />
  <button type="submit">Submit</button>
</form>
```

Example actions:

- From `<textarea ...>`, Jump Inside moves to its first child node (id attribute).
- From id="comments", Jump Parent moves back to the `<textarea>` node.
- From id="comments", Jump Sibling (next) moves to name="comments".
- From name="comments", Jump Sibling (prev) moves back to id="comments".
- From the `<label>` tag, Jump Child moves into its text content "Any other comments:".
- From the `<p>` tag, Jump Child moves to the first child `<label>`.
- From the `<form>` tag, Jump Child moves to the first child `<h2>`.
- From `<h2>`, Jump Sibling (next) moves to the `<p>` tag.
- From `<button>`, Jump Inside moves to its type attribute node.
- From type="submit", Jump Parent moves back to the `<button>` tag.
- Jump Sibling (next) from `<form>` does nothing as there is no sibling.

This example demonstrates how parent, child, sibling, and attribute jumps behave clearly and - comprehensively.

## Commands

| Command                     | Description                      | Example Keybinding |
| --------------------------- | -------------------------------- | ------------------ |
| `extension.jumpParent`      | Jump to the parent node          | `Alt+Up`           |
| `extension.jumpChild`       | Jump to the first child node     | `Alt+Down`         |
| `extension.jumpSiblingNext` | Jump to the next sibling         | `Alt+Right`        |
| `extension.jumpSiblingPrev` | Jump to the previous sibling     | `Alt+Left`         |
| `extension.jumpInside`      | Jump inside the first child node | `Alt+I`            |

---

## Keybindings Example

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

## Installation

1. Open Visual Studio Code.
2. Go to the **Extensions** view (`Ctrl+Shift+X`).
3. Search for `HTML Navigation`.
4. Click **Install** on the extension published by `wanyako`.

Commands are available via the Command Palette (`Ctrl+Shift+P`) or your own shortcuts.

---

## Requirements

- VS Code 1.60+
- Node.js (for building)

---

## Known Limitations

- Simplified HTML parser; may not cover all edge cases.
- Attribute parsing only supports double quotes `"..."`.
- Multi-cursor is not supported.

---

## License

MIT License

---

Developed by Wanyako (Japan)
Repository: [https://github.com/wanyakomochimochi/htmlNav.git]
