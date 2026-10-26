import { clearAppSession } from "services/appStorage";
import React from "react";
import { useHistory, Link } from "react-router-dom";
import { Menu, UserRound } from "lucide-react";
import Icon from "components/DesignSystem/Icon";
import AccountDrawer from "../AccountDrawer/AccountDrawer";
import BalanceWithdrawButton from "../BalanceWithdrawButton/BalanceWithdrawButton";
import useWalletBalances from "../../hooks/useWalletBalances";
import logo from "assets/brand/pagabandida-emblema-verde-512.webp";
import "./AdminNavbar.css";

function AdminNavbar({ brandText, toggleSidebar, sidebarOpened, accountOpen, onOpenAccount, onCloseAccount }) {
  const history = useHistory();
  const { balance, wallet, currency, loading, error, refetch } = useWalletBalances();

  const logout = () => {
    clearAppSession();
    history.push("/auth/login");
  };

  return (
    <nav className="admin-topbar" aria-label="Navegação da conta">
      <div className="admin-topbar__brand">
        <button type="button" className="admin-topbar__menu" onClick={toggleSidebar} aria-label="Abrir ou fechar menu lateral" aria-expanded={sidebarOpened}>
          <Icon as={Menu} size={20} />
        </button>
        <Link to="/admin/jogos" aria-label="Paga Bandida — jogos"><img src={logo} alt="Paga Bandida" /></Link>
        <span className="admin-topbar__title">{brandText}</span>
      </div>
      <div className="admin-topbar__wallet">
        <BalanceWithdrawButton balance={balance} currency={currency} loading={loading} error={error} />
        <button type="button" className="admin-topbar__desktop-account" onClick={onOpenAccount}
          aria-label="Abrir menu da conta" aria-haspopup="dialog" aria-expanded={accountOpen} title="Minha conta">
          <Icon as={UserRound} size={20} />
        </button>
      </div>
      {accountOpen && <AccountDrawer balance={balance} wallet={wallet} currency={currency} loading={loading} error={error}
        onRefresh={refetch} onClose={onCloseAccount} onLogout={logout} />}
    </nav>
  );
}

export default AdminNavbar;
