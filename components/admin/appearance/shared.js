"use client";

import { Form, Input, Space } from "antd";

function parseToHex(str) {
  if (!str || typeof str !== "string") return null;
  const raw = str.trim();
  const hexMatch = raw.match(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/);
  if (hexMatch) {
    const h = hexMatch[1];
    return h.length === 3
      ? `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`
      : `#${h}`;
  }
  const rgbMatch = raw.match(
    /rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+\s*)?\)/,
  );
  if (rgbMatch) {
    const r = Math.max(0, Math.min(255, parseInt(rgbMatch[1], 10)));
    const g = Math.max(0, Math.min(255, parseInt(rgbMatch[2], 10)));
    const b = Math.max(0, Math.min(255, parseInt(rgbMatch[3], 10)));
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }
  const anyHex = raw.match(/#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})\b/);
  if (anyHex) {
    const h = anyHex[1];
    return h.length === 3
      ? `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`
      : `#${h}`;
  }
  return null;
}

function parseAlpha(str) {
  if (!str || typeof str !== "string") return 1;
  const m = str
    .trim()
    .match(/rgba\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/);
  return m ? parseFloat(m[1]) : 1;
}

function hexToRgba(hex, a = 1) {
  const match = String(hex).match(/^#?([0-9A-Fa-f]{6})$/);
  if (!match) return hex;
  const r = parseInt(match[1].slice(0, 2), 16);
  const g = parseInt(match[1].slice(2, 4), 16);
  const b = parseInt(match[1].slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function ColorCodeInput({ value, onChange, placeholder }) {
  const raw = String(value || "").trim();
  const pickerHex = parseToHex(raw) || "#999999";
  const wasRgba = /rgba\s*\(/.test(raw);
  const wasGradient = /linear-gradient|gradient\s*\(/.test(raw);
  const alpha = parseAlpha(raw);

  const handlePickerChange = (e) => {
    const hex = e.target.value;
    if (wasRgba) {
      onChange(hexToRgba(hex, alpha));
      return;
    }
    if (wasGradient && raw) {
      const firstHex = raw.match(/#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})\b/);
      onChange(firstHex ? raw.replace(firstHex[0], hex) : hex);
      return;
    }
    onChange(hex);
  };

  return (
    <Space.Compact style={{ width: "100%", display: "flex" }}>
      <input
        type="color"
        value={pickerHex}
        onChange={handlePickerChange}
        style={{
          width: 40,
          height: 32,
          padding: 2,
          border: "1px solid #d9d9d9",
          borderRadius: 6,
          cursor: "pointer",
          flexShrink: 0,
        }}
        title="Pick color"
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          placeholder || "e.g. #1890ff, rgba(...), linear-gradient(...)"
        }
        style={{ flex: 1, minWidth: 0 }}
      />
    </Space.Compact>
  );
}

export function FormColor({ name, label, placeholder }) {
  return (
    <Form.Item name={name} label={label}>
      <ColorCodeInput placeholder={placeholder} />
    </Form.Item>
  );
}

export function AdminLoaderPreview({ form }) {
  const loaderColor = Form.useWatch("adminLoaderColor", form) || "#1677ff";
  const loaderBgColor =
    Form.useWatch("adminLoaderBgColor", form) || "rgba(255,255,255,0.5)";

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 360,
        height: 88,
        borderRadius: 8,
        border: "1px solid #f0f0f0",
        backgroundImage:
          "linear-gradient(45deg, #f5f5f5 25%, transparent 25%), linear-gradient(-45deg, #f5f5f5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f5f5f5 75%), linear-gradient(-45deg, transparent 75%, #f5f5f5 75%)",
        backgroundSize: "16px 16px",
        backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: loaderBgColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: "3px solid #f0f0f0",
            borderTop: `3px solid ${loaderColor}`,
            borderRadius: "50%",
            animation: "adminLoaderSpin 0.8s linear infinite",
          }}
        />
      </div>
      <style>{`
        @keyframes adminLoaderSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

