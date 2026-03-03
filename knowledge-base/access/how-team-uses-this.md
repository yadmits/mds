# Team Access Model

This knowledge base is designed for shared use by design and frontend.

## Who edits what
- Designers: Figma references, variant/state intent, acceptance notes.
- Frontend: code target, API contract, tests, implementation status.
- Both: token mapping, final review checklist.

## Minimum process per component
1. Create component entry in `components.index.json`.
2. Create spec file from `template.component.spec.md` in `knowledge-base/components/specs/`.
3. Link exact Figma node URL and ID.
4. Track status through `planned -> in_progress -> ready_for_review -> done`.

## Access for any designer
- Store this repository in shared VCS with write access for design and frontend leads.
- Keep all specs in Markdown so designers can edit in any Git UI.
- Require node URLs (not screenshots only) for traceability.

## Suggested operating cadence
- Weekly triage: prioritize top 3-5 components.
- During sprint: fill specs and implement/refactor.
- End of sprint: run review checklist and close done items.
