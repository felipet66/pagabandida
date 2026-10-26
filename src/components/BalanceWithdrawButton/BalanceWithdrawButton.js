import React, { useState } from "react";
import { Eye, EyeOff, Plus } from "lucide-react";
import Icon from "components/DesignSystem/Icon";
import { Link } from "react-router-dom";

const BalanceWithdrawButton = ({ balance, loading = false, currency = "BRL", error }) => {
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const validBalance = typeof balance === "number" && Number.isFinite(balance);
  const displayBalance = loading && !validBalance ? "Carregando..." : validBalance
    ? balance.toLocaleString("pt-BR", { style: "currency", currency }) : "Indisponível";

  return (
    <div className="admin-wallet">
      <div className="admin-wallet__balance">
        <div className="admin-wallet__value" title={error || undefined}>
          <span className="admin-wallet__label">Saldo disponível</span>
          <span className="admin-wallet__amount">{isBalanceVisible ? displayBalance : "R$ •••••"}</span>
        </div>
        <Link className="admin-wallet__deposit" to="/admin/deposit" aria-label="Depositar" title="Depositar"><Icon as={Plus} size={20} /></Link>
        <button className="admin-wallet__icon" type="button" aria-label={isBalanceVisible ? "Ocultar saldo" : "Exibir saldo"}
          aria-pressed={!isBalanceVisible} onClick={() => setIsBalanceVisible(visible => !visible)}>
          {isBalanceVisible ? <Icon as={EyeOff} size={20} /> : <Icon as={Eye} size={20} />}
        </button>
      </div>
    </div>
  );
};

export default BalanceWithdrawButton;
