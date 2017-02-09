import gulp from "gulp";
import sass from "gulp-sass";
import sourcemaps from "gulp-sourcemaps";
import rename from "gulp-rename";
import babel from "gulp-babel";
import browserify from "gulp-browserify";
import nodemon from "gulp-nodemon";
import runSequence from "gulp-run-sequence";
import minify from "gulp-minify";
import del from 'del';

gulp.task("scss", () => {
  return gulp.src("./public/main.scss")
    .pipe(sourcemaps.init())
    .pipe(sass({ outputStyle: "compressed" }).on("error", sass.logError))
    .pipe(sourcemaps.write())
    .pipe(rename("main.min.css"))
    .pipe(gulp.dest("./dist/public"));
});
// gulp.task("scss:watch", () => {
//   gulp.watch("public/main.scss", ["scss"]);
// });


gulp.task("build-server", () => {
  return gulp.src("server/*.js")
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest("dist/server"));
});
// gulp.task("build-server:watch", () => {
//   gulp.watch("server/*.js", ["build-server"]);
// });


gulp.task("build-client", () => {
  return gulp.src("public/*.js")
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest("dist/public"));
});
// gulp.task("build-client:watch", () => {
//   gulp.watch("public/*.js", ["build-client"]);
// });

gulp.task("browserify", () => {
  gulp.src("dist/public/main.js")
    .pipe(browserify())
    .pipe(minify({ ext: { min: '.min.js' } }))
    .pipe(gulp.dest("dist/public"))
});
// gulp.task("browserify:watch", () => {
//   gulp.watch("dist/public/main.js", ["browserify"]);
// });

gulp.task("copy-server", function () {
  return gulp.src(["server/**/*", "!server/**/*.js"])
    .pipe(gulp.dest("dist/server"));
});

gulp.task("copy-client", function () {
  return gulp.src(["public/**/*", "!public/**/*.js", "!public/**/*.scss"])
    .pipe(gulp.dest("dist/public"));
});

gulp.task("clean", () => {
  return del('dist/**', { force: true });
});

gulp.task("build", (done) => {
  runSequence("clean", "copy-client", "build-client", "scss", "browserify", "copy-server", "build-server", done);
})

gulp.task("start", ["build"], () => {
  nodemon({
    script: "dist/server/index.js"//,
    // env: { "NODE_ENV": "development" }
  })
})