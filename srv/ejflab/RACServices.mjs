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

  static async getSchemas(req, res, next) {
    const model = {};
    const databaseResponse = await PostgresSrv.executeFile("srv/ejflab/sql/read/schemas.sql", model);
    const rows = databaseResponse.rows.map((row) => { return { name: row.table_schema } });
    res.status(200).send({
      'status': 'ok',
      schemas: rows
    });
  }

  static async getTableOfschemas(req, res, next) {
    const schema = General.readParam(req, "schema", null, true);
    const model = { schema };
    const databaseResponse = await PostgresSrv.executeFile("srv/ejflab/sql/read/tables_of_schema.sql", model);
    const rows = databaseResponse.rows.map((row) => { return { name: row.table_name } });
    res.status(200).send({
      'status': 'ok',
      tables: rows
    });
  }

  static async createTableOfschema(req, res, next) {
    const schema = General.readParam(req, "schema", null, true);
    const name = General.readParam(req, "name", null, true);
    const model = { schema, name };
    const databaseResponse = await PostgresSrv.executeFile("srv/ejflab/sql/create/rac_table.sql", model);
    res.status(200).send({
      'status': 'ok',
    });
  }

  static async destroyTableOfschema(req, res, next) {
    const schema = General.readParam(req, "schema", null, true);
    const name = General.readParam(req, "name", null, true);
    const model = { schema, name };
    const databaseResponse = await PostgresSrv.executeFile("srv/ejflab/sql/delete/rac_table.sql", model);
    res.status(200).send({
      'status': 'ok',
    });
  }
}
