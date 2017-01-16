import _ from "lodash";
import yargs from "yargs";
import fsp from "fs-promise";

export class ZwiftWorkouts {
  constructor(args) {
      this.inputFile = args.file;
      this.outputFile = args.o;
  }
}

const argv = yargs
    .usage("Usage: $0 -file input file -o output directory")
    .default("o", ".")
    .demandOption(['file'])
    .argv;



