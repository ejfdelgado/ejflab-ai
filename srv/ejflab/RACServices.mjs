"use strict";
import { General } from "@ejfdelgado/ejflab-back/srv/common/General.mjs";
import { PostgresSrv } from "@ejfdelgado/ejflab-back/srv/PostgresSrv.mjs";
import { ServicesClient } from '@google-cloud/run';
import { google } from 'googleapis';

export class RACServices {
  static async index(req, res, next) {
    res.status(200).send({});
  }

  static async page(req, res, next) {
    const schema = General.readParam(req, "schema", null, true);
    const table = General.readParam(req, "table", null, true);
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
      offset,
      schema,
      table
    };
    const databaseResponse = await PostgresSrv.executeFile("srv/ejflab/sql/read/knowledge_page.sql", model);
    const rows = databaseResponse.rows;
    res.status(200).send(rows);
  }

  static async getSchemas(req, res, next) {
    const model = {};
    const databaseResponse = await PostgresSrv.executeFile("srv/ejflab/sql/read/schemas.sql", model);
    const rows = databaseResponse.rows.map((row) => { return { name: row.nspname.replace(/^rac_/, "") } });
    res.status(200).send({
      'status': 'ok',
      schemas: rows
    });
  }

  static async createSchema(req, res, next) {
    const schema = General.readParam(req, "schema", null, true);
    const model = { schema };
    const databaseResponse = await PostgresSrv.executeFile("srv/ejflab/sql/create/rac_schema.sql", model);
    res.status(200).send({
      'status': 'ok',
    });
  }

  static async destroySchema(req, res, next) {
    const schema = General.readParam(req, "schema", null, true);
    const model = { schema };
    const databaseResponse = await PostgresSrv.executeFile("srv/ejflab/sql/delete/rac_schema.sql", model);
    res.status(200).send({
      'status': 'ok',
    });
  }

  static async getTableOfschemas(req, res, next) {
    const schema = General.readParam(req, "schema", null, true);
    const model = { schema };
    const databaseResponse = await PostgresSrv.executeFile("srv/ejflab/sql/read/tables_of_schema.sql", model);
    const rows = databaseResponse.rows.map((row) => { return { name: row.table_name.replace(/^rac_/, "") } });
    res.status(200).send({
      'status': 'ok',
      tables: rows
    });
  }

  static async createTableOfschema(req, res, next) {
    const schema = General.readParam(req, "schema", null, true);
    const name = General.readParam(req, "table", null, true);
    const model = { schema, name };
    const databaseResponse = await PostgresSrv.executeFile("srv/ejflab/sql/create/rac_table.sql", model);
    res.status(200).send({
      'status': 'ok',
    });
  }

  static async destroyTableOfschema(req, res, next) {
    const schema = General.readParam(req, "schema", null, true);
    const name = General.readParam(req, "table", null, true);
    const model = { schema, name };
    const databaseResponse = await PostgresSrv.executeFile("srv/ejflab/sql/delete/rac_table.sql", model);
    res.status(200).send({
      'status': 'ok',
    });
  }

  static getSqlManager() {
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS, // Replace with your key file
      scopes: ['https://www.googleapis.com/auth/sqlservice.admin'],
    });
    const sqlAdmin = google.sqladmin({ version: 'v1', auth });
    return sqlAdmin;
  }

  static async getCloudSqlInstanceState(instanceName, projectId) {
    const sqlAdmin = RACServices.getSqlManager();
    const res = await sqlAdmin.instances.get({
      project: projectId,
      instance: instanceName,
    });

    // Extract the instance status
    return res.data;
  }

  static async toggleCloudSqlInstance(instanceName, projectId, start = true) {
    const sqlAdmin = RACServices.getSqlManager();
    const activationPolicy = start ? 'ALWAYS' : 'NEVER';
    const res = await sqlAdmin.instances.patch({
      project: projectId,
      instance: instanceName,
      requestBody: {
        settings: {
          activationPolicy,
        },
      },
    });
  }

  static async getCloudRunManager(serviceName) {
    const client = new ServicesClient();
    const projectId = 'ejfexperiments';
    const location = 'us-central1';
    const servicePath = `projects/${projectId}/locations/${location}/services/${serviceName}`;
    const [service] = await client.getService({
      name: servicePath,
    });
    return { client, service, servicePath };
  }

  static async updateCloudRunMinInstances(serviceName, value) {
    const { client, service, servicePath } = await RACServices.getCloudRunManager(serviceName);
    //console.log(service.template.scaling);
    service.template.scaling.minInstanceCount = value;
    const [operation] = await client.updateService({
      service,
      name: servicePath,
    });
  }

  static async getCloudRunState(req, res, next) {
    const name = General.readParam(req, "name", null, true);
    const { client, service } = await RACServices.getCloudRunManager(name);
    //console.log(service);
    res.status(200).send({
      // state: "CONDITION_SUCCEEDED", "CONDITION_RECONCILING"
      'status': service.terminalCondition.state,
      'minInstanceCount': service.template.scaling.minInstanceCount,
      'maxInstanceCount': service.template.scaling.maxInstanceCount,
    });
  }

  static async cloudRunOn(req, res, next) {
    const name = General.readParam(req, "name", null, true);
    await RACServices.updateCloudRunMinInstances(name, 1);
    res.status(200).send({
      'status': 'ok',
    });
  }

  static async cloudRunOff(req, res, next) {
    const name = General.readParam(req, "name", null, true);
    await RACServices.updateCloudRunMinInstances(name, 0);
    res.status(200).send({
      'status': 'ok',
    });
  }

  // toggleCloudSqlInstance
  static async dbOn(req, res, next) {
    const name = General.readParam(req, "name", null, true);
    await RACServices.toggleCloudSqlInstance(name, "ejfexperiments", true);
    res.status(200).send({
      'status': 'ok',
    });
  }

  static async dbOff(req, res, next) {
    const name = General.readParam(req, "name", null, true);
    await RACServices.toggleCloudSqlInstance(name, "ejfexperiments", false);
    res.status(200).send({
      'status': 'ok',
    });
  }

  static async dBState(req, res, next) {
    const status = await PostgresSrv.checkSelect1();
    res.status(200).send({
      // RUNNABLE 
      'status': status,
    });
  }
}
