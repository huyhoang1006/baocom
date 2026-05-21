---
name: external-research-discipline
description: Use when researching libraries, frameworks, APIs, packages, technical approaches, ecosystem choices, best practices, or any claim that may depend on current external documentation.
---

# External Research Discipline

## Overview

Training data is hypothesis, not evidence. Current external sources decide factual claims. Strong research searches broadly first, then narrows by authority, recency, and contradiction checks.

Core rule: **Scope -> query plan -> Context7 -> official docs -> official GitHub/changelog -> WebSearch -> adversarial search -> cross-verify -> confidence labels.**

## When To Use

Use this skill before making claims about:

- Library, framework, API, SDK, CLI, package, plugin, or version behavior
- Current best practices, ecosystem conventions, deprecations, compatibility, security guidance
- Package recommendations, install commands, configuration options, migration paths
- Technical comparisons where current docs or recent releases matter

Do not use for purely local codebase facts that can be verified by reading project files.

## Source Hierarchy

| Level | Sources | Claim Status |
|-------|---------|--------------|
| HIGH | Context7 docs, official docs, official release notes | Can state as fact with citation |
| MEDIUM | Official GitHub README/issues/changelog, WebFetch of official source, multiple credible sources agreeing | State with attribution |
| LOW | WebSearch only, blog only, single community source, training memory | Flag as unverified |

Priority order:

1. Context7 MCP docs if available.
2. Official documentation via WebFetch.
3. Official GitHub repository, README, releases, changelog.
4. Registry metadata for existence/version only.
5. WebSearch for discovery, then verify with higher source.

## Research Depth Modes

Choose depth before searching:

| Mode | Use When | Minimum Evidence |
|------|----------|------------------|
| Quick | Small implementation detail, low risk | 1 authoritative source |
| Standard | Library/framework choice, implementation approach | 2 source types, at least 1 authoritative |
| Deep | Security, migrations, package installs, architecture, production risk | 3+ source types, contradiction search, freshness check |

Default to Standard. Use Deep when wrong research could cause security bugs, dependency risk, data loss, major refactor, or wasted implementation.

## Required Protocol

For every external technical claim:

1. Identify claim type: API behavior, version, package existence, best practice, migration, compatibility, security.
2. Write a query plan with 3-6 targeted queries before searching.
3. Look up authoritative docs first. Use Context7 when available.
4. If Context7 is unavailable, fetch official docs or official GitHub pages.
5. Use WebSearch for discovery, alternatives, ecosystem usage, pitfalls, and contradiction search.
6. Cross-verify WebSearch findings before presenting them as fact.
7. Label confidence: `HIGH`, `MEDIUM`, `LOW`, or `[ASSUMED]`.
8. Record source next to claim or in Sources section.

If external tools are unavailable, say so explicitly and mark affected claims `[ASSUMED]`. Do not pretend research was performed.

## Query Planning

Before searching, generate multiple query angles:

| Angle | Query Pattern | Purpose |
|-------|---------------|---------|
| Official docs | `<library> <topic> official docs` | Authoritative API behavior |
| Version/current | `<library> changelog <feature>` or `<library> release notes <feature>` | Recency and deprecation |
| Ecosystem pattern | `<framework> recommended <problem>` | Common practice |
| Pitfalls | `<library> <topic> gotchas` or `<framework> common mistakes <problem>` | Failure modes |
| Comparison | `<option A> vs <option B> <use case>` | Tradeoffs |
| Contradiction | `<claim> deprecated`, `<claim> not supported`, `<claim> issue` | Disprove or qualify claim |

Do not run one generic query and stop. Strong research uses query diversity to avoid SEO traps and confirmation bias.

## Search Operators

Use targeted search operators when useful:

```text
site:docs.example.com <topic>
site:github.com/org/repo <feature> issue
<package> changelog breaking change
<framework> migration guide <version>
<library> security advisory
```

Avoid injecting current year into every query. It can bias results toward stale SEO pages. Instead inspect publication dates and release versions.

## Documentation Lookup

When library or framework documentation is needed:

1. Resolve library identity before reading docs. Do not guess package/library IDs.
2. Fetch targeted docs for the exact topic.
3. Prefer current docs, release notes, and changelog over tutorials.
4. Check dates and versions when behavior may have changed.
5. For negative claims, verify recent official docs before saying something is unsupported.
6. Capture exact version and date when available.

Example source note:

```markdown
- `Auth.js` supports Next.js App Router route handlers [HIGH: official docs, fetched 2026-05-17].
- Package `example-auth-helper` exists on npm but source provenance was not verified [ASSUMED: registry existence only].
```

## Web Search Verification

Every WebSearch finding must pass this gate:

