import React, { useState } from "react";
import { TextField, Button, Alert, CircularProgress } from "@mui/material";
import { Logo } from "./Logo";
import { apiRequest } from "@/lib/apiClient";

interface ForgotPasswordScreenProps {
  onBackToLogin: () => void;
}

interface ResetPasswordResponse {
  ok: boolean;
  message: string;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ onBackToLogin }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const data = await apiRequest<ResetPasswordResponse>("/auth/reset-password", "POST", {
        body: {
          email,
        },
      });

      if (data.ok) {
        setSuccess(true);
      }
    } catch (err) {
      console.error(err);
      setError("Error al enviar el correo de restablecimiento. Verifique el correo ingresado.");
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    onBackToLogin();
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-[#1e242b] skew-y-3 origin-top-left -z-10 transform -translate-y-20"></div>

        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
          <div className="p-8 text-center bg-white border-b border-gray-100">
            <div className="flex justify-center mb-6">
              <Logo variant="dark" className="scale-125" />
            </div>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#1e242b]">Correo Enviado</h2>
            <p className="text-gray-500 mt-2 text-sm">
              Hemos enviado un correo con instrucciones para restablecer tu contraseña.
            </p>
            <p className="text-gray-500 mt-2 text-sm">
              Por favor, revisa tu bandeja de entrada y sigue las instrucciones.
            </p>
          </div>

          <div className="p-8">
            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              onClick={handleBackToLogin}
              sx={{
                height: 48,
                backgroundColor: "#e51b24",
                "&:hover": { backgroundColor: "#c4121b" },
              }}
            >
              Volver al Inicio de Sesión
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-[#1e242b] skew-y-3 origin-top-left -z-10 transform -translate-y-20"></div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
        <div className="p-8 text-center bg-white border-b border-gray-100">
          <div className="flex justify-center mb-6">
            <Logo variant="dark" className="scale-125" />
          </div>
          <h2 className="text-2xl font-bold text-[#1e242b]">¿Olvidaste tu contraseña?</h2>
          <p className="text-gray-500 mt-2 text-sm">
            Ingresa tu correo electrónico y te enviaremos instrucciones para restablecerla.
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="p-8 space-y-6">
          {error && <Alert severity="error">{error}</Alert>}

          <div className="space-y-4">
            <TextField
              label="Correo Electrónico"
              fullWidth
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoFocus
              placeholder="ej: rcanto@grupostt.com"
              type="email"
            />
          </div>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            disabled={loading || !email}
            sx={{
              height: 48,
              backgroundColor: "#e51b24",
              "&:hover": { backgroundColor: "#c4121b" },
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Enviar Correo de Restablecimiento"
            )}
          </Button>

          <div className="text-center">
            <Button
              variant="text"
              color="primary"
              onClick={handleBackToLogin}
              sx={{
                textTransform: "none",
                color: "#1e242b",
              }}
            >
              ← Volver al Inicio de Sesión
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
