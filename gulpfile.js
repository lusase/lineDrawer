const gulp = require('gulp')
const uglify = require('gulp-uglify')
const babel = require('gulp-babel')

gulp.task('build', function(cb) {
    gulp.src('src/*.*')
    .pipe(babel({
      presets: ['env', 'es2015', 'stage-0']
    }))
    .pipe(uglify())
    .pipe(gulp.dest('dist'))
    cb()
})

gulp.task('default', ['build'])