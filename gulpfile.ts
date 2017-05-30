import * as browserify from "browserify";
import * as del from "del";
import * as gulp from "gulp";
import * as rename from "gulp-rename";
import * as ts from "gulp-typescript";
import * as uglify from "gulp-uglify";
import * as karma from "karma";
import * as runSequence from "run-sequence";
import * as source from "vinyl-source-stream";

declare const __dirname;
const tsProject = ts.createProject("tsconfig.json");
const clarityUncrunched = "clarity.uncrunched.js";
const clarity = "clarity.js";
const karmaServer = karma.Server;

const sources = [
  "build/src/core.js",
  "build/src/apicheck.js",
  "build/src/viewport.js",
  "build/src/layout/layout.js",
  "build/src/pointer.js",
  "build/src/performance.js",
  "build/src/errors.js"
];

gulp.task("build", () => {
  runSequence(
    "clean",
    "compile",
    "place-fixture",
    "browserify",
    "uglify"
  );
});

gulp.task("bnc", () => {
  runSequence(
    "clean",
    "compile",
    "place-fixture",
    "browserify",
    "uglify",
    "coverage"
  );
});

gulp.task("bnt", () => {
  runSequence(
    "clean",
    "compile",
    "place-fixture",
    "browserify",
    "uglify",
    "test"
  );
});

gulp.task("uglify", () => {
  return gulp.src("build/" + clarityUncrunched)
    .pipe(uglify())
    .pipe(rename(clarity))
    .pipe(gulp.dest("build"));
});

gulp.task("browserify", () => {
  return browserify({
      entries: sources
    })
    .require("./build/src/wireup.js", {
      expose : "clarity"
    })
    .bundle()
    .pipe(source(clarityUncrunched))
    .pipe(gulp.dest("build"));
});

gulp.task("clean", () => {
  del("build");
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

gulp.task("place-git-hooks", () => {
  return gulp.src("githooks/*")
    .pipe(gulp.dest(".git/hooks"));
});

gulp.task("test", (done) => {
  new karmaServer({
    browsers: [],
    configFile: __dirname + "/build/test/karma.conf.js",
    singleRun: true
  }, done).start();
});

gulp.task("test-debug", (done) => {
  new karmaServer({
    browsers: ["Chrome"],
    configFile: __dirname + "/build/test/karma.conf.js",
    singleRun: false
  }, done).start();
});

gulp.task("coverage", (done) => {
  new karmaServer({
    configFile: __dirname + "/build/test/coverage.conf.js",
    singleRun: true
  }, done).start();
});
