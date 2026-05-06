/**
 * Input — komponen input reusable
 *
 * Props:
 *  - label: string
 *  - error: string (pesan error)
 *  - icon: ReactNode (ikon di sisi kiri, opsional)
 *  - ...rest: semua prop HTML input biasa
 */
export default function Input({
  label,
  error,
  icon,
  className = "",
  ...rest
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-base">
            {icon}
          </span>
        )}
        <input
          className={[
            "w-full bg-stone-50 border border-stone-200 rounded-xl",
            "px-4 py-3.5 text-stone-900 placeholder:text-stone-400",
            "focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/10",
            "transition-all duration-150",
            error ? "border-red-400 focus:border-red-400 focus:ring-red-400/10" : "",
            icon ? "pl-11" : "",
            className,
          ].join(" ")}
          {...rest}
        />
      </div>
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <span>⚠️</span> {error}
        </p>
      )}
    </div>
  );
}
