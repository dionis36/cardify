"use client";

import React from "react";

/**
 * FontLoader
 * 
 * Loads Google Fonts via standard <link> tags to ensure font family names
 * are predictable (e.g. "Pacifico" instead of "__Pacifico_12345").
 * This is crucial for Konva/Canvas text rendering which relies on standard names.
 */
export default function FontLoader() {
    const fonts = [
        "Inter:wght@400;700",
        "Roboto:wght@400;700",
        "Open+Sans:wght@400;700",
        "Lato:wght@400;700",
        "Montserrat:wght@400;700",
        "Poppins:wght@400;700",
        "Playfair+Display:wght@400;700",
        "Merriweather:wght@400;700",
        "Pacifico",
        "Bebas+Neue",
        "Dancing+Script:wght@400;700",
        "Oswald:wght@400;700"
    ];

    const fontQuery = fonts.join("&family=");
    const href = `https://fonts.googleapis.com/css2?family=${fontQuery}&display=swap`;

    return (
        <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href={href} rel="stylesheet" />
        </>
    );
}
