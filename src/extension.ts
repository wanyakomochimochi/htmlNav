import * as vscode from "vscode";

interface HtmlNode {
  name: string;
  type: "tag" | "selfTag" | "attribute" | "attrValue" | "text";
  start: number;
  end: number;
  children: HtmlNode[];
}

// --- ご提示の parseHtmlToTree をそのまま利用 ---
function parseHtmlToTree(text: string): HtmlNode {
  const root: HtmlNode = {
    name: "root",
    type: "tag",
    start: 0,
    end: text.length - 1,
    children: [],
  };
  const tagRegex = /<\/?([a-zA-Z0-9-]+)(\s[^<>]*?)?(\/?)>/g;

  const voidElements = [
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
  ];

  const stack: { node: HtmlNode; tagName: string; fullEnd: number }[] = [];
  stack.push({ node: root, tagName: "root", fullEnd: 0 });

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(text)) !== null) {
    const [full, tagName, attrs = "", selfClose] = match;
    const start = match.index;
    const end = match.index + full.length - 1;

    // 前のタグと今回のタグの間にテキストがあれば text ノードとして追加
    if (start > lastIndex) {
      const textNode: HtmlNode = {
        name: text.slice(lastIndex, start),
        type: "text",
        start: lastIndex,
        end: start - 1,
        children: [],
      };
      stack[stack.length - 1].node.children.push(textNode);
    }

    // 属性処理
    const attrNodes: HtmlNode[] = [];
    if (attrs) {
      const attrRegex = /([a-zA-Z0-9-]+)(="([^"]*)")?/g;
      let attrMatch: RegExpExecArray | null;

      // attrs がタグ全体(full)のどこから始まるかを求める
      const attrOffsetInTag = full.indexOf(attrs);

      while ((attrMatch = attrRegex.exec(attrs)) !== null) {
        const [fullAttr, attrName, , attrValue] = attrMatch;

        // タグ全体に対しての正しいオフセットを計算
        const attrStart = start + attrOffsetInTag + attrMatch.index;
        const attrEnd = attrStart + fullAttr.length - 1;

        const attrNode: HtmlNode = {
          name: attrName,
          type: "attribute",
          start: attrStart,
          end: attrEnd,
          children: [],
        };

        if (attrValue) {
          const valueStart = attrStart + fullAttr.indexOf('"') + 1;
          const valueEnd = valueStart + attrValue.length - 1;
          const valueNode: HtmlNode = {
            name: attrValue,
            type: "attrValue",
            start: valueStart,
            end: valueEnd,
            children: [],
          };
          attrNode.children.push(valueNode);
        }
        attrNodes.push(attrNode);
      }
    }

    const isVoid = voidElements.includes(tagName.toLowerCase());
    const isSelfClosing = selfClose === "/";

    // 閉じタグ
    if (full.startsWith("</")) {
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].tagName === tagName) {
          const parent = i > 0 ? stack[i - 1].node : root;
          const closedNode = stack[i].node;
          closedNode.end = end;
          parent.children.push(closedNode);
          stack.splice(i, 1);
          break;
        }
      }
    }
    // 自己完結タグ（void 要素で閉じタグなし、または明示的な /）
    else if (isSelfClosing || (isVoid && !full.startsWith("</"))) {
      const selfNode: HtmlNode = {
        name: tagName + "_self",
        type: "selfTag",
        start,
        end,
        children: attrNodes,
      };
      stack[stack.length - 1].node.children.push(selfNode);
    }
    // 開きタグ
    else {
      const openNode: HtmlNode = {
        name: tagName,
        type: "tag",
        start,
        end,
        children: attrNodes,
      };
      stack.push({ node: openNode, tagName, fullEnd: end });
    }

    lastIndex = end + 1;
  }

  // 最後に残ったテキスト
  if (lastIndex < text.length) {
    const textNode: HtmlNode = {
      name: text.slice(lastIndex),
      type: "text",
      start: lastIndex,
      end: text.length - 1,
      children: [],
    };
    stack[stack.length - 1].node.children.push(textNode);
  }

  return root;
}

// 親ノードを取得する再帰関数
function findParent(root: HtmlNode, target: HtmlNode): HtmlNode | null {
  for (const child of root.children) {
    if (child === target) {
      return root;
    }
    const res = findParent(child, target);
    if (res) return res;
  }
  return null;
}

// offset位置のノードを探す
function findNodeAtOffset(node: HtmlNode, offset: number): HtmlNode | null {
  for (const child of node.children) {
    if (offset >= child.start && offset <= child.end) {
      const deeper = findNodeAtOffset(child, offset);
      return deeper ?? child;
    }
  }
  return null;
}

function moveCursorTo(editor: vscode.TextEditor, offset: number) {
  const pos = editor.document.positionAt(offset);
  editor.selection = new vscode.Selection(pos, pos);
  editor.revealRange(new vscode.Range(pos, pos));
}

// 親ノードに移動
export function jumpParent() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const text = editor.document.getText();
  const root = parseHtmlToTree(text);
  const offset = editor.document.offsetAt(editor.selection.active);
  const node = findNodeAtOffset(root, offset);
  if (!node) return;

  const parent = findParent(root, node);
  if (!parent) return;

  // --- 属性値にいるときは親属性に移動 ---
  if (node.type === "attrValue" && parent.type === "attribute") {
    moveCursorTo(editor, parent.start);
    return;
  }

  // --- 通常のタグジャンプ処理 ---
  if (parent.type === "tag" || parent.type === "selfTag") {
    moveCursorTo(editor, parent.start);
  }
}


