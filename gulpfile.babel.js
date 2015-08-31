import browserSync from 'browser-sync';
import eslint from 'gulp-eslint';
import gulp from 'gulp';
import notify from 'gulp-notify';

browserSync.create();

gulp.task('lint', () => {
  return gulp.src('./src/**/*.js')
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failOnError());
});

gulp.task('test', ['lint'], () => {
  browserSync.init({
    server: {
      index: 'test.html',
      baseDir: ['./test', './'],
    },
    files: ['src/**.js', 'test/**.html', 'test/**.scss'],
  });
});

gulp.task('default', ['lint'], () => {
  return gulp.src('.')
    .pipe(notify({
      message: 'Successfully build',
      onLast: true,
    }));
});
