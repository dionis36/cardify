
"use client";

import { CardTemplate } from "@/types/template";

interface TemplateCardProps {
  template: CardTemplate;
  onEdit: (id: string) => void;
}

export default function TemplateCard({ template, onEdit }: TemplateCardProps) {
  return (
    <div className="bg-white shadow rounded overflow-hidden flex flex-col">
      <img
        src={template.thumbnail}
        alt={template.id}
        className="w-full h-40 object-cover"
      />

      <div className="p-3 flex flex-col gap-2">
        <h3 className="font-semibold text-gray-800">{template.id}</h3>

        {template.tags && template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {template.tags.map((tag, index) => (
              <span
                key={index}
                className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <button
          onClick={() => onEdit(template.id)}
          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Edit Template
        </button>
      </div>
    </div>
  );
}
