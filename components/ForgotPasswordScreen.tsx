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

  reset?: {
    success: boolean;
  };
  mail?: {
    success: boolean;
    type?: string;
    details?: {
      name?: string;
      message?: string;
      code?: string | number;
      responseCode?: string | number;
      command?: string;
    };
    data?: any;
  };

  errors?: Array<{
    type?: string;
    msg?: string;
    path?: string;
    location?: string;
    value?: any;
  }>;
}

const mapMailTypeToUserMessage = (type?: string) => {
  switch (type) {
    case "SMTP_AUTH":
      return "No se pudo autenticar con el servidor de correo (SMTP).";
    case "SMTP_CONNECT":
      return "No se pudo conectar al servidor de correo (SMTP).";
    case "SMTP_TIMEOUT":
      return "Tiempo de espera agotado al enviar el correo (SMTP).";
    case "DNS":
      return "Error de DNS al resolver el servidor de correo.";
    case "SMTP_REJECTED":
      return "El servidor de correo rechazó el envío (SMTP).";
    case "SMTP_TEMPORARY":
      return "El servidor de correo reportó un fallo temporal (SMTP).";
    default:
      return "Falló el envío del correo de restablecimiento.";
  }
};

const buildTechDetails = (payload?: ResetPasswordResponse) => {
  const type = payload?.mail?.type;
  const d = payload?.mail?.details;

  const parts: string[] = [];

  if (type) parts.push(`type=${type}`);
  if (d?.code !== undefined) parts.push(`code=${String(d.code)}`);
  if (d?.responseCode !== undefined) parts.push(`responseCode=${String(d.responseCode)}`);
  if (d?.command) parts.push(`command=${d.command}`);
  if (d?.name) parts.push(`name=${d.name}`);
  if (d?.message) parts.push(`message=${d.message}`);

  // Si hay errores de validación, también se pintan
  if (payload?.errors?.length) {
    const first = payload.errors[0];
    parts.push(
      `validation=${first?.msg || "Invalid request"}${first?.path ? ` (field=${first.path})` : ""}`
    );
  }

  if (!parts.length) return "";
  return parts.join(" | ");
};

const buildUserErrorMessage = (payload?: ResetPasswordResponse) => {
  // Validación
  if (payload?.errors?.length) {
    const first = payload.errors[0];
    const field = first?.path ? ` (${first.path})` : "";
    return `${first?.msg || "Solicitud inválida"}${field}.`;
  }

  // Reset OK pero email falló
  if (payload?.reset?.success && payload?.mail?.success === false) {
    const msg = mapMailTypeToUserMessage(payload?.mail?.type);
    return `${msg} El restablecimiento se realizó, pero no se pudo notificar por correo.`;
  }

  // Fallback
  return payload?.message || "No se pudo procesar la solicitud. Intenta nuevamente.";
};

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ onBackToLogin }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // error “pintable” (incluye detalle técnico)
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const data = await apiRequest<ResetPasswordResponse>("/auth/reset-password", "POST", {
        body: { email },
      });

      setLoading(false);

      if (data?.ok) {
        setSuccess(true);
        return;
      }

      const userMsg = buildUserErrorMessage(data);
      const tech = buildTechDetails(data);

      // IMPORTANTE: aquí pintamos el error exacto que vino en details
      setError(tech ? `${userMsg}\n\nDetalles técnicos: ${tech}` : userMsg);
    } catch (err: any) {
      console.error(err);
      setLoading(false);

      // Intentamos extraer el body de error desde distintos “shapes”
      const resp: ResetPasswordResponse | undefined = err?.response || err?.data || err?.body;

      const userMsg = buildUserErrorMessage(resp);
      const tech = buildTechDetails(resp);

      // Si no vino body estructurado, mostramos al menos el mensaje del error del cliente HTTP
      const fallbackTech =
        tech ||
        (err?.message ? `clientError=${String(err.message)}` : "") ||
        (err?.toString ? `clientError=${String(err.toString())}` : "");

      setError(
        fallbackTech
          ? `${userMsg}\n\nDetalles técnicos: ${fallbackTech}`
          : "No se pudo completar el restablecimiento. Intenta nuevamente."
      );
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
          {error && (
            <Alert severity="error" sx={{ whiteSpace: "pre-line" }}>
              {error}
            </Alert>
          )}

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
            {loading ? <CircularProgress size={24} color="inherit" /> : "Enviar Correo de Restablecimiento"}
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