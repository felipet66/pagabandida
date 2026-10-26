/*!

=========================================================
* Black Dashboard React v1.2.1
=========================================================

* Product Page: https://www.creative-tim.com/product/black-dashboard-react
* Copyright 2022 Creative Tim (https://www.creative-tim.com)
* Licensed under MIT (https://github.com/creativetimofficial/black-dashboard-react/blob/master/LICENSE.md)

* Coded by Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/
import React from "react";
// connect requests with axios
import axios from "axios";

import Switch from "react-switch";
import { Puff } from "react-loader-spinner";
import NotificationAlert from "react-notification-alert";

// reactstrap components
import { Card, CardHeader, CardBody, CardTitle, Row, Col } from "reactstrap";
import {
  QueryClient,
  QueryClientProvider,
  useQuery
} from "@tanstack/react-query";

// core components
import { Enviroments } from "../../enviroments/enviroments";
import aviatorLogo from "assets/img/aviator.png";
import pauseIcon from "assets/img/pause-icon.png";

import moment from "moment";

function EntryCheck(props) {
  const dateNow = moment(new Date()).format("YYYY-MM-DD");

  const [entryCheck, setEntryCheck] = React.useState({
    entry: null,
    odd: "teste"
  });

  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [signalActive, setSignalActive] = React.useState(false);

  const UseEntryCheckElement = () => {
    const headers = {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("apiToken")}`
      }
    };

    const { isLoading, error, data } = useQuery({
      queryKey: ["entry"],
      queryFn: () =>
        fetch(`${Enviroments.API_URL}entry/check`, headers).then(res =>
          res.json()
        )
    });

    if (isLoading) {
      return <h1>Carregando</h1>;
    }

    return (
      <Row>
        {data?.entry !== null ? (
          <Col xs="12" sm="12" md="12" lg="12">
            <Card className="card-chart">
              <p>ENTRADA CONFIRMADA!</p>
              <p>Entrar após: {data?.entry?.odd_before_entry}</p>
              <p>Voar até {data?.entry?.odd_target}</p>
            </Card>

            {data?.entry.entry_status === "GREEN" && (
              <video
                width="256"
                height="256"
                preload="none"
                style={{
                  borderRadius: "50%",
                  width: 100,
                  background:
                    "transparent url('https://cdn-icons-png.flaticon.com/512/7920/7920939.png') 50% 50% / fit no-repeat;"
                }}
                autoplay="autoplay"
                loop="true"
                muted="muted"
                playsinline=""
              >
                <source
                  src="https://cdn-icons-mp4.flaticon.com/512/7920/7920939.mp4"
                  type="video/mp4"
                ></source>
              </video>
            )}
          </Col>
        ) : (
          <Col xs="12" sm="12" md="12" lg="12">
            <Card className="card-chart">Aguardando Sinal</Card>
          </Col>
        )}
      </Row>
    );
  };

  const notificationAlertRef = React.useRef(null);
  const notify = (place, color, message) => {
    var options = {};
    options = {
      place: place,
      message: (
        <div>
          <div>
            <b>{message}</b>
          </div>
        </div>
      ),
      type: color,
      icon: "tim-icons icon-bell-55",
      autoDismiss: 8
    };
    notificationAlertRef.current.notificationAlert(options);
  };

  return (
    <>
      <div className="history-odd">
        <div className="react-notification-alert-container">
          <NotificationAlert ref={notificationAlertRef} />
        </div>
        {historyLoading ? (
          <div className="d-flex justify-content-center align-items-center w-100">
            <div className="lds-spinner">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
          </div>
        ) : (
          <>{UseEntryCheckElement()}</>
        )}
      </div>
    </>
  );
}

export default EntryCheck;
