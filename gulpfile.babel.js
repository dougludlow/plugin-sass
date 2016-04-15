import browserSyncModule from 'browser-sync';
import del from 'del';
import eslint from 'gulp-eslint';
import fse from 'fs-extra';
import gulp from 'gulp';
import modernizr from 'gulp-modernizr';
import notify from 'gulp-notify';
import pug from 'gulp-pug';
import tapColorize from 'tap-colorize';
import tape from 'gulp-tape';
import uglify from 'gulp-uglify';
import Builder from 'systemjs-builder';

const browserSync = browserSyncModule.create();
const bundle = (buildStatic = false) => {
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
  const builder = new Builder('src', 'src/config.js');
  const build = builder[buildStatic ? 'buildStatic' : 'bundle']('test/bundleme', '.tmp/bundle.js');
  return Promise.all([build, copyFiles]);
};

gulp.task('clean', () => del('.tmp'));

gulp.task('pug', ['clean'], () =>
  gulp.src('test/*.pug')
    .pipe(pug())
    .pipe(gulp.dest('.tmp'))
);

gulp.task('bundle', ['clean'], () => bundle());

gulp.task('bundleStatic', ['clean'], () => bundle(true));

gulp.task('lint', () => {
  const glob = [
    '!src/config.js',
    '!src/modernizr.js',
    '!src/jspm_packages/**',
    'src/**/*.js',
    'test/**/*.spec.js',
  ];
  return gulp.src(glob)
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failOnError());
});

gulp.task('modernizr', () => {
  const glob = [
    '!src/config.js',
    '!src/modernizr.js',
    '!src/jspm_packages/**',
    'src/**/*.js',
  ];
  return gulp.src(glob)
    .pipe(modernizr())
    .pipe(uglify())
    .pipe(gulp.dest('src'));
});

gulp.task('test', () =>
  gulp.src('test/*.spec.js')
    .pipe(tape({
      reporter: tapColorize(),
    }))
);

gulp.task('test:runtime', ['pug', 'modernizr'], () => {
  browserSync.init({
    server: {
      index: 'runtime-test.html',
      baseDir: ['.tmp', 'src', 'test'],
    },
  });
  gulp.watch('src/**.js').on('change', browserSync.reload);
});

gulp.task('test:bundle', ['pug', 'bundle'], () => {
  browserSync.init({
    server: {
      baseDir: ['.tmp', 'test'],
      index: 'bundle-test.html',
    },
  });
  gulp.watch('src/**.js').on('change', browserSync.reload);
});

gulp.task('test:bundleStatic', ['pug', 'bundleStatic'], () => {
  browserSync.init({
    server: {
      baseDir: ['.tmp', 'test'],
      index: 'bundle-static-test.html',
    },
  });
  gulp.watch('src/**.js').on('change', browserSync.reload);
});

gulp.task('default', ['lint', 'test', 'modernizr'], () =>
  gulp.src('.')
    .pipe(notify({
      message: 'Successfully build',
      onLast: true,
    }))
);
