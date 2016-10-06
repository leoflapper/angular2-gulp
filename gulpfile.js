var gulp = require('gulp'),
    del = require('del'),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    typescript = require('gulp-typescript'),
    tslint = require('gulp-tslint'),
    tscConfig = require('./tsconfig.json'),
    tsconfigGlob = require('tsconfig-glob'),
    sourcemaps = require('gulp-sourcemaps'),
    gulpif = require('gulp-if'),
    argv = require('yargs').argv,
    concat = require('gulp-concat'),
    ngAnnotate = require('gulp-ng-annotate'),
    autoprefixer = require('gulp-autoprefixer'),
    browserSync = require('browser-sync').create(),
    sass = require('gulp-sass'),
    csso = require('gulp-csso'),
    uglify = require('gulp-uglify'),
    plumber = require('gulp-plumber'),
    changed = require('gulp-changed');

const DIST = 'public/dist';
const LIB = DIST +'/lib';
const APP = DIST +'/app';

// clean the contents of the distribution directory
gulp.task('clean:lib', function () {
  return del(LIB);
});

// SASS compile
gulp.task('sass', function() {
  return gulp.src('app/scss/main.scss')
    .pipe(plumber())
    .pipe(sass())
    .pipe(autoprefixer())
    .pipe(gulpif(argv.production, csso()))
    .pipe(concat('main.css'))
    .pipe(gulp.dest(DIST))
    .pipe(browserSync.stream());
});

// Compresses the templates
gulp.task('templates', function() {
  return gulp.src('app/**/*.html')
    .pipe(uglify())
    .pipe(gulp.dest(APP));
});

// TypeScript compile
gulp.task('compile', function () {
  return gulp
    .src('app/**/*.ts')
    .pipe(changed(APP))
    .pipe(sourcemaps.init()) 
    .pipe(typescript(tscConfig.compilerOptions))
    .pipe(ngAnnotate())
    .pipe(gulpif(argv.production, uglify()))
    .pipe(gulp.dest(APP));
});

//Copies all the app files to the public dist directory
gulp.task('copy:assets', ['clean:lib'], function() {
  return gulp.src(['app/**/*', '!app/**/*.ts', '!app/**/*.scss'], { base : './' })
    .pipe(gulp.dest(DIST))
});

// Copys the library folders to the public folder
gulp.task('copy:libs', ['clean:lib'], function() {
    return gulp.src([
      'node_modules/**/*'
    ])
    .pipe(gulp.dest(LIB))
});

// Typescript linter
gulp.task('tslint', function() {
  return gulp.src('app/**/*.ts')
    .pipe(tslint({
        formatter: 'verbose'
    }))
    .pipe(tslint.report());
});

// DefinitelyTyped
gulp.task('tsconfig-glob', function () {
  return tsconfigGlob({
    configPath: '.',
    indent: 2
  });
});

var defaultFile = "index.html"
var baseDir = "public";
gulp.task('watch', ['tsconfig-glob'], function() {

  browserSync.init({
        server: {
            baseDir: "./" + baseDir,
            middleware: function(req, res, next) {
                var fileName = url.parse(req.url);
                fileName = fileName.href.split(fileName.search).join("");
                var fileExists = fs.existsSync(__dirname + "/" + baseDir + fileName);
                if (!fileExists && fileName.indexOf("browser-sync-client") < 0) {
                    req.url = "/" + defaultFile;
                }
                return next();
            }
        }
  });

  gulp.watch('app/scss/**/*.scss', ['sass']);
  gulp.watch('app/**/*.html', ['templates']).on('change', browserSync.reload);
  gulp.watch('app/**/**/*.html', ['templates']).on('change', browserSync.reload);
  gulp.watch(['public/systemjs.config.js', 'public/index.html']).on('change', browserSync.reload);
  gulp.watch('app/**/*.ts', ['compile']).on('change', browserSync.reload);
  
});

gulp.task('build', ['compile', 'copy:libs', 'copy:assets', 'sass']);
gulp.task('default', ['build']);
