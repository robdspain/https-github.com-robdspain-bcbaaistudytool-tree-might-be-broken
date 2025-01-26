import React from "react";
import { CategoryCard } from "./CategoryCard";

interface CategoryStats {
  name: string;
  percentage: number;
  subdomains: {
    name: string;
    percentage: number;
    total: number;
  }[];
}

interface CategoryListProps {
  stats: CategoryStats[];
  expandedCategories: string[];
  onToggleCategory: (category: string) => void;
}

export const CategoryList = ({ stats, expandedCategories, onToggleCategory }: CategoryListProps) => {
  return (
    <div className="space-y-6">
      {stats.map((category, index) => (
        <CategoryCard
          key={index}
          name={category.name}
          percentage={category.percentage}
          subdomains={category.subdomains}
          isExpanded={expandedCategories.includes(category.name)}
          onToggle={() => onToggleCategory(category.name)}
        />
      ))}
    </div>
  );
};