| Check | Result |
|-------|--------|
| Verified by Context7 or official docs | `HIGH` |
| Verified by official GitHub/release notes | `MEDIUM` |
| Multiple credible sources agree, no official source found | `MEDIUM`, cite limitation |
| Only one search result/blog/forum supports it | `LOW` |
| Cannot verify | `[ASSUMED]` |

Never present `LOW` or `[ASSUMED]` claims as authoritative.

## Triangulation And Contradiction Search

For Standard or Deep research, triangulate important claims:

- Confirm at least one source is authoritative.
- Look for one source that could disprove or narrow the claim.
- Compare docs against current changelog/release notes if feature behavior is version-sensitive.
- If sources disagree, report disagreement and choose safest interpretation.

Contradiction search examples:

```text
<library> <feature> deprecated
<library> <feature> breaking change
<library> <feature> bug
<library> <feature> not supported
```

No contradiction found is not proof. Phrase as "I did not find contrary official guidance" rather than "there are no issues."

## Freshness Checks

For changing ecosystems, add freshness metadata:

- Current package/library version.
- Latest relevant release date or changelog entry.
- Docs date if visible.
- Whether source is official, community, or generated.

Treat old tutorials and undated blog posts as LOW unless verified by current official docs.

## Package And Registry Rules

Registry existence is not safety or correctness. `npm view`, `pip index`, or `cargo search` proves only that a name exists.

Before recommending package installation:

- Verify package in correct ecosystem registry: npm for Node, PyPI for Python, crates.io for Rust.
- Prefer packages linked from official docs or official ecosystem guides.
- Check package age, downloads, source repository, maintainers, and install scripts when possible.
- Mark packages discovered only via WebSearch/training as `[ASSUMED]` until official provenance is verified.
- If package looks new, low-download, source-less, or name-confusable, flag for human verification.
- Search for security advisories, suspicious install scripts, typosquatting/slopsquatting signals, and maintainer/source mismatch when package risk matters.

Node postinstall risk check when relevant:

```bash
npm view <pkg> scripts.postinstall 2>/dev/null
```

## Output Requirements

Research output must include:

- Summary with recommendation.
- Query plan or search coverage summary.
- Evidence ledger for important claims.
- Claims tagged with source/confidence.
- `## Assumptions` table for all `[ASSUMED]` claims.
- `## Open Questions` for unresolved facts.
- `## Sources` grouped by confidence.

Minimal format:

```markdown
## Recommendation

[Actionable recommendation]

## Findings

- [HIGH: official docs] Claim...
- [MEDIUM: official GitHub] Claim...
- [LOW: WebSearch only] Claim...

## Evidence Ledger

| Claim | Confidence | Sources | Notes |
|-------|------------|---------|-------|

## Search Coverage

- Official docs checked: yes/no
- Changelog/releases checked: yes/no
- Contradiction search: yes/no
- Package registry/provenance checked: yes/no/not applicable

## Assumptions

| Claim | Why Assumed | Risk If Wrong |
|-------|-------------|---------------|

## Sources

- Official docs: ...
- Official GitHub: ...
- WebSearch/community: ...
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Using training memory as current fact | Treat as hypothesis, verify externally |
| Treating WebSearch snippet as source | Open/fetch source, verify against docs |
| Saying feature is unsupported after not finding it | Check official current docs and changelog first |
| Trusting registry existence | Verify provenance and official recommendation |
| Omitting uncertainty | Add `LOW` or `[ASSUMED]` label |
| Listing many options without recommendation | Research evidence, then recommend one path |
| Stopping after first good result | Run contradiction and freshness checks |
| Searching only generic keywords | Use query angles and search operators |
| Treating old tutorials as current | Verify against current docs/changelog |

## Stop Criteria

Research can stop when:

- Required depth mode evidence is met.
- Key claims have confidence labels and source notes.
- Contradiction search found no blocking conflict or conflicts are documented.
- Open questions are explicitly listed with risk.

Research must continue or downgrade confidence when:

- Only WebSearch snippets support the answer.
- Sources disagree and no authoritative source resolves it.
- Package provenance is unclear but install is recommended.
- Version-sensitive behavior lacks version/date evidence.

## Quick Checklist

Before finishing research:

- [ ] Context7 or official docs checked where available
- [ ] Query plan covered docs, version/current, pitfalls, and contradiction angles
- [ ] WebSearch findings cross-verified
- [ ] Changelog/release notes checked for version-sensitive claims
- [ ] Package names verified in correct ecosystem
- [ ] Package provenance/security checked when recommending installs
- [ ] Confidence labels added to factual claims
- [ ] Evidence ledger or source notes included
- [ ] `[ASSUMED]` claims listed separately
- [ ] Negative claims backed by current official evidence
- [ ] Sources included
