import {
  commonHeaders,
  handleErrorsDecorator,
} from "@ejfdelgado/ejflab-back/srv/Network.mjs";
import * as multer from "multer";
import { RACServices } from "./RACServices.mjs";

const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024;
const upload = multer.default({
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    fieldSize: MAX_FILE_SIZE_BYTES,
  },
});

export class EjflabSrv {
  static configure(app) {
    app.get("/srv/rac/index", [commonHeaders, handleErrorsDecorator(RACServices.index),]);
    app.get("/srv/rac/page", [commonHeaders, handleErrorsDecorator(RACServices.page),]);

    app.get("/srv/rac/db/schemas", [commonHeaders, handleErrorsDecorator(RACServices.getSchemas),]);
    app.get("/srv/rac/db/:schema/tables", [commonHeaders, handleErrorsDecorator(RACServices.getTableOfschemas),]);
    app.get("/srv/rac/db/:schema/table/create", [commonHeaders, handleErrorsDecorator(RACServices.createTableOfschema),]);
    app.get("/srv/rac/db/:schema/table/destroy", [commonHeaders, handleErrorsDecorator(RACServices.destroyTableOfschema),]);
  }
}
