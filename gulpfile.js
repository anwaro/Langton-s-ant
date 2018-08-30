var gulp = require('gulp');
var gutil = require('gulp-util');
var sass = require('gulp-sass');
var rename = require('gulp-rename');
var cleanCSS = require('gulp-clean-css');


var scss_file = "scss/*.scss";
var css_path = "css";

// SASS CSS MIN AUTOPREFIXER
gulp.task('sass', function () {
    return gulp.src(scss_file)
        .pipe(sass())
        .on('error', function log(e) {
            gutil.log(e.toString());
            this.emit('end');
        })
        .pipe(cleanCSS({compatibility: 'ie8'}))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest(css_path));
});



gulp.task('default', function() {
    gulp.watch(scss_file, ['sass']);
});