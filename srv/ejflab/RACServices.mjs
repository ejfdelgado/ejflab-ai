"use strict";
import { General } from "@ejfdelgado/ejflab-back/srv/common/General.mjs";
import { ParametrosIncompletosException, MalaPeticionException } from "@ejfdelgado/ejflab-back/srv/MyError.mjs";
import { uuidv7 } from "uuidv7";
import { PostgresSrv } from "@ejfdelgado/ejflab-back/srv/PostgresSrv.mjs";

export class RACServices {
  static async index(req, res, next) {
    res.status(200).send({});
  }

  static async page(req, res, next) {
    const {
      orderColumn,
      direction,
      limit,
      offset
    } = General.getPaginationArguments(req, "created");
    const model = {
      orderColumn,
      direction,
      limit,
      offset
    };
    const databaseResponse = await PostgresSrv.executeFile("srv/ejflab/sql/read/knowledge_page.sql", model);
    const rows = databaseResponse.rows;
    res.status(200).send(rows);
  }
}
