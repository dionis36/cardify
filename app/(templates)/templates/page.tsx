

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadTemplates } from "@/lib/templates";
import { CardTemplate } from "@/types/template";
import TemplateCard from "@/components/templates/TemplateCard";
import TemplateGrid from "@/components/templates/TemplateGrid";

const TemplatesPage = () => {
  const [templates, setTemplates] = useState<CardTemplate[]>([]);

  useEffect(() => {
    setTemplates(loadTemplates());
  }, []);

  if (templates.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 text-lg">Loading templates...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center">Choose Your Template</h1>

      <TemplateGrid>
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onEdit={(id) => console.log("Edit template", id)}
          />
        ))}
      </TemplateGrid>

    </main>
  );
};

export default TemplatesPage;
