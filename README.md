<picture align="center">
  <!-- Desktop Dark Mode -->
  <source media="(min-width: 769px) and (prefers-color-scheme: dark)" srcset="assets/header-wide-dark-inline.svg">
  <!-- Desktop Light Mode -->
  <source media="(min-width: 769px) and (prefers-color-scheme: light)" srcset="assets/header-wide-light-inline.svg">
  <!-- Mobile Dark Mode -->
  <source media="(max-width: 768px) and (prefers-color-scheme: dark)" srcset="assets/header-stacked-dark-inline.svg">
  <!-- Mobile Light Mode -->
  <source media="(max-width: 768px) and (prefers-color-scheme: light)" srcset="assets/header-stacked-light-inline.svg">
  <img src="assets/header-wide-light-inline.svg" alt="ha-branding-overrides">
</picture>
<b align="left" class="cs-repo-meta">
  <span class="cs-repo-subtitle">Part of the Crooked Sentry universe</span>
  <span class="cs-repo-meta-separator" aria-hidden="true">|</span>
  <span class="cs-repo-badges">
    <a href="https://github.com/josephmienko/ha-branding-overrides/actions/workflows/validate.yml"><img src="https://github.com/josephmienko/ha-branding-overrides/actions/workflows/validate.yml/badge.svg" alt="Validate" align="absmiddle" /></a>
    <a href="https://app.codecov.io/gh/josephmienko/ha-branding-overrides"><img src="https://codecov.io/gh/josephmienko/ha-branding-overrides/badge.svg" alt="Codecov test coverage" align="absmiddle" /></a>
  </span>
</b>

Global Home Assistant branding override module: rebrand favicons, titles, logos, and auth pages. BYOB (bring your own branding assets) via `window.ha_branding_overrides` config.

## Configuration

### Installation Instructions

#### HACS Install

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

#### Manual Install

1. Copy `dist/ha-branding-overrides.js` into your Home Assistant `www/` directory.
2. Create your own config script, for example `/config/www/branding-overrides-config.js`.
3. Load both through `frontend.extra_module_url`:

   ```yaml
   frontend:
     extra_module_url:
       - /local/branding-overrides-config.js
       - /local/ha-branding-overrides.js
   ```

### Configuration Contract

The module reads `window.ha_branding_overrides` before initialization.

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
  ],
  auth: {
    enabled: true,
    name: "Example Home",
    icon32Url: "/local/branding/favicon-32.png",
    icon192Url: "/local/branding/favicon-192.png",
    logoLightUrl: "/local/branding/auth-logo-light.svg",
    logoDarkUrl: "/local/branding/auth-logo-dark.svg",
    theme: {
      light: {
        primary: "#365D49",
        accent: "#FFDE3F"
      },
      dark: {
        primary: "#6D9B7B",
        accent: "#FFDE3F"
      }
    }
  }
};
```

#### Supported Options

- `homeAssistantName`
- `appName`
- `icon32Url`, `icon192Url`
- `logoUrl`, `logoAlt`
- `logoSelectors`, `removeSelectors`
- `themeColor`
- `titleReplacements`, `textReplacements`
- `auth` (see below)

If `appName` is set without custom replacement arrays, the module defaults to replacing exact "Home Assistant" references in titles and text nodes.

### Optional Auth Page Branding

Auth branding is opt-in and does not depend on OIDC, SSO, NetBird, or Authentik.

Set `window.ha_branding_overrides.auth.enabled = true` and load the module on the auth page. The module will:

- Set auth page title, favicons, app metadata, and theme color
- Swap header logo using `auth.logoLightUrl` or `auth.logoDarkUrl`
- Apply light/dark theme variables and CSS for login controls
- Observe DOM changes for late-rendered elements

Supported `auth` options:

- `enabled`
- `name`
- `icon32Url` / `icon192Url`
- `logoUrl` / `logoLightUrl` / `logoDarkUrl`
- `logoAlt`
- `logoSelectors`
- `theme.light` / `theme.dark`

For compatibility with earlier Crooked Sentry work, the module also reads `window.auth_oidc_branding` as a fallback. New installs should use `window.ha_branding_overrides.auth`.

**Loading note:** Home Assistant `frontend.extra_module_url` handles frontend branding. Auth pages served by a separate auth provider must also load the config script and module if you want auth-page branding.

### Maintainer Workflow

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

### Design Notes

This is a BYOB (bring-your-own-branding) module:

- No runtime images required in `dist/`
- Users provide their own logo, favicon, and auth page assets
- Users point the module at `/local/...`, `/hacsfiles/...`, or absolute URLs
- The module reads configuration from `window.ha_branding_overrides` set by a user config script

Capabilities:

- Rewrites favicon and app-name metadata in `<head>`
- Rewrites `document.title`
- Replaces visible `Home Assistant` text and accessibility labels via shadow DOM traversal
- Swaps or removes logo nodes by selector
- Brands auth/login pages when `auth.enabled` is set
