"use client";

interface TemplateGridProps {
  children: React.ReactNode;
}

export default function TemplateGrid({ children }: TemplateGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4">
      {children}
    </div>
  );
}
