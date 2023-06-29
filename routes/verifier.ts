import express from "express";
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import logger from "../logger";
import { io, Socket } from 'socket.io-client';

dotenv.config();

class Verifier {

    public express: express.Application;
    public socket: Socket;
    public accessHistory: Array<Array<string|number>>;

    constructor() {
        this.express = express();
        this.socket = io(process.env.WS_SERVER as string);
        this.accessHistory = [];
        this.routes();
    }

    private routes(): void {

        this.express.get("/share", async (req, res, next) => {
            const { query } = req;
            if (!query.access_token) { res.status(401).send('access_token not satisfied'); return; }
            if (this.accessHistory.length > 1000) this.accessHistory = [];
            const decodedJWT: any = jwt.decode(query.access_token as string);
            const credential = decodedJWT.presentation.verifiableCredential;
            if (decodedJWT?.sub !== credential[0].credentialSubject['@id']) {
                this.socket.emit('shared-credential', { content: null, to: query.state });
                res.status(401).send('<h1>Tu identidad no tiene acceso a este recurso.</h1>');
                return;
            }
            const accessName = credential[0].credentialSubject.name;
            this.accessHistory.push([accessName, (new Date()).toUTCString()]);
            this.socket.emit('shared-credential', { content: credential, to: query.state });
            this.socket.emit('access-history', { content: [accessName, (new Date()).toUTCString()], to: query.state });
            res.status(200).send('<h1>Gracias. Acabas de compartir tu credencial</h1>');
        });

        this.express.get("/access-history", async (req, res, next) => {
            res.status(200).json(this.accessHistory);
        });
    }
}

export default new Verifier().express;