import { useState, useEffect } from "react";
import bffApi from "../services/bffApi";

const useFetchUserMe = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchUserMe = async () => {
    setLoading(true);
    try {
      const response = await bffApi.get("api/auth/user-profile");

      const userData = response.data.data;
      setData(userData);
      localStorage.setItem("id", userData.id);
      localStorage.setItem("cpf", userData.document?.number || "");
      setError(null);
    } catch (err) {
      setError(err.response ? err.response.data : err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserMe();
  }, []);

  return { data, error, loading, refetch: fetchUserMe };
};

export default useFetchUserMe;
