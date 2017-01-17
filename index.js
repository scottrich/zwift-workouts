import _ from "lodash";
import yargs from "yargs";
import fsp from "fs-promise";
import path from "path";

export default class ZwiftWorkouts {
    constructor(args) {
        this.inputFile = args.file;
        this.outputDir = args.o;
    }

    loadWorkouts() {
        Promise.all(
            [
                fsp.stat(this.inputFile)
                    .then((stat) => {
                        if (!stat.isFile) throw Error("Invalid input file");
                        return fsp.realpath(this.inputFile);
                    })
                    .then(realPath => { return realPath }),
                fsp.stat(this.outputDir)
                    .then((stat) => {
                        if (!stat.isDirectory) throw Error("Invalid output directory");
                        return fsp.realpath(this.outputDir);
                    })
                    .then(realPath => { return realPath })
            ]
        )
            .then(paths => {
                this.inputFile = paths[0];
                this.outputDir = paths[1];
                console.log(`Loading workouts from ${this.inputFile}`);
                return fsp.readJSON(this.inputFile)
                    .then(workouts => {
                        console.log('Successfully loaded workouts.');
                        return workouts;
                    })
                    .catch(e => {
                        console.log(`Error loading workouts: ${e}`)
                    });
            })
            .then(workouts => {
                console.log(`Writing workouts to ${this.outputDir}`);
                // console.log(`${JSON.stringify(workouts)}`);
                return fsp.ensureDir(this.outputDir)
                    .then(fsp.ensureDir(path.join(this.outputDir, workouts.name)))
                    .then(() => {
                        const rootDir = path.join(this.outputDir, workouts.name);
                        _.each(_.omit(workouts, "name"), (days, week) => {
                            const weekDir = path.join(rootDir, week);
                            fsp.ensureDir(weekDir)
                                .then(() => {
                                    _.each(days, (segments, day) => {
                                        const workoutFileName = path.join(weekDir, `${day}.zwo`);
                                        const workoutName = `${workouts.name} - ${week} - ${day}`
                                        const segmentsText = segments.map(this.segmentText).join("\n");
                                        const workoutTemplate = `<workout_file>
    <author>s.rich</author>
    <name>${workoutName}</name>
    <description></description>
    <sportType>bike</sportType>
    <tags>
    </tags>
    <workout>
       <Warmup Duration="360" PowerLow="0.35" PowerHigh="0.60"/>
${segmentsText}
       <Cooldown Duration="360" PowerLow="0.60" PowerHigh="0.35"/>
    </workout>
</workout_file>
`;
                                        fsp.writeFileSync(workoutFileName, workoutTemplate);
                                    })
                                });
                        });
                    });
            })
            .catch((e) => { console.log(e) });
    }

    segmentText(s) {
        const type = s[0];
        switch (type) {
            case "EM":
                return `       <SteadyState Duration="${s[1] * 60}" Power="0.60"/>`
                break;
            case "T":
                return `       <SteadyState Duration="${s[1] * 60}" Power="0.82"/>`
                break;
            case "SS":
                return `       <IntervalsT Repeat="${s[1]}" OnDuration="${s[2] * 60}" OffDuration="${s[3] * 60}" OnPower="0.90" OffPower="0.60"/>`
                break;
            default:
                break;
        }
    }
}

const argv = yargs
    .usage("Usage: $0 -file input file -o output directory")
    .default("o", ".")
    .demandOption(["file"])
    .argv;

const z = new ZwiftWorkouts(argv);

z.loadWorkouts();



