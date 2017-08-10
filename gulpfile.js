var $, browserSync, browserify, bundler, del, destFileName, destFolder, gulp, path, rebundle, reload, source, sourceFile, watchify;

rebundle = function() {
    return bundler.bundle().on("error", $.util.log.bind($.util, "Browserify Error")).pipe(source(destFileName)).pipe(gulp.dest(destFolder)).on("end", function() {
        return reload();
    });
};

"use strict";

gulp = require("gulp");

del = require("del");

path = require("path");

$ = require("gulp-load-plugins")();

browserify = require("browserify");

watchify = require("watchify");

source = require("vinyl-source-stream");

sourceFile = "./app/scripts/app.js";

destFolder = "./dist/scripts";

destFileName = "app.js";

browserSync = require("browser-sync");

reload = browserSync.reload;

gulp.task("styles", [  "sass", "moveCss"]);

gulp.task("moveCss",  function() {
    return gulp.src(["./app/styles/**/*.css"], {
        base: "./app/styles/"
    }).pipe(gulp.dest("dist/styles"));
});

gulp.task('sass', function () {
    return gulp.src('./app/styles/*.scss')
        .pipe($.sass({
            style: "expanded",
            precision: 10,
            loadPath: ["app/bower_components"]
        }))
        .pipe($.uncss({
            html: ['./app/*.html']
        }))
        .pipe($.csso())
        .pipe($.cssbeautify())
        .pipe($.autoprefixer("last 1 version"))
        .pipe(gulp.dest("dist/styles"))
        .pipe($.size());
});
gulp.task('sass2', function () {
    return gulp.src('app/styles/*.scss')
        .pipe($.sass.sync().on('error', $.sass.logError))
        .pipe(gulp.dest('gulp-4/dist/styles'));
});

bundler = watchify(browserify({
    entries: [sourceFile],
    debug: true,
    insertGlobals: true,
    cache: {},
    packageCache: {},
    fullPaths: true
}));

bundler.on("update", rebundle);

bundler.on("log", $.util.log);

gulp.task("scripts", rebundle);

gulp.task("buildScripts", function() {
    return browserify(sourceFile).bundle().pipe(source(destFileName)).pipe(gulp.dest("dist/scripts"));
});

gulp.task("jade", function() {
    return gulp.src("app/template/*.jade").pipe($.jade({
        pretty: true
    })).pipe(gulp.dest("dist"));
});

gulp.task("html", function() {
    return gulp.src("app/*.html").pipe($.useref()).pipe(gulp.dest("dist")).pipe($.size());
});

gulp.task("images", function() {
    return gulp.src("app/images/**/*")
        .pipe(gulp.dest("dist/images")).pipe($.size());
});


gulp.task("fonts", function() {
    return gulp.src(require("main-bower-files")({
        filter: "**/*.{eot,svg,ttf,woff,woff2}"
    }).concat("app/fonts/**/*")).pipe(gulp.dest("dist/fonts"));
});

gulp.task("clean", function(cb) {
    $.cache.clearAll();
    return cb(del.sync(["dist/styles",  "dist/images"]));
});

gulp.task("bundle", ["styles", "scripts", "bower"], function() {
    return gulp.src("./app/*.html").pipe($.useref.assets()).pipe($.useref.restore()).pipe($.useref()).pipe(gulp.dest("dist"));
});

gulp.task("buildBundle", ["styles", "buildScripts", "moveLibraries", "bower"], function() {
    return gulp.src("./app/*.html").pipe($.useref.assets()).pipe($.useref.restore()).pipe($.useref()).pipe(gulp.dest("dist"));
});

gulp.task("moveLibraries", ["clean"], function() {
    return gulp.src(["./app/scripts/**/*.js"], {
        base: "./app/scripts/"
    }).pipe(gulp.dest("dist/scripts"));
});

gulp.task("bower", function() {
    return gulp.src("app/bower_components/**/*.js", {
        base: "app/bower_components"
    }).pipe(gulp.dest("dist/bower_components/"));
});

gulp.task("json", function() {
    return gulp.src("app/scripts/json/**/*.json", {
        base: "app/scripts"
    }).pipe(gulp.dest("dist/scripts/"));
});

gulp.task("extras", function() {
    return gulp.src(["app/*.txt", "app/*.ico"]).pipe(gulp.dest("dist/")).pipe($.size());
});

gulp.task("watch", [ "fonts", "bundle"], function() {
    browserSync({
        notify: false,
        logPrefix: "BS",
        server: ["dist", "app"]
    });
    gulp.watch("app/scripts/**/*.json", ["json"]);
    gulp.watch("app/scripts/**/*.js", ["buildScripts"]);
    gulp.watch("app/*.html", ["html"]);
    gulp.watch(["app/styles/**/*.scss", "app/styles/**/*.css", "app/styles/*.styl"], ["styles", "scripts", reload]);
    gulp.watch("app/images/**/*", reload);
});

gulp.task("build", ["html", "buildBundle", "images", "fonts", "extras"], function() {
    return gulp.src("dist/scripts/app.js").pipe($.uglify()).pipe($.stripDebug()).pipe(gulp.dest("dist/scripts"));
});

gulp.task("default", ["clean", "build"]);

// ---
// generated by coffee-script 1.9.2