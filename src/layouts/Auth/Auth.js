import React from "react";
import {
  Route,
  Switch,
  Redirect,
  useLocation,
  useHistory
} from "react-router-dom";

// core components
import AuthNavbar from "components/Navbars/AuthNavbar";

import routes from "routes.js";

import { BackgroundColorContext } from "contexts/BackgroundColorContext";

function Auth(props) {
  const location = useLocation();
  const mainPanelRef = React.useRef(null);
  const history = useHistory();
  const isLogin = location.pathname === "/auth/login";
  const usesDesignSystem = isLogin || location.pathname === "/auth/register";

  React.useEffect(() => {
    if (localStorage.getItem("apiToken") != null) {
      history.push("/admin/dashboard");
    }
  }, [history]);

  const getRoutes = routes => {
    return routes.map((prop, key) => {
      if (prop.layout === "/auth") {
        return (
          <Route
            path={prop.layout + prop.path}
            component={prop.component}
            key={key}
          />
        );
      } else {
        return null;
      }
    });
  };
  const getBrandText = path => {
    if (path === "/auth/register") return "Cadastro";
    for (let i = 0; i < routes.length; i++) {
      if (location.pathname.indexOf(routes[i].layout + routes[i].path) !== -1) {
        return routes[i].name;
      }
    }
    return "Paga Bandida";
  };
  return (
    <BackgroundColorContext.Consumer>
      {({ color, changeColor }) => (
        <React.Fragment>
          <div className={`wrapper${usesDesignSystem ? " auth-design fx" : ""}`}>
            <div className="main-panel auth-main-panel" ref={mainPanelRef} data={color}>
              <AuthNavbar brandText={getBrandText(location.pathname)} designSystem={usesDesignSystem} />
              <Switch>
                {getRoutes(routes)}
                <Redirect from="*" to="/auth/login" />
              </Switch>
            </div>
          </div>
        </React.Fragment>
      )}
    </BackgroundColorContext.Consumer>
  );
}

export default Auth;
