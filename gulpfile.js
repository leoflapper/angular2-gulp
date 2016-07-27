var gulp = require('gulp');
var del = require('del');
var typescript = require('gulp-typescript');
var tslint = require('gulp-tslint');
var tscConfig = require('./tsconfig.json');
var tsconfigGlob = require('tsconfig-glob');
var sourcemaps = require('gulp-sourcemaps');
var gulpif = require('gulp-if');
var argv = require('yargs').argv;
var concat = require('gulp-concat');
var ngAnnotate = require('gulp-ng-annotate');
var templateCache = require('gulp-angular-templatecache');
var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync').create();
var sass = require('gulp-sass');
var csso = require('gulp-csso');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var plumber = require('gulp-plumber');

// clean the contents of the distribution directory
gulp.task('clean:lib', function () {
  return del('public/dist/lib');
});

// SASS compile
gulp.task('sass', function() {
  return gulp.src('app/**/*.scss')
    .pipe(plumber())
    .pipe(sass())
    .pipe(autoprefixer())
    .pipe(gulpif(argv.production, csso()))
    .pipe(concat('main.css'))
    .pipe(gulp.dest('./public/dist'))
    .pipe(browserSync.stream());
});

gulp.task('templates', function() {
  return gulp.src('app/**/*.html')
    .pipe(uglify())
    .pipe(gulp.dest('public/dist/app'));
});

// TypeScript compile
gulp.task('compile', function () {
  return gulp
    .src('app/**/*.ts')
    .pipe(sourcemaps.init()) 
    .pipe(typescript(tscConfig.compilerOptions))
    .pipe(ngAnnotate())
    .pipe(gulpif(argv.production, uglify()))
    .pipe(gulp.dest('public/dist/app'));
});

gulp.task('copy:libs', ['clean:lib'], function() {
    return gulp.src([
      'node_modules/**/*'
    ])
    .pipe(gulp.dest('public/dist/lib'))
});

gulp.task('tslint', function() {
  return gulp.src('app/**/*.ts')
    .pipe(tslint())
    .pipe(tslint({
        formatter: 'verbose'
    }))
    .pipe(tslint.report());
});

gulp.task('tsconfig-glob', function () {
  return tsconfigGlob({
    configPath: '.',
    indent: 2
  });
});

gulp.task('copy:assets', ['clean:lib'], function() {
  return gulp.src(['app/**/*', '!app/**/*.ts', '!app/**/*.scss'], { base : './' })
    .pipe(gulp.dest('public/dist'))
});



gulp.task('watch', ['tsconfig-glob'], function() {
  
  browserSync.init({
        server: {
            baseDir: "./public"
        }
  });

  gulp.watch('app/**/*.scss', ['sass']).on('change', browserSync.reload);
  gulp.watch('app/**/*.html', ['templates']).on('change', browserSync.reload);
  gulp.watch('app/**/*.ts', ['compile']).on('change', browserSync.reload);
});

gulp.task('build', ['compile', 'copy:libs', 'copy:assets', 'sass']);
gulp.task('default', ['build']);