import { useState, useEffect } from "react";
import axios from "axios";

import { Enviroments } from "../enviroments/enviroments";

const useFetchTransactions = (page, source = null, per_page = 1000) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!page) {
      setError("O parâmetro 'page' é obrigatório.");
      return;
    }

    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const apiUrl = `${Enviroments.API_URL_BR4BET}api/transactions`;
        const token = localStorage.getItem("apiToken") || "nao ha token";
        const response = await axios.get(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          params: {
            page,
            per_page,
            ...(source ? { source } : {}) // Adiciona 'source' somente se estiver definido
          }
        });

        setData(response.data);
        setError(null);
        localStorage.setItem("userId", response.data.id);
      } catch (err) {
        setError(err.response ? err.response.data : err.message);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [page, source]);

  return { data, error, loading };
};

export default useFetchTransactions;
