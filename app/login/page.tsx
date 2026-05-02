"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, User } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, pin }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("adena_user", JSON.stringify(data));
        if (data.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
      } else {
        setError(data.error || "Đăng nhập thất bại");
      }
    } catch (err) {
      setError("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shell" style={{ display: "grid", placeItems: "center", minHeight: "80vh" }}>
      <div className="card animate-fade-in" style={{ width: "100%", maxWidth: "400px" }}>
        <h2 className="font-heading" style={{ textAlign: "center", marginBottom: "32px" }}>Đăng nhập hệ thống</h2>
        
        {error && (
          <div className="text-danger" style={{ marginBottom: "16px", textAlign: "center", fontSize: "0.9rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: "grid", gap: "20px" }}>
          <div>
            <label><User size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Tài khoản</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="Username"
              required 
            />
          </div>
          <div>
            <label><Lock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Mã PIN</label>
            <input 
              type="password" 
              value={pin} 
              onChange={(e) => setPin(e.target.value)} 
              placeholder="****"
              required 
            />
          </div>
          <button type="submit" disabled={loading} style={{ width: "100%", marginTop: "12px" }}>
            {loading ? "Đang xử lý..." : "Vào hệ thống"}
          </button>
        </form>

        <div style={{ marginTop: "24px", textAlign: "center" }}>
          <Link href="/" className="text-muted" style={{ fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
            <ArrowLeft size={14} /> Quay lại Dashboard công khai
          </Link>
        </div>
      </div>
    </div>
  );
}
