import * as bodyParser from "body-parser";
import * as express from "express";
import * as jwt from "jsonwebtoken";

import User from "./models/User";

const router = express.Router();

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());
