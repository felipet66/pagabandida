// src/services/bffApi.js
import axios from "axios";
import Swal from "sweetalert2";
import { Enviroments } from "../enviroments/enviroments";
import { waitForMaintenanceAcknowledgement } from "./automaticModalCoordinator";
import { clearAppSession } from "./appStorage";

const APP_KEY = process.env.REACT_APP_APP_KEY;
const BFF_URL = process.env.REACT_APP_BFF_URL;
const missingConfiguration = [
  !APP_KEY?.trim() && "REACT_APP_APP_KEY",
  !BFF_URL?.trim() && "REACT_APP_BFF_URL",
].filter(Boolean);
const configurationError = missingConfiguration.length
  ? `Configuração do BFF ausente: ${missingConfiguration.join(", ")}. Nenhuma chamada será enviada.`
  : null;
if (configurationError) console.error(configurationError);
let isUnauthorizedAlertOpen = false;

const bffApi = axios.create({
  baseURL: Enviroments.API_URL_BR4BET,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
    "X-App-Key": APP_KEY,
  },
});

// Interceptor de request — injeta token e cookie_key em toda chamada
bffApi.interceptors.request.use((config) => {
  if (configurationError) {
    const error = new Error(configurationError);
    error.code = "BFF_CONFIGURATION_MISSING";
    return Promise.reject(error);
  }
  if (config.publicRequest) return config;

  const token = localStorage.getItem("access_token");
  const cookieKey = localStorage.getItem("cookie_key");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (cookieKey) {
    config.headers["X-Cookie-Key"] = cookieKey;
  }

  return config;
});

// Interceptor de response — informa sessão expirada e redireciona pro login se 401
bffApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.publicRequest && !error.config?.handleUnauthorized) {
      clearAppSession();

      if (!isUnauthorizedAlertOpen) {
        isUnauthorizedAlertOpen = true;

        waitForMaintenanceAcknowledgement().then(() => {
          Swal.fire({
            title: "Sessão expirada",
            text: "Você deve realizar login novamente.",
            icon: "warning",
            confirmButtonText: "Ir para o login",
            allowOutsideClick: false,
            allowEscapeKey: false,
          }).then(() => {
            window.location.href = "/auth/login";
          });
        });
      }
    }
    return Promise.reject(error);
  }
);

export default bffApi;
