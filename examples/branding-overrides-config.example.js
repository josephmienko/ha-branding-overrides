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
