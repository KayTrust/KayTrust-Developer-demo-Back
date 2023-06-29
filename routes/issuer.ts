import express from "express";
import logger from "../logger";
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { Issuer } from "openid-client";
import axios from "axios";
import { v4 as uuidv4 } from 'uuid';
import { io, Socket } from 'socket.io-client';
import CustomCredential from "../templates/custom-credential";
import EventsCredential from "../templates/events-credential";
import MedicalCredential from "../templates/medical-credential";
import StatementCredential from "../templates/statement-credential";
import HtmlCredentialCreatedSuccessful from "../templates/html/credential-created-successful";
import HtmlCredentialCreatedSuccessfulProvider from "../templates/html/credential-created-successful-provider";
import DIDReceivedNext from "../templates/html/DID-received-next";
import DIDReceivedNextProvider from "../templates/html/DID-received-next-provider";
import VCReceivedAsk from "../templates/html/VC-received-ask";
import { Credential, Verifier, ProofTypeEthereum, EthCore } from '@kaytrust/verifiable-credentials';
import { verifyData } from "../utils/credentials";

import fs = require('fs');

dotenv.config();

class IssuerClass {

    public express: express.Application;
    public socket: Socket;

    constructor() {
        this.express = express();
        this.socket = io(process.env.WS_SERVER as string);
        this.routes();
    }

