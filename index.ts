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
            res.send("Welcome to NTT DATA JAPAN Demo Back");
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