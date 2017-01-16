// import _ from "lodash";
import yargs from "yargs";
import fsp from "fs-promise";

export default class ZwiftWorkouts {
    constructor(args) {
        this.inputFile = args.file;
        this.outputFile = args.o;
        Promise.all(
            [
                fsp.stat(this.inputFile)
                    .then((stat) => {
                        if (!stat.isFile) throw Error("Invalid input file");
                        return fsp.realpath(this.inputFile);
                    })
                    .then((realPath) => { return `Reading workouts from ${realPath}` }),
                fsp.stat(this.outputFile)
                    .then((stat) => {
                        if (!stat.isDirectory) throw Error("Invalid output directory")
                        return fsp.realpath(this.outputFile);
                    })
                    .then((realPath) => { return `Writing workouts to ${realPath}` }),
            ]
        )
            .then(values => { console.log(values) })
            .catch((e) => { console.log(e) });
    }
}

const argv = yargs
    .usage("Usage: $0 -file input file -o output directory")
    .default("o", ".")
    .demandOption(["file"])
    .argv;

new ZwiftWorkouts(argv);


