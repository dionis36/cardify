import { Logo, LogoCategory } from "@/types/logo";

export const LOGO_LIBRARY: Logo[] = [
    // ABSTRACT LOGOS
    {
        id: "abstract_pillar",
        name: "Pillar Icon",
        category: "abstract",
        path: "M12 2L4 6v4l8 4 8-4V6l-8-4zm0 2.18L17.82 6 12 8.82 6.18 6 12 4.18zM6 8.82v2.36L12 14l6-2.82V8.82L12 11.64 6 8.82z M8 14h2v8H8v-8zm6 0h2v8h-2v-8z",
        viewBox: "0 0 24 24",
        defaultSize: 80
    },
    {
        id: "abstract_hexagon",
        name: "Hexagon",
        category: "abstract",
        path: "M12 2l8.66 5v10L12 22 3.34 17V7L12 2zm0 2.3L4.64 7.8v8.4L12 19.7l7.36-3.5V7.8L12 4.3z",
        viewBox: "0 0 24 24",
        defaultSize: 80
    },
    {
        id: "abstract_waves",
        name: "Waves",
        category: "abstract",
        path: "M2 12c0-4.42 3.58-8 8-8s8 3.58 8 8-3.58 8-8 8-8-3.58-8-8zm2 0c0 3.31 2.69 6 6 6s6-2.69 6-6-2.69-6-6-6-6 2.69-6 6z",
        viewBox: "0 0 24 24",
        defaultSize: 80
    },
    {
        id: "abstract_triangle",
        name: "Triangle",
        category: "abstract",
        path: "M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99z",
        viewBox: "0 0 24 24",
        defaultSize: 80
    },
    {
        id: "abstract_circle_grid",
        name: "Circle Grid",
        category: "abstract",
        path: "M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z",
        viewBox: "0 0 24 24",
        defaultSize: 80
    },
    {
        id: "abstract_star",
        name: "Star",
        category: "abstract",
        path: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
        viewBox: "0 0 24 24",
        defaultSize: 80
    },

    // NATURE LOGOS
    {
        id: "nature_flower",
        name: "Flower",
        category: "nature",
        path: "M12 2c-1.1 0-2 .9-2 2 0 .74.4 1.38 1 1.72V7h-.5C9.12 7 8 8.12 8 9.5c0 .74.4 1.38 1 1.72V13h-.5c-1.38 0-2.5 1.12-2.5 2.5S7.12 18 8.5 18h.5v1.28c-.6.34-1 .98-1 1.72 0 1.1.9 2 2 2s2-.9 2-2c0-.74-.4-1.38-1-1.72V18h.5c1.38 0 2.5-1.12 2.5-2.5S12.88 13 11.5 13H11v-1.78c.6-.34 1-.98 1-1.72 0-1.38-1.12-2.5-2.5-2.5H9V5.72c.6-.34 1-.98 1-1.72 0-1.1-.9-2-2-2zm0 2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z",
        viewBox: "0 0 24 24",
        defaultSize: 80
    },
    {
        id: "nature_leaf",
        name: "Leaf",
        category: "nature",
        path: "M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66l.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z",
        viewBox: "0 0 24 24",
        defaultSize: 80
    },
    {
        id: "nature_tree",
        name: "Tree",
        category: "nature",
        path: "M12 2L2 22h20L12 2zm0 3.5L18.5 20H5.5L12 5.5z",
        viewBox: "0 0 24 24",
        defaultSize: 80
    },
    {
        id: "nature_mountain",
        name: "Mountain",
        category: "nature",
        path: "M14 6l-3.75 5 2.85 3.8-1.6 1.2C9.81 13.75 7 10 7 10l-6 8h22L14 6z",
        viewBox: "0 0 24 24",
        defaultSize: 80
    },
    {
        id: "nature_sun",
        name: "Sun",
        category: "nature",
        path: "M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z",
        viewBox: "0 0 24 24",
        defaultSize: 80
    },
    {
        id: "nature_water",
        name: "Water Drop",
        category: "nature",
        path: "M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8zm0 18c-3.35 0-6-2.57-6-6.2 0-2.34 1.95-5.44 6-9.14 4.05 3.7 6 6.8 6 9.14 0 3.63-2.65 6.2-6 6.2z",
        viewBox: "0 0 24 24",
        defaultSize: 80
    },

    // ANIMAL LOGOS
    {
        id: "animal_bull",
        name: "Bull",
        category: "animal",
        path: "M12 2L8 6h8l-4-4zM6 8c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h1v6h2v-6h6v6h2v-6h1c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2H6zm0 2h12v4H6v-4zm3 1v2h2v-2H9zm4 0v2h2v-2h-2z",
        viewBox: "0 0 24 24",
        defaultSize: 80
    },
    {
        id: "animal_bird",
        name: "Bird",
        category: "animal",
        path: "M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z",
        viewBox: "0 0 24 24",
        defaultSize: 80
    },
    {
        id: "animal_fish",
        name: "Fish",
        category: "animal",
        path: "M21.58 16.09l-1.09-7.66C20.21 6.46 18.52 5 16.53 5H7.8C5.42 5 3.4 6.79 3.1 9.14L2 17h20l-.42-.91zM6.4 8.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5S4.9 10.83 4.9 10 5.57 8.5 6.4 8.5z",
        viewBox: "0 0 24 24",
        defaultSize: 80
    },
    {
        id: "animal_paw",
        name: "Paw",
        category: "animal",
        path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5.5-2.5l7.51-3.22-7.52-3.22L6.5 17.5z",
        viewBox: "0 0 24 24",
        defaultSize: 80
    },
    {
        id: "animal_butterfly",
        name: "Butterfly",
        category: "animal",
        path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z",
        viewBox: "0 0 24 24",
        defaultSize: 80
    },

    // TECH LOGOS
    {
        id: "tech_chip",
        name: "Chip",
        category: "tech",
        path: "M6 2v6h.01L6 8.01 10 12l-4 4 .01.01H6V22h12v-5.99h-.01L18 16l-4-4 4-3.99-.01-.01H18V2H6zm10 14.5V20H8v-3.5l4-4 4 4zm-4-5l-4-4V4h8v3.5l-4 4z",
        viewBox: "0 0 24 24",
        defaultSize: 80
    },
    {
        id: "tech_cloud",
        name: "Cloud",
        category: "tech",
        path: "M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z",
        viewBox: "0 0 24 24",
        defaultSize: 80
    },
    {
        id: "tech_wifi",
        name: "Wifi",
        category: "tech",
        path: "M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z",
        viewBox: "0 0 24 24",
        defaultSize: 80
    },
    {
        id: "tech_code",
        name: "Code",
        category: "tech",
        path: "M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z",
        viewBox: "0 0 24 24",
        defaultSize: 80
    },
    {
        id: "tech_database",
        name: "Database",
        category: "tech",
        path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5.5-2.5l7.51-3.22-7.52-3.22L6.5 17.5z",
        viewBox: "0 0 24 24",
        defaultSize: 80
    },

    // BUSINESS LOGOS
    {
        id: "business_briefcase",
        name: "Briefcase",
        category: "business",
        path: "M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z",
        viewBox: "0 0 24 24",
        defaultSize: 80
    },
    {
        id: "business_chart",
        name: "Chart",
        category: "business",
        path: "M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z",
        viewBox: "0 0 24 24",
        defaultSize: 80
    },
    {
        id: "business_building",
        name: "Building",
        category: "business",
        path: "M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z",
        viewBox: "0 0 24 24",
        defaultSize: 80
    },
    {
        id: "business_globe",
        name: "Globe",
        category: "business",
        path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z",
        viewBox: "0 0 24 24",
        defaultSize: 80
    },
    {
        id: "business_tie",
        name: "Tie",
        category: "business",
        path: "M6 2l4 4-3 11 5 5 5-5-3-11 4-4H6z",
        viewBox: "0 0 24 24",
        defaultSize: 80
    }
];

export function getLogoById(id: string): Logo | undefined {
    return LOGO_LIBRARY.find(logo => logo.id === id);
}

export function getLogosByCategory(category: LogoCategory): Logo[] {
    return LOGO_LIBRARY.filter(logo => logo.category === category);
}

export function getRandomLogo(category?: LogoCategory): Logo {
    const logos = category ? getLogosByCategory(category) : LOGO_LIBRARY;
    return logos[Math.floor(Math.random() * logos.length)];
}
