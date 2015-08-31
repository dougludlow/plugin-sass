import babel from 'gulp-babel';
import del from 'del';
import gulp from 'gulp';
import notify from 'gulp-notify';

gulp.task('clean', (done) => {
  del(['lib'], done);
});

gulp.task('javascript', () => {
  return gulp.src('src/**/*.js')
    .pipe(babel())
    .pipe(gulp.dest('./lib'));
});

gulp.task('build', ['javascript'], () => {
  return gulp.src('.')
    .pipe(notify({
      message: 'Successfully build',
      onLast: true,
    }));
});

gulp.task('default', ['clean'], () => {
  gulp.start('build');
});
