import { useState, useRef, useEffect } from "react";
import Icon from "./Icon";

export const AVAILABLE_ICONS = [
  "restaurant", "local_cafe", "shopping_bag", "directions_car",
  "movie", "home", "family_restroom", "favorite",
  "smartphone", "bolt", "account_balance_wallet", "flight",
  "fitness_center", "school", "pets", "local_hospital",
  "savings", "card_giftcard", "checkroom", "inventory_2"
];

// Added money icons / emojis per user request
// These are plain emoji glyphs; they render in the picker alongside material icons
export const MONEY_ICONS = ["💸", "💳", "💰", "💵", "🏦", "🪙", "👛"];

// Merge for rendering convenience
export const ALL_AVAILABLE_ICONS = [...AVAILABLE_ICONS, ...MONEY_ICONS];

export const AVAILABLE_COLORS = [
  "text-orange-400", "text-blue-400", "text-purple-400", 
  "text-pink-400", "text-green-400", "text-emerald-400", 
  "text-rose-400", "text-yellow-400", "text-cyan-400",
  "text-indigo-400", "text-teal-400", "text-slate-400"
];

export default function IconPicker({
  selectedIcon,
  selectedColor,
  onSelectIcon,
  onSelectColor,
  showColors = true,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">
        {showColors ? "Ikon & Warna" : "Ikon"}
      </label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-surface-dim border border-outline-variant/50 rounded-xl px-4 py-3.5 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all hover:bg-surface-container-high"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center`}>
            <Icon name={selectedIcon} className={selectedColor} sizeClass="text-[18px]" />
          </div>
          <span className="text-sm font-semibold text-on-surface">{showColors ? "Pilih Ikon & Warna" : "Pilih Ikon"}</span>
        </div>
        <span className="text-on-surface-variant text-[20px]">
          <Icon name={isOpen ? "expand_less" : "expand_more"} sizeClass="text-[20px]" />
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full mt-2 w-full bg-surface-container-high border border-outline-variant/30 rounded-xl shadow-2xl p-4 animate-fade-in">
          {showColors && (
            <>
              {/* Colors */}
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Warna Tema</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {AVAILABLE_COLORS.map(color => {
                  // Extract the base color name for the background (e.g., text-emerald-400 -> bg-emerald-400)
                  const bgClass = color.replace("text-", "bg-");
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => onSelectColor?.(color)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${bgClass} ${selectedColor === color ? "scale-110 ring-2 ring-offset-2 ring-offset-surface-container-high ring-emerald-400" : "hover:scale-110 opacity-80"}`}
                    />
                  );
                })}
              </div>

              <div className="w-full h-px bg-outline-variant/20 mb-3" />
            </>
          )}

          {/* Icons */}
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Ikon</p>
          <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto no-scrollbar pb-1">
            {ALL_AVAILABLE_ICONS.map(icon => (
              <button
                key={icon}
                type="button"
                onClick={() => onSelectIcon(icon)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  selectedIcon === icon 
                    ? `bg-surface-container-highest ring-1 ring-emerald-500/50 ${selectedColor}` 
                    : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                }`}
              >
                <Icon name={icon} sizeClass="text-[20px]" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
