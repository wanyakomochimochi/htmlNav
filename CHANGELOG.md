# Changelog

## [1.1.0] - 2025-09-06
- Implemented caching of HTML tree data for faster parsing.
- When jumping to a parent node and then back to a child node, the cursor
  returns to the previous position.
- Jump Inside now moves from an attribute node to its attribute value node.

## [1.0.1] - 2025-09-05
- Minor corrections to the README documentation.

## [1.0.0] - 2025-09-05
- Initial release of HTML Jump Navigator.
- Supports Jump Parent, Jump Child, Jump Sibling, and Jump Inside commands.
- Provides intuitive navigation within HTML code.
