import * as del from "del";
import * as gulp from "gulp";
import * as ts from "gulp-typescript";

const tsProject = ts.createProject("tsconfig.json");

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
));
