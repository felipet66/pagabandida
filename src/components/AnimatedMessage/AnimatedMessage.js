import React, { useState, useEffect } from "react";

const AnimatedMessage = () => {
  const [mensagens, setMensagens] = useState([]);

  useEffect(() => {
    const timers = [];

    const atualizarMensagem = () => {
      const novaMensagem = gerarMensagem();
      setMensagens((prev) => [...prev, novaMensagem]);

      const timer = setTimeout(() => {
        setMensagens((prev) => prev.slice(1));
      }, 7000);
      timers.push(timer);
    };

    atualizarMensagem();
    const interval = setInterval(atualizarMensagem, 20000);

    return () => {
      clearInterval(interval);
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const gerarMensagem = () => {
    const nomes = [
        "João Augusto",
        "Maria Clara",
        "Lucas Silva",
        "Fernanda Costa",
        "Rafael Pereira",
        "Ana Luiza",
        "Carlos Eduardo",
        "Beatriz Almeida",
        "Rodrigo Santos",
        "Juliana Oliveira",
        "Pedro Henrique",
        "Gabriela Martins",
        "Ricardo Alves",
        "Sofia Lima",
        "Vinícius Carvalho",
        "Larissa Monteiro",
        "André Batista",
        "Camila Ferreira",
        "Renato Almeida",
        "Patrícia Duarte",
        "Daniel Rocha",
        "Bianca Cardoso",
        "Eduardo Fonseca",
        "Isabela Ramos",
        "Felipe Mendes",
        "Aline Souza",
        "Thiago Oliveira",
        "Mariana Ribeiro",
        "César Tavares",
        "Luana Castro",
        "Gustavo Nunes",
        "Carla Machado",
        "Leonardo Barros",
        "Letícia Moreira",
        "Paulo Vieira",
        "Vanessa Correia",
        "Roberto Farias",
        "Tatiane Pires",
        "Diego Antunes",
      ];
    const nome = nomes[Math.floor(Math.random() * nomes.length)];
    const lucro = (Math.random() * 100 + 10).toFixed(2);

    return {
      nome,
      lucro: Number(lucro).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
    };
  };

  return (
    <div className="animated-message-feed" aria-live="polite">
      <div className="animated-message-feed__signal">
        <span />
      </div>

      <div className="animated-message-feed__list">
        {mensagens.map((mensagem, index) => (
          <div key={`${mensagem.nome}-${mensagem.lucro}-${index}`} className="animated-message">
            <div className="animated-message__icon">
              <i className="fas fa-bolt" aria-hidden="true" />
            </div>
            <div className="animated-message__content">
              <span>{mensagem.nome}</span>
              <strong>lucrou {mensagem.lucro}</strong>
            </div>
            <small>agora</small>
          </div>
        ))}
      </div>

      <div className="animated-message-feed__caption">
        <span>Entradas validadas em tempo real</span>
        <i className="fas fa-circle" aria-hidden="true" />
      </div>
    </div>
  );
};

export default AnimatedMessage;
