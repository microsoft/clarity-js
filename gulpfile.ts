import * as del from "del";
import * as gulp from "gulp";
import * as rename from "gulp-rename";
import * as ts from "gulp-typescript";
import * as uglify from "gulp-uglify";
import * as typescript from "rollup-plugin-typescript2";
import * as rollup from "rollup-stream";
import * as source from "vinyl-source-stream";

const tsProject = ts.createProject("tsconfig.json");
const bundle = "clarity.js";
const minifiedBundle = "clarity.min.js";

gulp.task("uglify", () => {
  return gulp.src("build/" + bundle)
    .pipe(uglify())
    .pipe(rename(minifiedBundle))
    .pipe(gulp.dest("build"));
});

gulp.task("rollup", () => {
  return rollup({
    input: "./src/clarity.ts",
    format: "umd",
    name: "clarity",
    plugins: [
      (typescript as any)()
    ]
  })
    .pipe(source(bundle))
    .pipe(gulp.dest("build"));
});

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

gulp.task("build", gulp.series(
  "clean",
  "compile",
  "rollup",
  "uglify"
));
