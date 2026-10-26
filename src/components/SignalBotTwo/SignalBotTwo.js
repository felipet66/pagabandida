import React, { useEffect, useState } from 'react';
import axios from 'axios';
import moment from 'moment';

import { Card, CardHeader, CardBody, CardTitle, Row, Col, Button, Label } from 'reactstrap';

const SignalBotTwo = ({props}) => {
  const [latestUpdate, setLatestUpdate] = useState(null);
  const signalsUrl = process.env.REACT_APP_SIGNALS_URL;

  useEffect(() => {
    if (!signalsUrl) return;
    const interval = setInterval(() => {
      axios
        .get(signalsUrl)
        .then((response) => {
          const updates = response.data.result;
          if (updates.length > 0) {
            const latestUpdate = updates[updates.length - 1];

            if(latestUpdate?.channel_post?.text?.search("CANCELADA") === -1) {
              setLatestUpdate("Aguardando sinal...");
            }

            if (latestUpdate?.channel_post?.text?.search("✅") === -1) {
              const splitMessage = latestUpdate?.channel_post?.text.split('#');
              const splitMessageFinal = splitMessage[1]?.split("#");
              const message = `Entrar após: ${splitMessageFinal[0]}`;
              
              setLatestUpdate(message);
            } 
            
            if (latestUpdate?.channel_post?.text?.search("✅") !== -1) {
              const splitMessage = latestUpdate?.channel_post?.text.split('🔵');
              
              const message = `WINN ${splitMessage[1]} ✅✅✅`;
              
              setLatestUpdate(message);
            }
          }
        })
        .catch((error) => {
          console.error("Não foi possível concluir a operação.");
        });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [signalsUrl]);

  return (
    <Row>
    <Col xs="12">
      <Card className="card-chart">
        <CardHeader>
          <Row>
            <Col className="text-left" sm="12">
              <h5 className="card-category">
                I.A. De sinais para Aviator 2X - {props.betHouse}
              </h5>
              <CardTitle tag="h3">
                I.A. Dashboard 2X <span style={{fontSize: 10, border: '1px solid', borderRadius: 4, padding: 4, opacity: '0.8'}}>EM BREVE</span>
              </CardTitle>
              <div className='d-none'>
              {latestUpdate && (
                <div>
                  <p>
                    {latestUpdate}
                  </p>
                  <p>Buscar 1.5 e 2X.</p>
                </div>
              )}
              </div>
            </Col>
          </Row>
        </CardHeader>
        <CardBody>
        </CardBody>
      </Card>
    </Col>
  </Row>
  );
};

export default SignalBotTwo;
