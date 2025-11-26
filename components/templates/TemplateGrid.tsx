import { CardTemplate } from "@/types/template";
import TemplateCard from "./TemplateCard";
import { SearchX } from "lucide-react";

interface TemplateGridProps {
  templates: CardTemplate[];
}

export default function TemplateGrid({ templates }: TemplateGridProps) {
  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="bg-gray-50 p-4 rounded-full mb-4">
          <SearchX size={48} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">No templates found</h3>
        <p className="text-gray-500 max-w-sm mt-2">
          Try adjusting your search or filters to find what you're looking for.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
      {templates.map((template) => (
        <TemplateCard key={template.id} template={template} />
      ))}
    </div>
  );
}
