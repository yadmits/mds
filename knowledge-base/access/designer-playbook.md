# Designer Playbook

How any designer can use this knowledge base with Codex.

## 1) Before request
- Open the exact Figma node/frame you need.
- Copy URL with `node-id`.
- Check if token/component already exists in this repo.

## 2) Request format
Use a short, strict template:

`Library: <figma-url>`
`Node: <figma-node-url>`
`Task: add/update token set OR implement/refactor component`
`Target: <path in code repo if known>`

## 3) Expected output
- Updated `tokens.catalog.json` and/or component spec.
- Explicit list of new/changed tokens.
- Migration notes if names changed.

## 4) Rules for consistency
- Use only style names from Figma library as source names.
- Do not use screenshot-only requests without node URLs.
- Mark deprecated tokens explicitly, do not silently remove.
