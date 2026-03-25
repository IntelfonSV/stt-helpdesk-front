import React, { useState } from "react";
import { TextField, Button, Alert, CircularProgress, IconButton, InputAdornment } from "@mui/material";
import { Logo } from "./Logo";
import { ForgotPasswordScreen } from "./ForgotPasswordScreen";
import { apiRequest } from "@/lib/apiClient";
import { Eye, EyeOff } from "lucide-react";
interface LoginScreenProps {
  onLogin: (email: string, token?: string) => void;
}

interface LoginResponse {
  token: string;
  name: string;
  country: object;
  email: string;
  id: number;
  role: string;
  area?: string;
  avatar?: string;
}

type BackendValidationError = {
  msg?: string;
  message?: string;
  param?: string;
};

function extractApiErrorMessage(err: unknown): string {
  const anyErr = err as any;

  // Compat: axios-like (err.response) o custom (err.status/err.data)
  const status = anyErr?.status ?? anyErr?.response?.status;
  const data = anyErr?.data ?? anyErr?.response?.data;

  // express-validator: { message: "Bad Request", errors: [...] }
  if (status === 400 && data && Array.isArray(data.errors)) {
    const msgs = (data.errors as BackendValidationError[])
      .map((e) => e?.msg || e?.message)
      .filter(Boolean);

    if (msgs.length) return msgs.join(" • ");
    if (typeof data.message === "string") return data.message;
    return "Bad Request (400).";
  }

  // Error estándar backend: { message: "..." }
  if (data?.message && typeof data.message === "string") return data.message;

  // Alternativa: { error: "..." }
  if (data?.error && typeof data.error === "string") return data.error;

  // Error object
  if (anyErr?.message && typeof anyErr.message === "string") return anyErr.message;

  // Status sin body
  if (typeof status === "number") {
    if (status === 401) return "Credenciales inválidas.";
    if (status === 403) return "Acceso denegado.";
    if (status >= 500) return `Error del servidor (${status}).`;
    return `Error HTTP (${status}).`;
  }

  return "Error de conexión con el servidor o respuesta inválida.";
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest<LoginResponse>("/auth/login", "POST", {
        body: { email, password },
      });

      const user = {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
        country: data.country,
        area: data.area,
      };


      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(user));

      onLogin(data.email, data.token);
    } catch (err) {
      console.error(err);
      setError(extractApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleShowForgotPassword = () => {
    setShowForgotPassword(true);
    setError("");
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setError("");
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  if (showForgotPassword) {
    return <ForgotPasswordScreen onBackToLogin={handleBackToLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1/2 bg-[#1e242b] skew-y-3 origin-top-left -z-10 transform -translate-y-20"></div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
        <div className="p-8 text-center bg-white border-b border-gray-100">
          <div className="flex justify-center mb-6">
            <Logo variant="dark" className="scale-125" />
          </div>
          <h2 className="text-2xl font-bold text-[#1e242b]">Bienvenido</h2>
          <p className="text-gray-500 mt-2 text-sm">
            Ingrese sus credenciales para acceder al Service Desk.
          </p>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {error && <Alert severity="error">{error}</Alert>}

          <div className="space-y-4">
            <TextField
              label="Usuario (Email)"
              fullWidth
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoFocus
              placeholder="ej: rcanto@grupostt.com"
            />
            <TextField
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              fullWidth
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleTogglePassword}
                      edge="end"
                      disabled={loading}
                      sx={{ color: "#666" }}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </div>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            disabled={loading}
            sx={{
              height: 48,
              backgroundColor: "#e51b24",
              "&:hover": { backgroundColor: "#c4121b" },
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Ingresar al Sistema"
            )}
          </Button>

          <div className="text-center">
            <Button
              variant="text"
              color="primary"
              onClick={handleShowForgotPassword}
              sx={{
                textTransform: "none",
                color: "#1e242b",
                fontSize: "0.875rem",
              }}
            >
              ¿Olvidaste tu contraseña?
            </Button>
          </div>

          <div className="text-center mt-4">
            <div className="text-xs text-gray-400">
              <p className="mt-2">© 2025 Grupo STT</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};