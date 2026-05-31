import React, { memo } from "react";
import { Position } from "@xyflow/react";
import CustomHandle from "./CustomHandle";
import type { NodeComponentProps } from "./src/types";
import mockBlue from "./api/blueNodes.json";

interface CategoryStyle {
  background: string;
  border: string;
  label: string;
}

// Генерация оттенков синего для категорий
const generateBlueShade = (index: number, total: number) => {
  // Базовый синий цвет (RGB)
  const baseHue = 210; // Синий
  const baseSaturation = 90;

  // Изменяем яркость от светлого к тёмному
  const lightness = 85 - index * (30 / Math.max(total - 1, 1));

  return {
    background: `hsl(${baseHue}, ${baseSaturation}%, ${lightness}%)`,
    border: `hsl(${baseHue}, ${baseSaturation}%, ${Math.max(
      lightness - 20,
      20
    )}%)`,
  };
};

// Извлекаем уникальные категории из узлов
const uniqueCategories: string[] = [
  ...new Set(mockBlue.map((node) => node.data.category)),
];
const categoryStyles = uniqueCategories.reduce<Record<string, CategoryStyle>>(
  (styles, category, index) => {
    styles[category] = {
      ...generateBlueShade(index, uniqueCategories.length),
      label: category.charAt(0).toUpperCase() + category.slice(1), // Капитализируем первую букву
    };
    return styles;
  },
  {}
);

const BlueNode = ({ data, selected }: NodeComponentProps) => {
  const category = data?.category || uniqueCategories[0] || "default";

  // If this category exists in categoryStyles use it, otherwise compute a base style
  // and set the label based on the category string so we don't lose category names
  const baseStyle = categoryStyles[category];
  const style = baseStyle
    ? baseStyle
    : {
        ...generateBlueShade(0, 1),
        label: category ? String(category).trim() : "Узел",
      };

  const labelText =
    style.label || (category ? String(category).trim() : "Узел");

  return (
    <div
      className={`custom-node blue-node ${selected ? "selected" : ""}`}
      style={{
        padding: 8,
        borderRadius: 6,
        background: style.background,
        border: `1px solid ${style.border}`,
        display: "flex",
        alignItems: "center",
      }}
    >
      <div style={{ fontWeight: 600, marginRight: 8 }}>{`${labelText}: ${
        data?.label || ""
      }`}</div>
      <CustomHandle
        type="target"
        position={Position.Right}
        connectionCount={1}
      />
    </div>
  );
};

export default memo(BlueNode);
