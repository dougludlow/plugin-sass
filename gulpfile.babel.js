import browserSyncModule from 'browser-sync';
import Builder from 'systemjs-builder';
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
  return gulp.src('test/*.jade')
    .pipe(jade())
    .pipe(gulp.dest('.tmp'));
});

gulp.task('bundle', () => {
  const builder = new Builder();
  builder.loadConfig('./config.js');
  return builder.build('test/bundleme.js', '.tmp/bundle.js')
    .then(() => {
      return gulp.src(['config.js', 'jspm_packages/system.js'])
        .pipe(gulp.dest('.tmp'));
    });
});

gulp.task('lint', () => {
  // Can't use ES2015 in sass-builder.js at the moment
  // See https://github.com/systemjs/systemjs/issues/774
  return gulp.src(['./src/**/*.js', '!./src/sass-builder.js'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failOnError());
});

gulp.task('test:runtime', ['jade'], () => {
  browserSync.init({
    server: {
      baseDir: ['.', 'src'],
      index: '.tmp/runtime-test.html',
    },
  });
  gulp.watch('src/**.js').on('change', browserSync.reload);
});

gulp.task('test:bundle', ['jade', 'bundle'], () => {
  browserSync.init({
    server: {
      baseDir: ['.tmp'],
      index: 'bundle-test.html',
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
