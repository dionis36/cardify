import React from "react";
import { CardTemplate } from "@/types/template";
import Link from "next/link";
import TemplatePreview from "./TemplatePreview";

interface TemplateCardProps {
  template: CardTemplate;
  onUseTemplate?: (template: CardTemplate) => void;
}

export default function TemplateCard({ template, onUseTemplate }: TemplateCardProps) {
  return (
    <Link href={`/design/${template.id}`} className="block group">
      <div className="relative bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-2xl hover:border-gray-300 transition-all duration-300 transform hover:-translate-y-1">
        {/* Thumbnail Container - Aspect Ratio 1.75:1 (Standard Business Card) */}
        <div className="relative aspect-[1.75/1] w-full bg-gray-100 overflow-hidden">
          {/* Live Template Preview */}
          <TemplatePreview template={template} />

          {/* Hover Overlay - Subtle tint */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 pointer-events-none" />

          {/* Badge (e.g., New) - Kept as requested by design intuition, but minimal */}
          {template.tags.includes('New') && (
            <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider rounded shadow-sm">
              New
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
