#!/usr/bin/env python3
"""Apply the reviewed Capyra skill adaptations to Spec Kit 1.0.6.

Run after a reviewed integration upgrade. Keep upstream manifests unchanged so
Specify still detects our customizations. No application files are touched.
"""

import json
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parent.parent
DESCRIPTIONS = {
    "analyze": "Check consistency across a feature's spec, plan and tasks without editing them.",
    "checklist": "Create a requirements-quality checklist for a Spec Kit feature.",
    "clarify": "Resolve ambiguities in an existing feature spec and record the answers.",
    "constitution": "Create or amend the project's Spec Kit constitution.",
    "converge": "Compare implementation with feature artifacts and record remaining tasks.",
    "implement": "Implement a Spec Kit feature's tasks and validate the result.",
    "plan": "Turn a feature spec into an implementation plan and design artifacts.",
    "specify": "Create or revise a feature specification from the requested behavior.",
    "tasks": "Generate dependency-ordered tasks from a feature's spec and plan.",
    "taskstoissues": "Convert a feature's existing tasks into GitHub issues when requested.",
}


def main():
    manifest = json.loads((ROOT / ".specify/integrations/codex.manifest.json").read_text())
    if manifest["version"] != "1.0.6":
        raise SystemExit("Review the new upstream skill format before updating this adapter.")

    writes = {}
    for name, description in DESCRIPTIONS.items():
        path = ROOT / f".agents/skills/speckit-{name}/SKILL.md"
        content = path.read_text()
        content, count = re.subn(
            r"^description:.*$", "description: " + json.dumps(description),
            content, count=1, flags=re.M,
        )
        if count != 1:
            raise ValueError(f"Missing description: {path}")

        # Only conditional hook mechanics move. Keep each upstream procedure
        # verbatim, including event names, conditions, errors and dispatch rules.
        for phase in ("before", "after"):
            reference = path.parent / f"references/{phase}-hooks.md"
            link = f"references/{phase}-hooks.md"
            if f"]({link})" in content:
                if not reference.is_file():
                    raise ValueError(f"Missing hook reference: {reference}")
                continue
            if phase == "before":
                heading = "## Pre-Execution Checks"
            elif name in ("analyze", "converge"):
                heading = "### 9. Check for extension hooks"
            elif name in ("constitution", "checklist", "taskstoissues"):
                heading = "## Post-Execution Checks"
            else:
                heading = "## Mandatory Post-Execution Hooks"
            start = content.index(heading + "\n")
            body_start = start + len(heading) + 1
            # Upstream hook examples indent their headings; the next unindented
            # second-level heading marks the end of this section.
            following = re.search(r"^## ", content[body_start:], flags=re.M)
            end = body_start + following.start() if following else len(content)
            section = content[start:end].rstrip() + "\n"
            if f"hooks.{phase}_{name}" not in section:
                raise ValueError(f"Unexpected hook section: {path}, {phase}")
            if reference.exists() and reference.read_text() != section:
                raise ValueError(f"Review changed upstream hook procedure: {reference}")
            writes[reference] = section
            replacement = (
                heading + "\n\n"
                f"If `.specify/extensions.yml` exists, read [{phase} hooks]({link}) "
                f"and apply its `hooks.{phase}_{name}` procedure at this stage. "
                "Otherwise skip hook handling without loading the reference.\n\n"
            )
            content = content[:start] + replacement + content[end:]
        writes[path] = content.rstrip() + "\n"

    # Validate every input before changing any file.
    changed = 0
    for path, content in writes.items():
        if not path.exists() or path.read_text() != content:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content)
            changed += 1
    print(f"Configured {len(DESCRIPTIONS)} Spec Kit skills; {changed} files changed.")


if __name__ == "__main__":
    main()
