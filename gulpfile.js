const gulp = require('gulp')
const uglify = require('gulp-uglify')
const babel = require('gulp-babel')
const ts = require('gulp-typescript')

const tsProject = ts.createProject('./tsconfig.json')

gulp.task('build', function(cb) {
    // gulp.src('src/*.*')
    tsProject
      .src()
      .pipe(tsProject())
      .pipe(babel({
        presets: ['env', 'es2015', 'stage-0']
      }))
      .pipe(uglify())
      .pipe(gulp.dest('dist'))
      cb()
})

gulp.task('default', gulp.series(gulp.parallel(['build'])))