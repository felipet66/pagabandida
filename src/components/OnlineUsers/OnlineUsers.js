import React, { useState, useEffect } from "react";

const OnlineUsers = () => {
  const [usuariosOnline, setUsuariosOnline] = useState([]);

  useEffect(() => {
    // Função para atualizar a quantidade de pessoas online
    const atualizarUsuariosOnline = () => {
      const min = 15; // Número mínimo de pessoas online
      const max = 150; // Número máximo de pessoas online
      const numeroAleatorio = Math.floor(Math.random() * (max - min + 1)) + min;
      setUsuariosOnline(numeroAleatorio);
    };

    // Atualizar a cada 60 segundos
    const interval = setInterval(atualizarUsuariosOnline, 60000);

    // Atualizar ao carregar o componente pela primeira vez
    atualizarUsuariosOnline();

    // Limpar o intervalo ao desmontar o componente
    return () => clearInterval(interval);
  }, []);

  return (
    <h5>
        <i className="fas fa-users" style={{ color: "#34c759" }}></i>{" "}
        <strong>{usuariosOnline}</strong> pessoas online
    </h5>
  );
};

export default OnlineUsers;
