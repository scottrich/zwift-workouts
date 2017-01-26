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
                    }),
                fsp.stat(this.outputDir)
                    .then((stat) => {
                        if (!stat.isDirectory) throw Error("Invalid output directory");
                        return fsp.realpath(this.outputDir);
                    })
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
                                        const workoutName = `${week} - ${day}`
                                        const segmentsText = segments.map(this.segmentText).join("\n");
                                        fsp.writeFileSync(workoutFileName, this.workoutTemplate(workoutName, segmentsText));
                                    })
                                });
                        });
                    });
            })
            .catch((e) => { console.log(e) });
    }

    workoutTemplate(workoutName, segmentsText) {
        return `<workout_file>
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
</workout_file>`;
    }

    segmentText(s) {
        const type = s[0];
        switch (type) {
            case "EM":
                return `       <SteadyState Duration="${s[1] * 60}" Power="0.60"  Cadence="90"/>`;
            case "T":
                return `       <SteadyState Duration="${s[1] * 60}" Power="0.85"/>  Cadence="75" `;
            case "CR":
                return `       <SteadyState Duration="${s[1] * 60}" Power="0.97"/>`;
            case "SS":
                return `       <IntervalsT Repeat="${s[1]}" OnDuration="${s[2] * 60}" OffDuration="${s[3] * 60}" OnPower="0.90" OffPower="0.60"  Cadence="90"/>`;
            case "SEPI":
                return `       <IntervalsT Repeat="${s[1]}" OnDuration="${s[2] * 60}" OffDuration="${s[3] * 60}" OnPower="1.10" OffPower="0.40"/>  Cadence="100" `;
            case "PFPI":
                return `       <IntervalsT Repeat="${s[1]}" OnDuration="${s[2] * 60}" OffDuration="${s[3] * 60}" OnPower="1.10" OffPower="0.40"/>  Cadence="90" `;
            case "OU":
                return `       <IntervalsT Repeat="${s[1]}" OnDuration="${s[2] * 60}" OffDuration="${s[3] * 60}" OnPower="0.90" OffPower="1.01"/>  Cadence="90" `;
            case "FREE":
                return `       <FreeRide Duration="${s[1] * 60}" FlatRoad="1"/>`;
            default:
                throw Error(`Invalid workout type: ${type}`);
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



