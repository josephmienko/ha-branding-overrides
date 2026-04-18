const OBSERVED_ROOTS = new WeakSet();
const SHADOW_PATCH_KEY = "__haBrandingOverridesShadowPatch";

let scheduledFrame = null;

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function firstString(values, fallback = "") {
  for (const value of values) {
    if (typeof value !== "string") {
      continue;
    }
    const trimmed = value.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return fallback;
}

function normalizeStringList(items) {
  const source = Array.isArray(items) ? items : [];
  return [...new Set(source.filter((value) => typeof value === "string").map((value) => value.trim()).filter(Boolean))];
}

function normalizeReplacements(items, defaults = []) {
  const source = Array.isArray(items) ? items : defaults;
  return source
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const from = firstString([item.from], "");
      const to = firstString([item.to], "");
      return from && to ? { from, to } : null;
    })
    .filter(Boolean);
}

function normalizeConfig(raw) {
  const input = raw && typeof raw === "object" ? raw : {};
  const homeAssistantName = firstString(
    [input.homeAssistantName, input.home_assistant_name],
    "Home Assistant"
  );
  const appName = firstString([input.appName, input.brandName, input.brand_name, input.name], "");
  const defaultReplacement = appName ? [{ from: homeAssistantName, to: appName }] : [];
  const icon32Url = firstString(
    [input.icon32Url, input.icon32_url, input.favicon32, input.favicon_32],
    ""
  );
  const icon192Url = firstString(
    [input.icon192Url, input.icon192_url, input.favicon192, input.favicon_192, input.iconUrl, input.icon_url],
    ""
  );

  return {
    appName,
    homeAssistantName,
    icon32Url,
    icon192Url,
    logoUrl: firstString([input.logoUrl, input.logo_url, input.logo], ""),
    logoAlt: firstString([input.logoAlt, input.logo_alt], ""),
    logoSelectors: normalizeStringList(input.logoSelectors),
    removeSelectors: normalizeStringList(input.removeSelectors),
    themeColor: firstString([input.themeColor, input.theme_color], ""),
    titleReplacements: normalizeReplacements(input.titleReplacements, defaultReplacement),
    textReplacements: normalizeReplacements(input.textReplacements, defaultReplacement),
  };
}

const BRANDING = normalizeConfig(window.ha_branding_overrides);

function hasBrandingWork() {
  return Boolean(
    BRANDING.appName ||
      BRANDING.icon32Url ||
      BRANDING.icon192Url ||
      BRANDING.logoUrl ||
      BRANDING.logoSelectors.length ||
      BRANDING.removeSelectors.length ||
      BRANDING.themeColor ||
      BRANDING.titleReplacements.length ||
      BRANDING.textReplacements.length
  );
}

function iconTypeForHref(href) {
  const normalized = normalizeText(href).toLowerCase();
  if (normalized.includes(".svg")) {
    return "image/svg+xml";
  }
  if (normalized.includes(".png")) {
    return "image/png";
  }
  if (normalized.includes(".ico")) {
    return "image/x-icon";
  }
  return "";
}

function ensureHeadLink(id, rel, href) {
  if (!href) {
    return;
  }

  let link = document.getElementById(id);
  if (!(link instanceof HTMLLinkElement)) {
    link = document.createElement("link");
    link.id = id;
    document.head.appendChild(link);
  }

  if (link.rel !== rel) {
    link.rel = rel;
  }
  if (link.href !== href) {
    link.href = href;
  }

  const iconType = iconTypeForHref(href);
  if (iconType && link.type !== iconType) {
    link.type = iconType;
  }
}

function updateExistingHeadIconLinks(href) {
  if (!href) {
    return;
  }

  const selectors = [
    'link[rel="icon"]',
    'link[rel~="icon"]',
    'link[rel="shortcut icon"]',
    'link[rel="apple-touch-icon"]',
  ];

  const links = document.head.querySelectorAll(selectors.join(","));
  const iconType = iconTypeForHref(href);
  links.forEach((node) => {
    if (!(node instanceof HTMLLinkElement)) {
      return;
    }

    if (node.href !== href) {
      node.href = href;
    }

    if (iconType && !node.rel.includes("apple-touch-icon") && node.type !== iconType) {
      node.type = iconType;
    }
  });
}

