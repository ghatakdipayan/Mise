# Mise — notes for Claude

## Key_Artifacts

`Key_Artifacts/` holds the product's living documents:

- `Mise_Six_Page_Narrative.md` — Amazon-style six-pager (what Mise is, how it works, architecture, risks, priorities, FAQ).
- `Mise_Launch_News_Briefing.md` — launch press release, feature table, quotes, internal briefing notes.

The editable source of each is a Claude Doc (link at the top of each file).

**When the user asks to "update Key_Artifacts":** re-read the codebase and `git log` since the "as of" date in each file, update both documents so every feature, gap, risk and priority matches the current code, refresh the "as of" date, then re-export both to the Markdown files above, commit and push. Never leave a document describing features that no longer exist, or missing features that do.
