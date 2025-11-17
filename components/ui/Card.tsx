"use client";

import { ReactNode } from "react";
import clsx from "clsx";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className }: CardProps) {
  return (
    <div
      className={clsx(
        "bg-white rounded-lg shadow-md p-4 border border-gray-100",
        className
      )}
    >
      {children}
    </div>
  );
}
