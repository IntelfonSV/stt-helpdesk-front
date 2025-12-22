import React, { useState } from "react";
import { TextField, Button, Alert, CircularProgress } from "@mui/material";
import { Logo } from "./Logo";
import { apiRequest } from "@/lib/apiClient";
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

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // llamada real a tu API
      const data = await apiRequest<LoginResponse>("/auth/login", "POST", {
        body: {
          email, // o email, según tu backend
          password,
        },
      });

      const user = {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
        country: data.country,
        area: data.area,
      };

      console.log(user);

      // aquí podrías guardar token en localStorage / context, etc.
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(user));

      onLogin(data.email, data.token);
    } catch (err) {
      console.error(err);
      setError("Credenciales inválidas o error de conexión con el servidor.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
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
              type="password"
              fullWidth
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
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

          <div className="text-center mt-4">
            <div className="text-xs text-gray-400">
              {/* <p>
                Prueba con: <strong>rcanto@grupostt.com</strong> (Admin)
              </p>
              <p>
                <strong>jefesv@grupostt.com</strong> o{" "}
                <strong>jefegt@grupostt.com</strong> (Jefes)
              </p>
              <p>
                <strong>operativo@grupostt.com</strong> (Operativo)
              </p> */}
              <p className="mt-2">© 2025 Grupo STT</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
