import { describe, expect, it } from "vitest";

window.ha_branding_overrides = {
  appName: "Example Home",
  icon32Url: "/branding/favicon-32.png",
  icon192Url: "/branding/favicon-192.png",
  logoUrl: "/branding/logo.svg",
  logoAlt: "Example Home",
  logoSelectors: [".logo-target"],
  removeSelectors: [".remove-me"],
  themeColor: "#365D49",
};

await import("../src/ha-branding-overrides.js");

const flushBranding = async (iterations = 6) => {
  window.dispatchEvent(new Event("focus"));
  for (let index = 0; index < iterations; index += 1) {
    await Promise.resolve();
    await new Promise((resolve) => window.setTimeout(resolve, 5));
  }
};

describe("ha-branding-overrides", () => {
  it("updates document title, head icon links, and theme metadata", async () => {
    document.title = "Home Assistant";
    document.head.innerHTML = `
      <link rel="icon" href="/old.ico">
      <link rel="apple-touch-icon" href="/old-touch.png">
    `;

    await flushBranding();

    expect(document.title).toBe("Example Home");
    expect(document.querySelector('link[rel="icon"]')?.href).toContain("/branding/favicon-192.png");
    expect(document.getElementById("ha-branding-overrides-favicon")?.href).toContain("/branding/favicon-32.png");
    expect(document.getElementById("ha-branding-overrides-shortcut-icon")?.href).toContain("/branding/favicon-32.png");
    expect(document.getElementById("ha-branding-overrides-apple-touch-icon")?.href).toContain("/branding/favicon-192.png");
    expect(document.querySelector('meta[name="application-name"]')?.content).toBe("Example Home");
    expect(document.querySelector('meta[name="apple-mobile-web-app-title"]')?.content).toBe("Example Home");
    expect(document.querySelector('meta[name="theme-color"]')?.content).toBe("#365D49");
  });

  it("replaces visible text and accessibility text, removes matched nodes, and swaps logos", async () => {
    document.title = "Home Assistant";
    document.body.innerHTML = `
      <div class="brand-text">Home Assistant</div>
      <button title="Home Assistant" aria-label="Home Assistant">Home Assistant</button>
      <img class="logo-target" src="/old-logo.svg" alt="Old logo">
      <div class="remove-me">remove this</div>
    `;

    const host = document.createElement("section");
    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = `
      <span>Home Assistant</span>
      <button title="Home Assistant" aria-label="Home Assistant">Home Assistant</button>
      <img class="logo-target" src="/shadow-old.svg" alt="Shadow logo">
    `;
    document.body.appendChild(host);

    await flushBranding();

    expect(document.querySelector(".brand-text")?.textContent).toBe("Example Home");
    const button = document.querySelector("button");
    expect(button?.textContent).toBe("Example Home");
    expect(button?.getAttribute("title")).toBe("Example Home");
    expect(button?.getAttribute("aria-label")).toBe("Example Home");
    expect(document.querySelector(".remove-me")).toBeNull();

    const bodyLogo = document.querySelector(".logo-target");
    expect(bodyLogo?.src).toContain("/branding/logo.svg");
    expect(bodyLogo?.alt).toBe("Example Home");

    const shadowButton = shadow.querySelector("button");
    expect(shadow.querySelector("span")?.textContent).toBe("Example Home");
    expect(shadowButton?.textContent).toBe("Example Home");
    expect(shadowButton?.getAttribute("title")).toBe("Example Home");
    expect(shadowButton?.getAttribute("aria-label")).toBe("Example Home");
    const shadowLogo = shadow.querySelector(".logo-target");
    expect(shadowLogo?.src).toContain("/branding/logo.svg");
    expect(shadowLogo?.alt).toBe("Example Home");
  });

  it("observes future DOM mutations and patches new open shadow roots after init", async () => {
    await flushBranding();

    const lateLogo = document.createElement("img");
    lateLogo.className = "logo-target";
    lateLogo.src = "/late-logo.svg";
    const lateRemove = document.createElement("div");
    lateRemove.className = "remove-me";
    lateRemove.textContent = "remove later";
    document.body.append(lateLogo, lateRemove);

    const lateHost = document.createElement("div");
    document.body.appendChild(lateHost);
    const lateShadow = lateHost.attachShadow({ mode: "open" });
    lateShadow.innerHTML = `<span>Home Assistant</span>`;

    await flushBranding();

    expect(document.querySelector(".remove-me")).toBeNull();
    expect(lateLogo.src).toContain("/branding/logo.svg");
    expect(lateLogo.alt).toBe("Example Home");
    expect(lateShadow.querySelector("span")?.textContent).toBe("Example Home");
  });
});