function ensureMeta(name, content) {
  if (!content) {
    return;
  }

  let meta = document.head.querySelector(`meta[name="${name}"]`);
  if (!(meta instanceof HTMLMetaElement)) {
    meta = document.createElement("meta");
    meta.name = name;
    document.head.appendChild(meta);
  }

  if (meta.content !== content) {
    meta.content = content;
  }
}

function applyReplacements(value, replacements) {
  let next = value;
  for (const replacement of replacements) {
    if (!next.includes(replacement.from)) {
      continue;
    }
    next = next.replaceAll(replacement.from, replacement.to);
  }
  return next;
}

function replaceExactText(target, sourceText, replacement) {
  if (!target) {
    return;
  }

  const normalizedSource = normalizeText(sourceText);
  if (!normalizedSource) {
    return;
  }

  const directTextNodes = Array.from(target.childNodes).filter(
    (node) => node.nodeType === Node.TEXT_NODE && normalizeText(node.textContent)
  );

  if (directTextNodes.length === 1 && normalizeText(directTextNodes[0].textContent) === normalizedSource) {
    directTextNodes[0].textContent = replacement;
    return;
  }

  if (target.childElementCount === 0 && normalizeText(target.textContent) === normalizedSource) {
    target.textContent = replacement;
  }
}

function replaceTextNodes(element) {
  if (!(element instanceof Element)) {
    return;
  }
  if (element.tagName === "SCRIPT" || element.tagName === "STYLE") {
    return;
  }

  for (const node of Array.from(element.childNodes)) {
    if (node.nodeType !== Node.TEXT_NODE || !node.textContent) {
      continue;
    }

    const next = applyReplacements(node.textContent, BRANDING.textReplacements);
    if (next !== node.textContent) {
      node.textContent = next;
    }
  }
}

function replaceAttributeText(element, attributeName) {
  const current = element.getAttribute(attributeName);
  if (current == null) {
    return;
  }

  let next = applyReplacements(current, BRANDING.textReplacements);
  if (BRANDING.appName && normalizeText(next) === BRANDING.homeAssistantName) {
    next = BRANDING.appName;
  }

  if (next !== current) {
    element.setAttribute(attributeName, next);
  }
}

function applyTitleBranding() {
  let next = document.title || "";
  if (BRANDING.appName && normalizeText(next) === BRANDING.homeAssistantName) {
    next = BRANDING.appName;
  }
  next = applyReplacements(next, BRANDING.titleReplacements);
  if (!next && BRANDING.appName) {
    next = BRANDING.appName;
  }
  if (next && document.title !== next) {
    document.title = next;
  }
}

function applyHeadBranding() {
  const primaryIconUrl = BRANDING.icon192Url || BRANDING.icon32Url;
  const smallIconUrl = BRANDING.icon32Url || BRANDING.icon192Url;

  updateExistingHeadIconLinks(primaryIconUrl || smallIconUrl);
  ensureHeadLink("ha-branding-overrides-favicon", "icon", smallIconUrl || primaryIconUrl);
  ensureHeadLink(
    "ha-branding-overrides-shortcut-icon",
    "shortcut icon",
    smallIconUrl || primaryIconUrl
  );
  ensureHeadLink(
    "ha-branding-overrides-apple-touch-icon",
    "apple-touch-icon",
    primaryIconUrl || smallIconUrl
  );
  ensureMeta("application-name", BRANDING.appName);
  ensureMeta("apple-mobile-web-app-title", BRANDING.appName);
  ensureMeta("theme-color", BRANDING.themeColor);
  applyTitleBranding();
}

