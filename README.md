  <picture>
    <source media="(max-width: 700px)" srcset="header-stacked-inline.svg">
    <img src="header-wide-inline.svg" alt="ha-branding-overrides" />
  </picture>

<p align="left">
  Part of the Crooked Sentry universe&nbsp;|&nbsp;
  <a href="https://github.com/josephmienko/ha-branding-overrides/actions/workflows/validate.yml"><img src="https://github.com/josephmienko/ha-branding-overrides/actions/workflows/validate.yml/badge.svg" alt="Validate" align="absmiddle" /></a>&nbsp;
  <a href="https://app.codecov.io/gh/josephmienko/ha-branding-overrides"><img src="https://codecov.io/gh/josephmienko/ha-branding-overrides/badge.svg" alt="Codecov test coverage" align="absmiddle" /></a>
</p>

## Overview

`ha-branding-overrides` is the recommended extraction target for the global Home Assistant branding override module that currently lives in this repo.

This repo ships one HACS dashboard/plugin artifact: `dist/ha-branding-overrides.js`.

## Runtime Model

This package is a global frontend module, not a Lovelace card.

HACS can distribute the JavaScript artifact, but Home Assistant still needs to load it through `frontend.extra_module_url`.

The package is intentionally BYOB:

- no runtime images are required in `dist/`
- users bring their own logo and favicon assets
- users point the module at `/local/...`, `/hacsfiles/...`, or absolute URLs
- users provide config through a separate script that sets `window.ha_branding_overrides`

The extracted implementation does four things:

- rewrites favicon and app-name metadata in `<head>`
- rewrites `document.title`
- walks open shadow roots to replace visible `Home Assistant` text and matching accessibility labels
- optionally swaps or removes matched logo nodes using selectors you provide

## Repo Layout

```text
ha-branding-overrides/
  .github/
    workflows/
      validate.yml
  dist/
    ha-branding-overrides.js
  examples/
    branding-overrides-config.example.js
    frontend.extra_module_url.yaml
    example-assets/
      README.md
  scripts/
    build_plugin.mjs
  screenshots/
  src/
    ha-branding-overrides.js
  tests/
    validate-dist.mjs
  .gitignore
  README.md
  hacs.json
  package.json
```

## Public Config Contract

The module reads `window.ha_branding_overrides` before it initializes.

Example:

```js
window.ha_branding_overrides = {
  appName: "Example Home",
  homeAssistantName: "Home Assistant",
  icon32Url: "/local/branding/favicon-32.png",
  icon192Url: "/local/branding/favicon-192.png",
  logoUrl: "/local/branding/logo.svg",
  logoAlt: "Example Home",
  logoSelectors: [".header img"],
  removeSelectors: ['[data-default-brand-logo="1"]'],
  themeColor: "#365D49",
  titleReplacements: [
    { from: "Home Assistant", to: "Example Home" }
  ],
  textReplacements: [
    { from: "Home Assistant", to: "Example Home" }
  ]
};
```

Recommended supported values:

- `homeAssistantName`
- `appName`
- `icon32Url`
- `icon192Url`
- `logoUrl`
- `logoAlt`
- `logoSelectors`
- `removeSelectors`
- `themeColor`
- `titleReplacements`
- `textReplacements`

If `appName` is set and you do not provide custom replacement arrays, the module still defaults to replacing exact `Home Assistant` references in titles and text nodes.

## HACS Install

1. Add the repository to HACS as a `Dashboard`.
2. Install `HA Branding Overrides`.
3. Create your own config script from `examples/branding-overrides-config.example.js`.
4. Load the config script and the HACS-installed module from `frontend.extra_module_url`.

Example:

```yaml
frontend:
  extra_module_url:
    - /local/branding-overrides-config.js
    - /hacsfiles/ha-branding-overrides/ha-branding-overrides.js
```

The config script must load first.

## Manual Install

1. Copy `dist/ha-branding-overrides.js` into your Home Assistant `www/` directory.
2. Create your own config script, for example `/config/www/branding-overrides-config.js`.
3. Load both through `frontend.extra_module_url`:

   ```yaml
   frontend:
     extra_module_url:
       - /local/branding-overrides-config.js
       - /local/ha-branding-overrides.js
   ```

## Maintainer Workflow

1. Edit `src/ha-branding-overrides.js`.
2. Rebuild the install artifact:

   ```bash
   npm run build
   ```

3. Run validation:

   ```bash
   npm run check
   npm test
   ```

4. Commit both the source file and the generated `dist/ha-branding-overrides.js`.

The CI workflow fails if the built artifact is out of date.

## Packaging Rules

- `dist/` contains only installable runtime artifacts.
- `examples/` contains config examples and sample assets only.
- `screenshots/` is for README assets only.
- Sample images should stay in `examples/` and never be required for runtime use.
- Public docs should explicitly support both `/local/...` and absolute URLs for user-supplied assets.

## Recommended Public Rename

Recommended public rename for the extracted module:

- `crooked-sentry-branding` -> `ha-branding-overrides`

That applies to:

- the built file name
- README docs
- config contract
- Home Assistant setup snippets

## Extraction Mapping

Current source file in this monorepo maps to the extracted repo like this:

- `homeassistant/www/community/crooked-sentry-branding/crooked-sentry-branding.js` -> `src/ha-branding-overrides.js`

Current install automation in this repo also wires the script into `frontend.extra_module_url` in:

- `scripts/install-stack.sh`

The extracted public repo should ship only the reusable frontend module and examples. Appliance-specific automation stays in this monorepo.

## Notes

- This repo template now uses the real extracted implementation from `crooked-sentry-branding.js`, remapped onto the public `window.ha_branding_overrides` config seam.
- The public package no longer hardcodes `Crooked Sentry` strings or `/local/community/...` asset paths.
- Appliance-specific `frontend.extra_module_url` automation still belongs in this monorepo.
