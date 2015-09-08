import browserSyncModule from 'browser-sync';
import del from 'del';
import eslint from 'gulp-eslint';
import gulp from 'gulp';
import jade from 'gulp-jade';
import notify from 'gulp-notify';

const browserSync = browserSyncModule.create();

gulp.task('clean', () => {
  return del('.tmp');
});

gulp.task('jade', () => {
  return gulp.src('test/index.jade')
    .pipe(jade())
    .pipe(gulp.dest('.tmp'));
});

gulp.task('lint', () => {
  return gulp.src('./src/**/*.js')
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failOnError());
});

gulp.task('test', ['jade'], () => {
  browserSync.init({
    server: {
      baseDir: ['.', 'src'],
      index: '.tmp/index.html',
    },
  });
  gulp.watch('src/**.js').on('change', browserSync.reload);
});

gulp.task('default', ['lint'], () => {
  return gulp.src('.')
    .pipe(notify({
      message: 'Successfully build',
      onLast: true,
    }));
});