    private routes(): void {

        this.express.get("/provider-step1", async (req, res, next) => {
            let html = '';
            const { query } = req;
            if (!query.access_token) { res.status(401).send('<h1>access_token not satisfied</h1>'); return; }
            const decodedJWT: any = jwt.decode(query.access_token as string);
            const sub = decodedJWT?.sub;

            logger.info(`Lo que llega del decodedJWT: ${JSON.stringify(decodedJWT)} `);

            this.socket.emit('shared-identity-provider', { content: sub, to: query.state });
            html = DIDReceivedNextProvider.replace('{subject_did}', sub);
            res.status(200).send(html);
        });

        this.express.get("/provider-step2", async (req, res, next) => {
            res.set('Access-Control-Allow-Origin', '*');
            logger.info(`El req claims: ${req.query.claims} `);
            logger.info(`El req sub: ${req.query.sub} `);

            const subjectDID = req.query.sub as string;
            const claims = req.query.claims;
            const type = req.query.type as string
            const typeArray = type.split(",");
            console.log("typeArray: " + typeArray[1]);
            const socket_id = req.query.state;
            console.log("typeArray typeof: " + typeof(typeArray));

            const ktProviderIssuer = await Issuer.discover(
                "https://auth.kaytrust.id/auth/realms/demo-innovation-labs"
            );
            const params = new URLSearchParams();
            params.append("grant_type", "client_credentials");
            params.append("username", "");
            params.append("password", "");
            params.append("client_id", "alobestia");
            params.append("client_secret", "xFKVWjyCDi4BxEBnlPRTxs7FpinuK8Mu");
            const response = await axios.post(
            ktProviderIssuer.metadata.token_endpoint as string,
            params
            );
            const access_token = response.data.access_token;
            console.log(access_token);
            const userId = '691fe734-a652-462e-b02c-d13ca765fc97'
            const issuerDID = 'did:ev:bmM8eDSu4aHCUNu54nHHeqPY191qWrbiCub3H'; //DID managed and custody for KT Provider Enterprise grade security
            const handle = uuidv4();
            const issuanceDate = new Date().toISOString();
            const claimObj = JSON.parse(claims as string);
            const vc = {
                credentials: [{
                    "credentialSubject": {
                      "@id": subjectDID,
                      ...claimObj,
                    },
                    "issuanceDate":issuanceDate,
                    "issuer":issuerDID,
                    "typeCredential": typeArray,
                  }]
            };

            const msCredentials = 'http://credential.provider-back.kaytrust.id/ms-credential/credential';
            const resultCredentials: any = await axios.post(msCredentials, vc, {
                headers: {
                    'Authorization': 'Bearer ' + access_token,
                    'Access-Control-Allow-Origin': '*',
                    'user-id': userId,
                    'Content-Type': 'application/json'
                }
            }).catch((error) => {
                console.log(error)
            });
            const credential = JSON.parse(resultCredentials.data.credentials[0].credential);
            console.log(credential); // return;
            const vp = {
                '@context': 'https://w3.org/2018/credentials/v1',
                '@id': uuidv4(),
                '@type': 'VerifiablePresentation',
                '@holder': issuerDID,
                verifiableCredential: [credential]
            }
            const resultHub = await axios.post('https://provider-back.kaytrust.id/ms-hub/presentation/' + subjectDID + '/' + handle, vp, {
                headers: {
                    'Authorization': 'Bearer ' + access_token
                }
            }).catch((err) => {
                console.log(err)
            });
            console.log(resultHub);
            
            const fileName = uuidv4();
            try {
                fs.writeFileSync(process.env.NODE_PATH + `/public/${fileName}.json`, JSON.stringify(vp), 'utf8');
                logger.info(`Create credential: ${vp} - ${fileName}`);
            } catch (err) { 
                res.status(400).send('<h1>can`t created credential</h1>'); 
                return; 
            }
            this.socket.emit('shared-identity-provider-2', { content: fileName, to: socket_id });
            const html = HtmlCredentialCreatedSuccessfulProvider.replace('{filename}', fileName);
            res.status(200).send(html);
        });

        this.express.get("/ask-for-share", async (req, res, next) => {
            //const issuerDIDOrg = 'did:ev:bmM8LdvHoEzGqoNbdgUe5bGMJnj2yNmjNF2nK'; //DID managed for KT Provider
            /** nodeRPC access for a blockchain network to use */
            const nodeRPC = "https://polygon-mumbai.g.alchemy.com/v2/jLMUummm16stzMQjW1OB79IwuDjsJqS7";
            /** chainID of the blockchain networtk to deploy this test */
            const chainId = 80001;
            // const headers = [{ name: 'Authorization', value: `Bearer ${rpcToken}` }];
            const headers = undefined;

            const ethCore = new EthCore(nodeRPC, process.env.PRIVATE_KEY, headers, 
                {
                    chainId: chainId,
                    gasPrice: "95000000000",
                });
            const proofTypeEthereum = new ProofTypeEthereum(ethCore, {
                identityManager: process.env.IDENTITY_MANAGER as string,
                verificationRegistry: process.env.VERIFICATION_REGISTRY as string,
                validDays: 0,
              });
            const verifiers = new Verifier(proofTypeEthereum);

            let html = '';
            const { query } = req;
            if (!query.access_token) { res.status(401).send('<h1>access_token not satisfied</h1>'); return; }
            const decodedJWT: any = jwt.decode(query.access_token as string);
            const subject_did = decodedJWT?.sub;

            logger.info(`Lo que llega en access_token: ${query.access_token} `);
            logger.info(`Lo que llega del decodedJWT: ${JSON.stringify(decodedJWT)} `);

            const credentialObj = new Credential(decodedJWT.presentation.verifiableCredential[0]);

            (credentialObj.verifyProof(verifiers)).then((ok)=>{
                if(ok){
                    const name = decodedJWT.presentation.verifiableCredential[0].credentialSubject.name;
                    this.socket.emit('shared-identity-ask', { content: name, to: query.state });
                    html = VCReceivedAsk.replace('{name}', name);
                    html = html.replace('{subject_did}', subject_did);
                    res.status(200).send(html);
                } else {
                    this.socket.emit('shared-identity-ask', { content: 'You are a impostor', to: query.state });
                    res.status(200).send('You are a impostor');
                }
              },(error)=>{
                new Error(error);
                res.status(451).send('You are a impostor');
              });

        });

        this.express.get("/custom-step1", async (req, res, next) => {
            let html = '';
            const { query } = req;
            if (!query.access_token) { res.status(401).send('<h1>access_token not satisfied</h1>'); return; }
            const decodedJWT: any = jwt.decode(query.access_token as string);
            const sub = decodedJWT?.sub;

            logger.info(`Lo que llega del decodedJWT: ${JSON.stringify(decodedJWT)} `);

            this.socket.emit('shared-identity-custom', { content: sub, to: query.state });
            html = DIDReceivedNext.replace('{subject_did}', sub);
            res.status(200).send(html);
        });

        this.express.get("/custom-step2", async (req, res, next) => {

            logger.info(`El req claims: ${req.query.claims} `);
            logger.info(`El req sub: ${req.query.sub} `);

            const sub = req.query.sub as string;
            const claims = req.query.claims;
            const socket_id = req.query.state;
            console.log(typeof(claims));

            let html = '';
            const { query } = req;
            //const claims = {llave: 'Valor de la llave 1', llave2: 'Valor de la llave 2'};
            const credentialTemplate = new CustomCredential(sub, JSON.parse(claims as string));
            const newCredential = await Credential.createFromClaims(credentialTemplate);
            const verifyDataResult = await verifyData(newCredential.verifiableObject);
            if (!verifyDataResult.state) { res.status(400).send('<h1>can`t created credential</h1>'); return; }
            const newCredentialWithProof = verifyDataResult.verifiableObjectWithProof;
            const fileName = uuidv4();
            try {
                fs.writeFileSync(process.env.NODE_PATH + `/public/${fileName}.json`, newCredentialWithProof, 'utf8');
                logger.info(`Create credential: ${newCredentialWithProof} - ${fileName}`);
            } catch (err) { 
                res.status(400).send('<h1>can`t created credential</h1>'); 
                return; 
            }
            this.socket.emit('shared-identity-custom-2', { content: fileName, to: socket_id });
            html = HtmlCredentialCreatedSuccessful.replace('{filename}', fileName);
            res.status(200).send(html);
        });

        this.express.get("/event", async (req, res, next) => {
            const { query } = req;
            if (!query.access_token) { res.status(401).send('<h1>access_token not satisfied</h1>'); return; }
            const decodedJWT: any = jwt.decode(query.access_token as string);
            const sub = decodedJWT?.sub;
            const credentialTemplate = new EventsCredential(sub);
            const newCredential = await Credential.createFromClaims(credentialTemplate);
            const verifyDataResult = await verifyData(newCredential.verifiableObject);
            if (!verifyDataResult.state) { res.status(400).send('<h1>can`t created credential</h1>'); return; }
            const newCredentialWithProof = verifyDataResult.verifiableObjectWithProof;
            const fileName = uuidv4();
            try {
                fs.writeFileSync(process.env.NODE_PATH + `/public/${fileName}.json`, newCredentialWithProof, 'utf8');
                logger.info(`Create credential: ${newCredentialWithProof} - ${fileName}`);
            } catch (err) { 
                res.status(400).send('<h1>can`t created credential</h1>'); 
                return; 
            }
            this.socket.emit('shared-identity', { content: fileName, to: query.state });
            const html = HtmlCredentialCreatedSuccessful.replace('{filename}', fileName);
            res.status(200).send(html);
        });

        this.express.get("/medical", async (req, res, next) => {
            let html = '';
            // let allClaims: any = {};
            const { query } = req;
            if (!query.access_token) { res.status(401).send('<h1>access_token not satisfied</h1>'); return; }
            const decodedJWT: any = jwt.decode(query.access_token as string);
            const sub = decodedJWT?.sub;

            logger.info(`Lo que llega del decodedJWT: ${JSON.stringify(decodedJWT)} `);

            // const verifiableCredentials = decodedJWT.presentation.verifiableCredential;
            // for (const credential of verifiableCredentials) {
            //     for (const claim in credential.credentialSubject) {
            //         if (claim === '@id' || claim === '@type') continue;
            //         allClaims[claim] = credential.credentialSubject[claim];
            //     }
            // }

            const name = decodedJWT.presentation.verifiableCredential[0].credentialSubject.name;
            const credentialTemplate = new MedicalCredential(sub, name);
            const newCredential = await Credential.createFromClaims(credentialTemplate);
            const verifyDataResult = await verifyData(newCredential.verifiableObject);
            if (!verifyDataResult.state) { res.status(400).send('<h1>can`t created credential</h1>'); return; }
            const newCredentialWithProof = verifyDataResult.verifiableObjectWithProof;
            const fileName = uuidv4();
            try {
                fs.writeFileSync(process.env.NODE_PATH + `/public/${fileName}.json`, newCredentialWithProof, 'utf8');
                logger.info(`Create credential: ${newCredentialWithProof} - ${fileName}`);
            } catch (err) { 
                res.status(400).send('<h1>can`t created credential</h1>'); 
                return; 
            }
            this.socket.emit('shared-identity', { content: fileName, to: query.state });
            html = HtmlCredentialCreatedSuccessful.replace('{filename}', fileName);
            res.status(200).send(html);
        });

        this.express.get("/statement", async (req, res, next) => {
            let html = '';
            const { query } = req;
            if (!query.access_token) { res.status(401).send('<h1>access_token not satisfied</h1>'); return; }
            const decodedJWT: any = jwt.decode(query.access_token as string);
            const sub = decodedJWT?.sub;

            logger.info(`Lo que llega del decodedJWT: ${JSON.stringify(decodedJWT)} `);

            const statement = 'La empresa con el DID del subjectc indicado autoriza a esta identidad a acceder a nuestras instalaciones sin ningún problema';
            const credentialTemplate = new StatementCredential(sub, statement);
            const newCredential = await Credential.createFromClaims(credentialTemplate);
            const verifyDataResult = await verifyData(newCredential.verifiableObject);
            if (!verifyDataResult.state) { res.status(400).send('<h1>can`t created credential</h1>'); return; }
            const newCredentialWithProof = verifyDataResult.verifiableObjectWithProof;
            const fileName = uuidv4();
            try {
                fs.writeFileSync(process.env.NODE_PATH + `/public/${fileName}.json`, newCredentialWithProof, 'utf8');
                logger.info(`Create credential: ${newCredentialWithProof} - ${fileName}`);
            } catch (err) { 
                res.status(400).send('<h1>can`t created credential</h1>'); 
                return; 
            }
            this.socket.emit('shared-identity', { content: fileName, to: query.state });
            html = HtmlCredentialCreatedSuccessful.replace('{filename}', fileName);
            res.status(200).send(html);
        });

        this.express.get("/download-credential", async (req, res, next) => {
            const { query } = req;
            if (!query.fileName) { res.status(401).send('<h1>fileName not satisfied</h1>'); return; }
            this.socket.emit('vc-downloaded', { content: 'hola', to: query.state });
            const file = `${process.env.NODE_PATH}/public/${query.fileName}.json`;
            res.setHeader('Content-type', 'application/vp+json');
            res.download(file, `${query.fileName}.vp`);
        });
    }
}

export default new IssuerClass().express;