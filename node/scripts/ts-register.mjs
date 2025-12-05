import {register} from "node:module";
import {pathToFileURL} from "node:url";

// Enable ts-node as ESM loader
register("ts-node/esm", pathToFileURL("./"));
