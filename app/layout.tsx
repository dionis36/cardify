import "./globals.css";
import type { Metadata } from "next";
import { Inter, Roboto, Playfair_Display, Bebas_Neue, Poppins, Lato, Montserrat, Open_Sans, Merriweather, Pacifico, Dancing_Script, Oswald } from 'next/font/google';

// Load all fonts using Next.js font optimization
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const roboto = Roboto({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-roboto', display: 'swap' });
const playfair = Playfair_Display({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-playfair', display: 'swap' });
const bebas = Bebas_Neue({ weight: ['400'], subsets: ['latin'], variable: '--font-bebas', display: 'swap' });
const poppins = Poppins({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-poppins', display: 'swap' });
const lato = Lato({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-lato', display: 'swap' });
const montserrat = Montserrat({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-montserrat', display: 'swap' });
const openSans = Open_Sans({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-opensans', display: 'swap' });
const merriweather = Merriweather({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-merriweather', display: 'swap' });
const pacifico = Pacifico({ weight: ['400'], subsets: ['latin'], variable: '--font-pacifico', display: 'swap' });
const dancingScript = Dancing_Script({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-dancing-script', display: 'swap' });
const oswald = Oswald({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-oswald', display: 'swap' });

export const metadata: Metadata = {
  title: "Cardify – Business Card Designer",
  description: "Create stunning business cards effortlessly with Cardify.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${roboto.variable} ${playfair.variable} ${bebas.variable} ${poppins.variable} ${lato.variable} ${montserrat.variable} ${openSans.variable} ${merriweather.variable} ${pacifico.variable} ${dancingScript.variable} ${oswald.variable}`}>
      <body className="bg-background text-secondary">
        {children}
      </body>
    </html>
  );
}