// 子ノードに移動（最初の子）
export function jumpChild() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;
  const text = editor.document.getText();
  const root = parseHtmlToTree(text);
  const offset = editor.document.offsetAt(editor.selection.active);
  const node = findNodeAtOffset(root, offset);
  if (!node || node.children.length === 0) return;

  const doc = editor.document;

  // --- 属性にいる場合は、属性値に移動 ---
  if (node.type === "attribute") {
    const valueNode = node.children.find((c) => c.type === "attrValue");
    if (valueNode) {
      moveCursorTo(editor, valueNode.start);
    }
    return; // 属性値がない場合は何もしない
  }

  // --- それ以外は従来どおり子ノードに移動 ---
  const children = node.children;
  let idx = 0;
  let attempts = 0;
  const maxAttempts = children.length;

  while (attempts < maxAttempts) {
    const child = children[idx];

    // 属性系はスキップ
    if (child.type !== "attribute" && child.type !== "attrValue") {
      const pos = doc.positionAt(child.start);
      const line = doc.lineAt(pos.line);

      if (pos.character !== line.text.length) {
        moveCursorTo(editor, child.start);
        return;
      }
    }

    idx = (idx + 1) % children.length;
    attempts++;
  }

  // すべて行末だけだった場合、最初の有効な子に移動
  for (const child of children) {
    if (child.type !== "attribute" && child.type !== "attrValue") {
      moveCursorTo(editor, child.start);
      break;
    }
  }
}


function isContentNode(node: HtmlNode): boolean {
  return node.type === "tag" || node.type === "selfTag" || node.type === "text";
}

function isAttributeNode(node: HtmlNode): boolean {
  return node.type === "attribute" || node.type === "attrValue";
}

export function jumpSibling(direction: "next" | "prev") {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const text = editor.document.getText();
  const root = parseHtmlToTree(text);
  const offset = editor.document.offsetAt(editor.selection.active);

  const node = findNodeAtOffset(root, offset);
  if (!node) return;

  const doc = editor.document;

  // ========== 属性値にいる場合 ==========
  if (node.type === "attrValue") {
    const attrNode = findParent(root, node);
    if (!attrNode) return;
    const tagNode = findParent(root, attrNode);
    if (!tagNode) return;

    const attrs = tagNode.children.filter((c) => c.type === "attribute");
    if (attrs.length === 0) return;

    let idx = attrs.indexOf(attrNode);
    if (idx === -1) return;

    let attempts = 0;
    let found: HtmlNode | undefined;

    do {
      idx =
        direction === "next"
          ? (idx + 1) % attrs.length
          : (idx - 1 + attrs.length) % attrs.length;

      const candidateAttr = attrs[idx];
      const valNode = candidateAttr?.children.find(
        (c) => c.type === "attrValue"
      );
      if (valNode) {
        found = valNode;
        break;
      }
      attempts++;
    } while (!found && attempts < attrs.length);

    if (found) {
      moveCursorTo(editor, found.start);
    }
    return;
  }

  // ========== 属性名にいる場合 ==========
  if (node.type === "attribute") {
    const tagNode = findParent(root, node);
    if (!tagNode) return;

    const attrs = tagNode.children.filter((c) => c.type === "attribute");
    if (attrs.length === 0) return;

    let idx = attrs.indexOf(node);
    if (idx === -1) return;

    idx =
      direction === "next"
        ? (idx + 1) % attrs.length
        : (idx - 1 + attrs.length) % attrs.length;

    const target = attrs[idx];
    if (target) {
      moveCursorTo(editor, target.start); // 属性名の先頭へ移動
    }
    return;
  }

  // ========== 通常の兄弟ノード移動 ==========
  const parent = findParent(root, node);
  if (!parent) return;

  const siblings = parent.children;
  if (siblings.length < 2) return;

  let idx = siblings.indexOf(node);
  if (idx === -1) return;

  let target: HtmlNode | undefined;
  let attempts = 0;

  do {
    idx =
      direction === "next"
        ? (idx + 1) % siblings.length
        : (idx - 1 + siblings.length) % siblings.length;
    const candidate = siblings[idx];
    if (!candidate) {
      attempts++;
      continue;
    }

    const pos = doc.positionAt(candidate.start);
    const line = doc.lineAt(pos.line);

    let skip = false;

    if (pos.character === line.text.length) {
      skip = true;
    }

    // コンテンツ → 属性 をスキップ
    if (isContentNode(node) && isAttributeNode(candidate)) {
      skip = true;
    }

    // 属性 → コンテンツ をスキップ
    if (isAttributeNode(node) && isContentNode(candidate)) {
      skip = true;
    }

    if (!skip) {
      target = candidate;
    }

    attempts++;
  } while (!target && attempts < siblings.length);

  if (target) {
    moveCursorTo(editor, target.start);
  }
}



export function jumpInside() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const text = editor.document.getText();
  const root = parseHtmlToTree(text);
  const offset = editor.document.offsetAt(editor.selection.active);

  const node = findNodeAtOffset(root, offset);
  if (!node) return;

  // 現在のノードがタグか自己完結タグの場合のみ処理
  if (node.type === "tag" || node.type === "selfTag") {
    // 子ノードの中から最初の属性ノードを探す
    const firstAttr = node.children.find(
      (child) => child.type === "attribute" || child.type === "attrValue"
    );

    if (firstAttr) {
      moveCursorTo(editor, firstAttr.start);
    }
  }
}


// --- activate/deactivate ---
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("extension.jumpParent", jumpParent),
    vscode.commands.registerCommand("extension.jumpChild", jumpChild),
    vscode.commands.registerCommand("extension.jumpSiblingNext", () =>
      jumpSibling("next")
    ),
    vscode.commands.registerCommand("extension.jumpSiblingPrev", () =>
      jumpSibling("prev")
    ),
    vscode.commands.registerCommand("extension.jumpInside", jumpInside)
  );
}

export function deactivate() {}
