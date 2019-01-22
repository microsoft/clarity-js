import * as del from "del";
import * as gulp from "gulp";
import * as ts from "gulp-typescript";
import * as karma from "karma";

declare const __dirname;
const tsProject = ts.createProject("tsconfig.json");
const karmaServer = karma.Server;

gulp.task("clean", (done) => {
  del("build");
  done();
});

gulp.task("compile", () => {
  return tsProject.src()
    .pipe(tsProject())
    .js
    .pipe(gulp.dest(tsProject.config.compilerOptions.outDir));
});

gulp.task("place-fixture", () => {
  return gulp.src("test/clarity.fixture.html")
    .pipe(gulp.dest("build/test"));
});

gulp.task("test", (done) => {
  new karmaServer({
    configFile: __dirname + "/build/test/karma.conf.js",
    singleRun: true
  }, done).start();
});

gulp.task("test-debug", (done) => {
  new karmaServer({
    configFile: __dirname + "/build/test/karma.conf.js",
    singleRun: false
  }, done).start();
});

gulp.task("coverage", (done) => {
  new karmaServer({
    configFile: __dirname + "/build/test/coverage.conf.js"
  }, done).start();
});

gulp.task("build", gulp.series(
  "clean",
  "compile",
  "place-fixture"
));

// build and then run coverage
gulp.task("bnc", gulp.series(
  "clean",
  "compile",
  "place-fixture",
  "coverage"
));

// build and then run tests
gulp.task("bnt", gulp.series(
  "clean",
  "compile",
  "place-fixture",
  "test"
));
