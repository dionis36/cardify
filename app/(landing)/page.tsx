"use client";

import Link from "next/link";
import { FC } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

const LandingPage: FC = () => {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-start py-6 sm:py-8 md:py-12 px-4">
      {/* Hero Section */}
      <section className="text-center max-w-4xl mb-12 sm:mb-16">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4">Cardify</h1>
        <p className="text-gray-700 text-base sm:text-lg mb-6">
          Design your perfect business cards online — fast, easy, and fully customizable.
        </p>
        <Link href="/templates">
          <Button className="px-4 py-2 sm:px-6 sm:py-3 text-base sm:text-lg">Browse Templates</Button>
        </Link>
      </section>

      {/* Features Section */}
      <section className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
        <Card className="p-5 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold mb-2">Custom Templates</h3>
          <p className="text-sm sm:text-base text-gray-600">
            Choose from dozens of professionally designed business card templates.
          </p>
        </Card>
        <Card className="p-5 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold mb-2">Easy Editor</h3>
          <p className="text-sm sm:text-base text-gray-600">
            Drag, resize, and edit text, colors, and logos effortlessly with our online editor.
          </p>
        </Card>
        <Card className="p-5 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold mb-2">High-Quality Export</h3>
          <p className="text-sm sm:text-base text-gray-600">
            Download print-ready PNG or PDF files with professional quality.
          </p>
        </Card>
      </section>

      {/* Call to Action */}
      <section className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4">Start Designing Your Card Today!</h2>
        <Link href="/templates">
          <Button className="px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg">Start Now</Button>
        </Link>
      </section>
    </main>
  );
};

export default LandingPage;
