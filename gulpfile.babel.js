import browserSyncModule from 'browser-sync';
import Builder from 'systemjs-builder';
import del from 'del';
import eslint from 'gulp-eslint';
import fse from 'fs-extra';
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
  const copyFiles = new Promise((resolve, reject) => {
    fse.copy('src/config.js', '.tmp/config.js', err => {
      if (err) {
        reject(err);
      } else {
        fse.copy('src/jspm_packages/system.js', '.tmp/system.js', err2 => {
          if (err2) {
            reject(err2);
          } else {
            resolve();
          }
        });
      }
    });
  });
  const build = new Builder('src', 'src/config.js')
    .bundle('test/bundleme', '.tmp/bundle.js');
  return Promise.all([build, copyFiles]);
});

gulp.task('lint', () => {
  const glob = [
    '!src/config.js',
    '!src/jspm_packages/**',
    'src/**/*.js',
  ];
  return gulp.src(glob)
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failOnError());
});

gulp.task('test:runtime', ['jade'], () => {
  browserSync.init({
    server: {
      index: 'runtime-test.html',
      baseDir: ['.tmp', 'src', 'test'],
    },
  });
  gulp.watch('src/**.js').on('change', browserSync.reload);
});

gulp.task('test:bundle', ['jade', 'bundle'], () => {
  browserSync.init({
    server: {
      baseDir: ['.tmp', 'test'],
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
