import * as bodyParser from "body-parser";
import express from "express";
import dotenv from 'dotenv';
import cors from 'cors';
import logger from "./logger";

import Routes from "./routes";

import fs = require('fs');

dotenv.config();
const port = process.env.PORT;

class App {

    public express: express.Application;

    constructor() {
        this.express = express();
        this.middleware();
        this.routes();
        this.createPublicFolder();
    }

    private middleware(): void {
        this.express.use(cors());
        this.express.use(bodyParser.json());
        this.express.use(bodyParser.urlencoded({ extended: false }));
    }

    private routes(): void {

        this.express.get("/", (req, res, next) => {
            res.send("Welcome to NTT DATA OSS KayTrust Demo Back");
        });

        this.express.get("/did:ev:bmM8ehBACi4MQ1BeyMRg941cz7RNvNGe3SNkk/.well-known/openid-credential-issuer", (req, res, next) => {
            res.send(`{
                "authorization_server": "https://api-conformance.ebsi.eu/conformance/v3/auth-mock",
                "credential_issuer": "https://api-conformance.ebsi.eu/conformance/v3/issuer-mock",
                "credential_endpoint": "https://api-conformance.ebsi.eu/conformance/v3/issuer-mock/credential",
                "deferred_credential_endpoint": "https://api-conformance.ebsi.eu/conformance/v3/issuer-mock/deferred_credential",
                "credentials_supported": [
                  {
                    "format": "jwt_vc",
                    "types": [
                      "VerifiableCredential",
                      "VerifiableAttestation",
                      "VerifiableAuthorisationToOnboard"
                    ],
                    "trust_framework": {
                      "name": "ebsi",
                      "type": "Accreditation",
                      "uri": "TIR link towards accreditation"
                    },
                    "display": [
                      {
                        "name": "Verifiable Authorisation to onboard",
                        "locale": "en-GB"
                      }
                    ]
                  },
                  {
                    "format": "jwt_vc",
                    "types": [
                      "VerifiableCredential",
                      "VerifiableAttestation",
                      "VerifiableAccreditation",
                      "VerifiableAccreditationToAttest"
                    ],
                    "trust_framework": {
                      "name": "ebsi",
                      "type": "Accreditation",
                      "accreditation_uri": "TIR link towards accreditation"
                    },
                    "display": [
                      {
                        "name": "Verifiable Accreditation to attest",
                        "locale": "en-GB"
                      }
                    ]
                  }
                ]
              }`);
        });


        this.express.use("/api", Routes);

        this.express.listen(port, () => {
          logger.info(`Server is running at https://localhost:${port}`);
        });
    }

    private createPublicFolder(): void {
        try {
            process.env.NODE_PATH = __dirname;
            if (fs.existsSync(__dirname + '/public')) return;
            fs.mkdirSync(__dirname + '/public');
        } catch (err) {
            logger.error(err);
        }
    }
}

export default new App().express;