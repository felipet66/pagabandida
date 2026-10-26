import React, { useEffect, useState } from "react";
import { Users } from "lucide-react";
import Icon from "components/DesignSystem/Icon";
import "./OnlineUsersBadge.css";

// Temporary presence data; replace this source with the online-users API later.
const randomOnlineCount = () => 30 + Math.floor(Math.random() * 21);

export default function OnlineUsersBadge() {
  const [count, setCount] = useState(randomOnlineCount);
  useEffect(() => {
    const timer = setInterval(() => setCount(randomOnlineCount()), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="online-users-badge" aria-label={`${count} pessoas online · contagem simulada`} title="Contagem simulada entre 30 e 50 pessoas; integração com a API em breve.">
      <span aria-hidden="true" /><Icon as={Users} size={13} /><strong>{count}</strong> online
    </span>
  );
}