function walkOpenRoots(root, visitElement, visitRoot, seen = new WeakSet()) {
  if (!root || seen.has(root)) {
    return;
  }
  seen.add(root);

  if (visitRoot && root.querySelectorAll) {
    visitRoot(root);
  }

  if (visitElement && root instanceof Element) {
    visitElement(root);
  }

  const elements = root.querySelectorAll ? root.querySelectorAll("*") : [];
  for (const element of elements) {
    if (visitElement) {
      visitElement(element);
    }
    if (element.shadowRoot) {
      walkOpenRoots(element.shadowRoot, visitElement, visitRoot, seen);
    }
  }
}

function applyRemoveSelectors() {
  if (!BRANDING.removeSelectors.length) {
    return;
  }

  const removed = new Set();
  walkOpenRoots(document, null, (root) => {
    for (const selector of BRANDING.removeSelectors) {
      root.querySelectorAll(selector).forEach((node) => {
        if (!(node instanceof Element) || removed.has(node)) {
          return;
        }
        removed.add(node);
        node.remove();
      });
    }
  });
}

function applyLogoBranding() {
  if (!BRANDING.logoUrl || !BRANDING.logoSelectors.length) {
    return;
  }

  const seen = new Set();
  const logoAlt = BRANDING.logoAlt || BRANDING.appName;

  walkOpenRoots(document, null, (root) => {
    for (const selector of BRANDING.logoSelectors) {
      root.querySelectorAll(selector).forEach((node) => {
        if (!(node instanceof HTMLImageElement) || seen.has(node)) {
          return;
        }
        seen.add(node);

        if (node.src !== BRANDING.logoUrl) {
          node.src = BRANDING.logoUrl;
        }
        if (logoAlt && node.alt !== logoAlt) {
          node.alt = logoAlt;
        }
      });
    }
  });
}

function applyTextBranding() {
  walkOpenRoots(document, (element) => {
    if (!(element instanceof Element)) {
      return;
    }

    replaceTextNodes(element);
    replaceAttributeText(element, "title");
    replaceAttributeText(element, "aria-label");

    if (BRANDING.appName && normalizeText(element.textContent) === BRANDING.homeAssistantName) {
      replaceExactText(element, BRANDING.homeAssistantName, BRANDING.appName);
    }

    if (BRANDING.appName && normalizeText(element.getAttribute("title")) === BRANDING.homeAssistantName) {
      element.setAttribute("title", BRANDING.appName);
    }

    if (BRANDING.appName && normalizeText(element.getAttribute("aria-label")) === BRANDING.homeAssistantName) {
      element.setAttribute("aria-label", BRANDING.appName);
    }
  });
}

function applyBranding() {
  applyHeadBranding();
  applyTextBranding();
  applyRemoveSelectors();
  applyLogoBranding();
}

function scheduleApply() {
  if (scheduledFrame !== null) {
    return;
  }

  scheduledFrame = requestAnimationFrame(() => {
    scheduledFrame = null;
    applyBranding();
  });
}

function observeRoot(root) {
  if (!root || OBSERVED_ROOTS.has(root)) {
    return;
  }

  OBSERVED_ROOTS.add(root);

  const observer = new MutationObserver(() => scheduleApply());
  observer.observe(root, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
  });

  if (root.querySelectorAll) {
    for (const element of root.querySelectorAll("*")) {
      if (element.shadowRoot) {
        observeRoot(element.shadowRoot);
      }
    }
  }
}

function patchAttachShadow() {
  if (window[SHADOW_PATCH_KEY]) {
    return;
  }

  const originalAttachShadow = Element.prototype.attachShadow;
  Element.prototype.attachShadow = function patchedAttachShadow(init) {
    const root = originalAttachShadow.call(this, init);
    if (init?.mode === "open") {
      observeRoot(root);
      scheduleApply();
    }
    return root;
  };

  window[SHADOW_PATCH_KEY] = true;
}

function init() {
  if (!hasBrandingWork()) {
    return;
  }

  patchAttachShadow();
  observeRoot(document);
  scheduleApply();

  window.addEventListener("popstate", scheduleApply);
  window.addEventListener("hashchange", scheduleApply);
  window.addEventListener("focus", scheduleApply);
  document.addEventListener("visibilitychange", scheduleApply);
}

init();
