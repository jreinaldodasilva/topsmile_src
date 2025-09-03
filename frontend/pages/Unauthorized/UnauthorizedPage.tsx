import React from "react";
import { Link } from "react-router-dom";

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <h1 className="text-4xl font-bold text-red-600 mb-4">
        Acesso negado
      </h1>
      <p className="text-lg text-gray-700 mb-6">
        Você não tem permissão para acessar esta página.
      </p>
      <Link
        to="/"
        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
      >
        Voltar para a página inicial
      </Link>
    </div>
  );
}
