/**
 * Button — komponen tombol reusable
 *
 * Props:
 *  - variant: "primary" | "secondary" | "ghost"
 *  - size: "sm" | "md" | "lg"
 *  - loading: boolean
 *  - fullWidth: boolean
 *  - ...rest: semua prop HTML button biasa (onClick, type, disabled, dll)
 */

const variants = {
  primary:   "bg-brand-900 hover:bg-brand-800 text-white",
  secondary: "bg-stone-100 hover:bg-stone-200 text-stone-800",
  ghost:     "bg-transparent hover:bg-stone-100 text-stone-600",
  danger:    "bg-red-600 hover:bg-red-700 text-white",
};

const sizes = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-3 text-sm",
  lg: "px-6 py-4 text-base font-bold",
};

export default function Button({
  children,
  variant   = "primary",
  size      = "md",
  loading   = false,
  fullWidth = false,
  className = "",
  ...rest
}) {
  return (
    <button
      className={[
        "rounded-2xl font-semibold transition-all duration-150 active:scale-[0.97]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "flex items-center justify-center gap-2",
        variants[variant],
        sizes[size],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
        </svg>
      )}
      {children}
    </button>
  );
}
