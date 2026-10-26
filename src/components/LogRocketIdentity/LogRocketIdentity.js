import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import LogRocket from "logrocket";
import { APP_ID } from "config/app";

const getSessionValue = key => {
  const value = localStorage.getItem(key);
  return value && !["undefined", "null"].includes(value) ? value : null;
};

export default function LogRocketIdentity() {
  const { pathname } = useLocation();
  const lastIdentity = useRef(null);

  useEffect(() => {
    const id = getSessionValue("user_id");
    if (!process.env.REACT_APP_LOGROCKET_APP_ID || !id || !getSessionValue("access_token")) {
      lastIdentity.current = null;
      return;
    }

    const traits = { app: APP_ID };
    const name = getSessionValue("user_name");
    const email = getSessionValue("user_email") || getSessionValue("email");
    if (name) traits.name = name;
    if (email) traits.email = email;

    const identity = JSON.stringify({ id, ...traits });
    if (lastIdentity.current === identity) return;

    LogRocket.identify(`${APP_ID}:${id}`, traits);
    lastIdentity.current = identity;
  }, [pathname]);

  return null;
}
