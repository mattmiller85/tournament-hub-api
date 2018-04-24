import { NextFunction, Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import config from "../config";


const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers["Authorization"] as string;
  if (!token) {
    return res.status(403).send({ auth: false, message: "No token provided." });
  }
  jwt.verify(token, config.jwtSecret, (err, decoded: { id: string }) => {
    if (err) {
        return res.status(500).send({ auth: false, message: "Failed to authenticate token." });
    }
    // if everything good, save to request for use in other routes
    req.params.userId = decoded.id;
    next();
  });
}
export default verifyToken;
