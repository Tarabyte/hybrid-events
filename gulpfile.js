/*global require*/
var gulp = require('gulp');

var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var qunit = require('gulp-qunit');
var size = require('gulp-size');

//Linting this beatch!
gulp.task('lint', function() {
    return gulp.src('interval.js')
                .pipe(jshint())
                .pipe(jshint.reporter('default'));
});

gulp.task('script', function() {
    return gulp.src('events.js')
                .pipe(rename('events.min.js'))
                .pipe(size({title: 'development'}))
                .pipe(uglify())
                .pipe(gulp.dest(''))
                .pipe(size({title: 'minified'}));   
});

gulp.task('watch', function() {
    gulp.watch('events.js', ['lint', 'script', 'test']);
    
    gulp.watch('test/events_test.js', ['test']);
});


gulp.task('test', function() {
    return gulp.src('./test/runner.html').pipe(qunit());
});

gulp.task('default', ['lint', 'test', 'script', 'watch']);