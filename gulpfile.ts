import * as del from "del";
import * as gulp from "gulp";
import * as rename from "gulp-rename";
import * as ts from "gulp-typescript";
import * as uglify from "gulp-uglify";
import * as karma from "karma";
import * as typescript from "rollup-plugin-typescript2";
import * as rollup from "rollup-stream";
import * as runSequence from "run-sequence";
import * as source from "vinyl-source-stream";

declare const __dirname;
const tsProject = ts.createProject("tsconfig.json");
const bundle = "clarity.js";
const minifiedBundle = "clarity.min.js";
const karmaServer = karma.Server;

gulp.task("build", () => {
  runSequence(
    "clean",
    "compile",
    "place-fixture",
    "place-webtest",
    "rollup",
    "uglify"
  );
});

// build and then run coverage
gulp.task("bnc", () => {
  runSequence(
    "clean",
    "compile",
    "place-fixture",
    // "place-webtest",
    "rollup",
    "uglify",
    "coverage"
  );
});

// build and then run tests
gulp.task("bnt", () => {
  runSequence(
    "clean",
    "compile",
    "place-fixture",
    // "place-webtest",
    "rollup",
    "uglify",
    "test"
  );
});

gulp.task("uglify", () => {
  return gulp.src("build/" + bundle)
    .pipe(uglify())
    .pipe(rename(minifiedBundle))
    .pipe(gulp.dest("build"));
});

gulp.task("rollup", () => {
  return rollup({
      entry: "./src/clarity.ts",
      format: "umd",
      moduleName: "clarity",
      plugins: [
        (typescript as any)()
      ]
    })
    .pipe(source(bundle))
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

gulp.task("place-webtest", () => {
  return gulp.src("test/test.js")
    .pipe(gulp.dest("build/test"));
});

gulp.task("place-git-hooks", () => {
  return gulp.src("githooks/*")
    .pipe(gulp.dest(".git/hooks"));
});

gulp.task("webtest", (done) => {
  new karmaServer({
    configFile: __dirname + "/build/test/sauce.karma.conf.js",
    singleRun: true
  }, done).start();
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
