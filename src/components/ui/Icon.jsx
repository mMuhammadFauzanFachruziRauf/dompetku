import React from "react";
import { isMaterialIcon } from "../../utils/helpers";

export default function Icon({ name, className = "", sizeClass = "" }) {
  if (!name) return <span className={`${className} ${sizeClass}`.trim()} />;
  const classes = `${className} ${sizeClass}`.trim();
  if (isMaterialIcon(String(name))) {
    return <span className={`material-symbols-outlined ${classes}`.trim()}>{name}</span>;
  }
  // Emoji or custom glyph
  return <span className={classes}>{name}</span>;
}
