export const PROFILE_ICON_MAP = {
    github: "simple-icons:github",
    linkedin: "simple-icons:linkedin",
    twitter: "simple-icons:twitter",
    youtube: "simple-icons:youtube",
    instagram: "simple-icons:instagram",
    spotify: "simple-icons:spotify",
    bluesky: "simple-icons:bluesky",
    tiktok: "simple-icons:tiktok"
};

const ALIASES = {
    x: "twitter"
};

export function getIconName(name) {
    if (!name) return null;

    let normalized = name.toLowerCase().replace(/[\s.+#()\\/]/g, "");
    normalized = ALIASES[normalized] ?? normalized;

    return PROFILE_ICON_MAP[normalized] ?? null;
}
