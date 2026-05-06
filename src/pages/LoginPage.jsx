import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const navigate = useNavigate();
  const [form,     setForm]    = useState({ email: "", password: "" });
  const [errors,   setErrors]  = useState({});
  const [loading,  setLoading] = useState(false);
  const [apiError, setApiError]= useState("");
  const [showPass, setShowPass]= useState(false);

  const set = f => e => setForm(p => ({...p, [f]: e.target.value}));

  const validate = () => {
    const e = {};
    if (!form.email)    e.email    = "Email wajib diisi";
    if (!form.password) e.password = "Password wajib diisi";
    return e;
  };

  const handleSubmit = async e => {
    e.preventDefault(); setApiError("");
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({}); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email.trim(), password: form.password,
    });
    setLoading(false);
    if (error) {
      setApiError(error.message.includes("Invalid login credentials")
        ? "Email atau password salah. Coba lagi ya."
        : error.message.includes("Email not confirmed")
        ? "Email belum dikonfirmasi. Cek inbox-mu."
        : error.message);
      return;
    }
    navigate("/");
  };

  const handleForgotPassword = async () => {
    if (!form.email) { setErrors(p => ({...p, email: "Isi email dulu"})); return; }
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(form.email.trim());
    setLoading(false);
    alert("📬 Link reset password sudah dikirim ke emailmu!");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">

      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-[420px] relative">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl mb-5 shadow-lg shadow-emerald-500/5">
            <span className="material-symbols-outlined text-[28px] text-emerald-400"
              style={{fontVariationSettings:"'FILL' 1"}}>
              account_balance_wallet
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-on-surface">DompetKu</h1>
          <p className="text-sm text-on-surface-variant mt-1">Lacak keuangan, bebas ribet.</p>
        </div>

        {/* Card */}
        <div className="bg-surface-container/80 backdrop-blur-glass border border-outline-variant/30 rounded-2xl p-8 shadow-2xl shadow-black/30">

          <h2 className="text-xl font-bold text-on-surface mb-1">Selamat datang kembali</h2>
          <p className="text-sm text-on-surface-variant mb-7">Masuk untuk lanjut melacak keuanganmu 👋</p>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* API error */}
            {apiError && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-error/10 border border-error/20">
                <span className="material-symbols-outlined text-error text-[18px] mt-0.5">error</span>
                <p className="text-sm text-error">{apiError}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">
                Email
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-emerald-400 transition-colors text-[18px]">
                  mail
                </span>
                <input
                  type="email" value={form.email} onChange={set("email")}
                  placeholder="namamu@email.com" autoComplete="email"
                  className={`w-full bg-surface-dim border rounded-xl pl-11 pr-4 py-3.5 text-on-surface text-sm focus:outline-none focus:ring-1 transition-all placeholder:text-on-surface-variant/40 ${
                    errors.email
                      ? "border-error/50 focus:border-error focus:ring-error/20"
                      : "border-outline-variant/40 focus:border-emerald-500/60 focus:ring-emerald-500/20"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-error mt-1.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">error</span>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">
                Password
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-emerald-400 transition-colors text-[18px]">
                  lock
                </span>
                <input
                  type={showPass ? "text" : "password"} value={form.password} onChange={set("password")}
                  placeholder="••••••••" autoComplete="current-password"
                  className={`w-full bg-surface-dim border rounded-xl pl-11 pr-24 py-3.5 text-on-surface text-sm focus:outline-none focus:ring-1 transition-all placeholder:text-on-surface-variant/40 ${
                    errors.password
                      ? "border-error/50 focus:border-error focus:ring-error/20"
                      : "border-outline-variant/40 focus:border-emerald-500/60 focus:ring-emerald-500/20"
                  }`}
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-on-surface-variant hover:text-emerald-400 bg-surface-container-high px-2 py-1 rounded-lg transition-colors">
                  {showPass ? "Sembunyikan" : "Tampilkan"}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-error mt-1.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">error</span>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Forgot */}
            <div className="flex justify-end -mt-1">
              <button type="button" onClick={handleForgotPassword}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:underline transition-colors">
                Lupa password?
              </button>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full bg-emerald-500 text-slate-900 font-bold py-3.5 rounded-xl hover:bg-emerald-400 disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2">
              {loading ? (
                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"/>
                </svg>Masuk...</>
              ) : "Masuk →"}
            </button>
          </form>
        </div>

        {/* Register link */}
        <p className="text-center text-sm text-on-surface-variant mt-7">
          Belum punya akun?{" "}
          <Link to="/register" className="text-emerald-400 font-bold hover:text-emerald-300 hover:underline transition-colors">
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}
