const gulp = require('gulp');
const sass = require('gulp-sass');
const browserSync = require('browser-sync').create();
const postcss      = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const concat = require('gulp-concat');

// css file paths
const cssFolder = 'main/assets/css'; // folder for final style.css/style-custom-prop-fallbac.css files
const scssFilesPath = 'main/assets/css/**/*.scss'; // scss files to watch

const utilJsPath = 'node_modules/codyhouse-framework/main/assets/js'; // util.js path

function reload(done) {
  browserSync.reload();
  done();
} 

gulp.task('sass', function() {
  return gulp.src(scssFilesPath)
  .pipe(sass().on('error', sass.logError))
  .pipe(postcss([autoprefixer()]))
  .pipe(gulp.dest(cssFolder))
  .pipe(browserSync.reload({
    stream: true
  }));
});

gulp.task('scripts', function() {
  return gulp.src([utilJsPath+'/util.js', 'main/assets/js/tutorial.js'])
  .pipe(concat('scripts.js'))
  .pipe(gulp.dest('main/assets/js'))
  .pipe(browserSync.reload({
    stream: true
  }));
});

gulp.task('browserSync', gulp.series(function (done) {
  browserSync.init({
    server: {
      baseDir: 'main'
    },
    notify: false
  })
  done();
}));

gulp.task('watch', gulp.series(['browserSync', 'sass', 'scripts'], function () {
  gulp.watch('main/*.html', gulp.series(reload));
  gulp.watch('main/assets/css/**/*.scss', gulp.series(['sass']));
  gulp.watch('main/assets/js/tutorial.js', gulp.series(['scripts']));
}));