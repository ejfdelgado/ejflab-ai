"use strict";
import { General } from "@ejfdelgado/ejflab-back/srv/common/General.mjs";
import { ParametrosIncompletosException } from "@ejfdelgado/ejflab-back/srv/MyError.mjs";
import { uuidv7 } from "uuidv7";
import { PostgresSrv } from "@ejfdelgado/ejflab-back/srv/PostgresSrv.mjs";

export class RACServices {
  static async index(req, res, next) {
    res.status(200).send({});
  }
}
