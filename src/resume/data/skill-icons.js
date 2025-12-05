export const SKILL_ICON_MAP = {
    javascript: "devicon:javascript",
    typescript: "devicon:typescript",
    java: "devicon:java",
    c: "devicon:c",
    csharp: "devicon:csharp",
    cplusplus: "devicon:cplusplus",
    python: "devicon:python",
    ruby: "devicon:ruby",
    go: "devicon:go",
    rust: "devicon:rust",
    html: "devicon:html5",
    css: "devicon:css3",
    sass: "devicon:sass",
    tailwind: "devicon:tailwindcss",
    react: "devicon:react",
    node: "devicon:nodejs",
    svelte: "devicon:svelte",
    next: "devicon:nextjs",
    flutter: "devicon:flutter",
    astro: "devicon:astro",
    git: "devicon:git",
    github: "devicon:github",
    linux: "devicon:linux",
    docker: "devicon:docker",
    mysql: "devicon:mysql",
    postgresql: "devicon:postgresql",
    mongodb: "devicon:mongodb",
    sqlite: "devicon:sqlite",
    swift: "devicon:swift",
    kotlin: "devicon:kotlin",
    matlab: "devicon:matlab",
    jupyter: "devicon:jupyter",
    julia: "devicon:julia",
    r: "devicon:r",
    pandas: "devicon:pandas",
    numpy: "devicon:numpy",
    photoshop: "devicon:photoshop",
    lightroom: "devicon:lightroom",
    indesign: "devicon:indesign",
    illustrator: "devicon:illustrator",
    aftereffects: "devicon:aftereffects",
    figma: "devicon:figma",
    blender: "devicon:blender",
    unity: "devicon:unity"
};

const ALIASES = {
    "c++": "cplusplus",
    "c#": "csharp",
    nextjs: "next",
    nodejs: "node",
    reactjs: "react",
    js: "javascript",
    ts: "typescript",
    x: "twitter"
};

export function getIconName(name) {
    if (!name) return null;

    let normalized = name.toLowerCase().replace(/[\s.+#()\\/]/g, "");
    normalized = ALIASES[normalized] ?? normalized;

    return SKILL_ICON_MAP[normalized] ?? null;
}
