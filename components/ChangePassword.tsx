import React, { useState } from "react";
import { TextField, Button, Alert, CircularProgress, Paper, Typography } from "@mui/material";
import { apiRequest } from "../lib/apiClient";

export const ChangePassword: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("token") || undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setError("Complete los campos obligatorios.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      await apiRequest("/users/update-password", "PUT", {
        authToken: token,
        body: { currentPassword, newPassword } as any,
      });
      setSuccess("Contraseña actualizada correctamente.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Error al actualizar contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto animate-fade-in pb-12">
      <Paper className="p-8 shadow-lg bg-white">
        <Typography variant="h5" className="font-bold mb-4 text-[#1e242b]">
          Cambiar Contraseña
        </Typography>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          <TextField
            label="Contraseña Actual"
            type="password"
            fullWidth
            size="small"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <TextField
            label="Nueva Contraseña"
            type="password"
            fullWidth
            size="small"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <TextField
            label="Confirmar Contraseña"
            type="password"
            fullWidth
            size="small"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{ backgroundColor: "#1e242b" }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : "Actualizar Contraseña"}
          </Button>
        </form>
      </Paper>
    </div>
  );
};
