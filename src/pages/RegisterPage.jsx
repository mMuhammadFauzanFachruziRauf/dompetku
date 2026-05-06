import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Icon from "../components/ui/Icon";

// ── Password strength ──────────────────────────────────────────────────────────
function getStrength(pwd) {
  return [pwd.length >= 8, /[A-Z]/.test(pwd), /[0-9]/.test(pwd), /[^A-Za-z0-9]/.test(pwd)].filter(Boolean).length;
}
const LEVELS = [
  { label: "Sangat lemah", color: "bg-red-500",    text: "text-red-400"    },
  { label: "Lemah",        color: "bg-orange-500",  text: "text-orange-400" },
  { label: "Cukup",        color: "bg-yellow-500",  text: "text-yellow-400" },
  { label: "Kuat",         color: "bg-emerald-400", text: "text-emerald-400"},
  { label: "Sangat kuat",  color: "bg-emerald-500", text: "text-emerald-300"},
];
function PasswordStrength({ password }) {
  const score = getStrength(password);
  const lvl   = LEVELS[score] ?? LEVELS[0];
  return (
    <div className="space-y-1.5 mt-1.5">
      <div className="flex gap-1.5">
        {[0,1,2,3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? lvl.color : "bg-surface-container-highest"}`}/>
        ))}
      </div>
      <p className="text-[11px] text-on-surface-variant">
        Kekuatan: <span className={`font-semibold ${lvl.text}`}>{lvl.label}</span>
        <span className="ml-1 opacity-50">· min. 8 karakter + angka</span>
      </p>
    </div>
  );
}

// ── Field helper ──────────────────────────────────────────────────────────────
function Field({ label, icon, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">
        {label}
      </label>
      <div className="relative group">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-emerald-400 transition-colors pointer-events-none">
          <Icon name={icon} sizeClass="text-[18px]" />
        </span>
        {children}
      </div>
      {error && (
        <p className="text-xs text-error mt-1.5 flex items-center gap-1">
          <Icon name="error" sizeClass="text-[12px]" />
          {error}
        </p>
      )}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:"", email:"", password:"", confirm:"" });
  const [errors,   setErrors]  = useState({});
  const [loading,  setLoading] = useState(false);
  const [apiError, setApiError]= useState("");
  const [showPass, setShowPass]= useState(false);
  const [success,  setSuccess] = useState(false);

  const set = f => e => setForm(p => ({...p, [f]: e.target.value}));

  const inputCls = (field) =>
    `w-full bg-surface-dim border rounded-xl py-3.5 text-on-surface text-sm focus:outline-none focus:ring-1 transition-all placeholder:text-on-surface-variant/40 ${
      errors[field]
        ? "border-error/50 focus:border-error focus:ring-error/20"
        : "border-outline-variant/40 focus:border-emerald-500/60 focus:ring-emerald-500/20"
    }`;

  const validate = () => {
    const e = {};
    if (!form.name.trim())   e.name    = "Nama wajib diisi";
    if (!form.email.trim())  e.email   = "Email wajib diisi";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Format email tidak valid";
    if (!form.password)      e.password = "Password wajib diisi";
    else if (form.password.length < 8)  e.password = "Password minimal 8 karakter";
    if (form.password !== form.confirm) e.confirm = "Password tidak sama";
    return e;
  };

  const handleSubmit = async e => {
    e.preventDefault(); setApiError("");
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({}); setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email.trim(), password: form.password,
      options: { data: { full_name: form.name.trim() } },
    });
    setLoading(false);
    if (error) {
      setApiError(error.message.toLowerCase().includes("already registered")
        ? "Email ini sudah terdaftar. Silakan login."
        : error.message);
      return;
    }
    setSuccess(true);
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl"/>
        </div>
        <div className="w-full max-w-[400px] text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl mb-6 shadow-lg">
            <Icon name="mark_email_read" sizeClass="text-[36px] text-emerald-400" />
          </div>
          <h2 className="text-2xl font-black text-on-surface mb-3">Cek emailmu!</h2>
          <p className="text-sm text-on-surface-variant mb-2">Kami sudah kirim link konfirmasi ke:</p>
          <div className="inline-block bg-surface-container border border-outline-variant/30 rounded-xl px-5 py-2.5 mb-8">
            <p className="text-emerald-400 font-bold text-sm">{form.email}</p>
          </div>
          <button onClick={() => navigate("/login")}
            className="w-full bg-emerald-500 text-slate-900 font-bold py-3.5 rounded-xl hover:bg-emerald-400 transition-all active:scale-[0.98]">
            Ke halaman Login →
          </button>
          <p className="text-xs text-on-surface-variant mt-4 opacity-60">Tidak ada email? Cek folder Spam.</p>
        </div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl"/>
      </div>

      <div className="w-full max-w-[420px] relative">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl mb-5 shadow-lg shadow-emerald-500/5">
            <Icon name="account_balance_wallet" sizeClass="text-[28px] text-emerald-400" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-on-surface">Buat akun gratis</h1>
          <p className="text-sm text-on-surface-variant mt-1">Mulai kendali keuanganmu hari ini.</p>
        </div>

        {/* Card */}
        <div className="bg-surface-container/80 backdrop-blur-glass border border-outline-variant/30 rounded-2xl p-8 shadow-2xl shadow-black/30">

          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {apiError && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-error/10 border border-error/20">
                <Icon name="error" sizeClass="text-error text-[18px] mt-0.5" />
                <p className="text-sm text-error">{apiError}</p>
              </div>
            )}

            {/* Nama */}
            <Field label="Nama Lengkap" icon="person" error={errors.name}>
              <input type="text" value={form.name} onChange={set("name")}
                placeholder="Nama kamu" autoComplete="name"
                className={`${inputCls("name")} pl-11 pr-4`}/>
            </Field>

            {/* Email */}
            <Field label="Email" icon="mail" error={errors.email}>
              <input type="email" value={form.email} onChange={set("email")}
                placeholder="namamu@email.com" autoComplete="email"
                className={`${inputCls("email")} pl-11 pr-4`}/>
            </Field>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">
                Password
              </label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-emerald-400 transition-colors pointer-events-none">
                  <Icon name="lock" sizeClass="text-[18px]" />
                </span>
                <input type={showPass ? "text" : "password"}
                  value={form.password} onChange={set("password")}
                  placeholder="Min. 8 karakter" autoComplete="new-password"
                  className={`${inputCls("password")} pl-11 pr-24`}/>
                <button type="button" onClick={() => setShowPass(p=>!p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-on-surface-variant hover:text-emerald-400 bg-surface-container-high px-2 py-1 rounded-lg transition-colors">
                  {showPass ? "Sembunyikan" : "Tampilkan"}
                </button>
              </div>
              {errors.password
                ? <p className="text-xs text-error mt-1.5 flex items-center gap-1"><Icon name="error" sizeClass="text-[12px]" />{errors.password}</p>
                : form.password.length > 0 && <PasswordStrength password={form.password}/>
              }
            </div>

            {/* Confirm */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">
                Konfirmasi Password
              </label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-emerald-400 transition-colors pointer-events-none">
                  <Icon name={form.confirm && form.password === form.confirm ? "check_circle" : "lock_reset"} sizeClass="text-[18px]" />
                </span>
                <input type={showPass ? "text" : "password"}
                  value={form.confirm} onChange={set("confirm")}
                  placeholder="Ulangi password" autoComplete="new-password"
                  className={`${inputCls("confirm")} pl-11 pr-4 ${
                    form.confirm && form.password === form.confirm
                      ? "border-emerald-500/40 focus:border-emerald-500/60" : ""
                  }`}/>
                {form.confirm && form.password === form.confirm && (
                  <Icon name="check_circle" sizeClass="text-emerald-400 text-[18px]" />
                )}
              </div>
              {errors.confirm && (
                <p className="text-xs text-error mt-1.5 flex items-center gap-1">
                  <Icon name="error" sizeClass="text-[12px]" />
                  {errors.confirm}
                </p>
              )}
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full bg-emerald-500 text-slate-900 font-bold py-3.5 rounded-xl hover:bg-emerald-400 disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2">
              {loading ? (
                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"/>
                </svg>Membuat akun...</>
              ) : "Buat Akun Gratis →"}
            </button>

            <p className="text-[11px] text-on-surface-variant/60 text-center">
              Gratis selamanya. Tidak perlu kartu kredit.
            </p>
          </form>
        </div>

        <p className="text-center text-sm text-on-surface-variant mt-7">
          Sudah punya akun?{" "}
          <Link to="/login" className="text-emerald-400 font-bold hover:text-emerald-300 hover:underline transition-colors">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
