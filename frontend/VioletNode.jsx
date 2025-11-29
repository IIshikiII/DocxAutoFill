import React, { memo } from "react";
import { Position } from "@xyflow/react";
import CustomHandle from "./CustomHandle";

// Генерация оттенков фиолетового для категорий
const generateVioletShade = (index, total) => {
  const baseHue = 270; // Фиолетовый
  const baseSaturation = 70;
  const lightness = 85 - index * (30 / Math.max(total - 1, 1));
  return {
    background: `hsl(${baseHue}, ${baseSaturation}%, ${lightness}%)`,
    border: `hsl(${baseHue}, ${baseSaturation}%, ${Math.max(
      lightness - 20,
      20
    )}%)`,
  };
};

const VioletNode = ({ data, selected }) => {
  // Получаем все узлы типа violet из глобального window.nodes
  let categories = [];
  if (window.nodes) {
    categories = [
      ...new Set(
        window.nodes
          .filter((n) => n.type === "violet")
          .map((n) => n.data.category)
      ),
    ];
  }
  const category = data?.category || (categories && categories[0]) || "default";
  const index = categories ? categories.indexOf(category) : 0;
  const style = generateVioletShade(index, categories ? categories.length : 1);
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -22,
          left: 0,
          width: "100%",
          textAlign: "center",
          fontSize: 13,
          color: "rgba(80,0,120,0.4)",
          fontWeight: 500,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </div>
      <div
        className={`custom-node violet-node ${selected ? "selected" : ""}`}
        style={{
          padding: 8,
          borderRadius: 6,
          background: style.background,
          border: `1px solid ${style.border}`,
          display: "flex",
          alignItems: "center",
          fontWeight: 600,
          minWidth: 80,
          justifyContent: "center",
        }}
      >
        {data?.label || ""}
        <CustomHandle
          type="target"
          position={Position.Right}
          connectionCount={1}
        />
      </div>
    </div>
  );
};

export default memo(VioletNode);
