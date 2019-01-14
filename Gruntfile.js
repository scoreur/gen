
module.exports = function(grunt){
    grunt.initConfig({
        pug: {
            options: {
                client: false,
                pretty: true
            },
            app: {
                src: 'view/index.pug',
                dest: './app.html',
                options:{
                    data: grunt.file.readJSON('view/scripts_app.json')
                }
            },
            web: {
                src: 'view/index.pug',
                dest: './index.html',
                options:{
                    data: grunt.file.readJSON('view/scripts_web.json')
                }
            }
        },
        jison: {
            options: { moduleType: "commonjs"},
            score: {
                options: { moduleName: "score_parser" },
                files: [{src: 'js/score.jison', dest: 'js/score_parser.js'}]
            },
            schema: {
                options: { moduleName: "schema_parser" },
                files: [{src: 'js/schema.jison', dest: 'js/schema_parser.js'}]
            }
        },
        concat: {
            options: {
                separator: ';'
            },
            gen: {
                src: ['js/score_parser.js', 'js/schema_parser.js', 'coffee/musical.js', 'coffee/*.js', 'js/gen.js', 'js/viewer.js', 'js/keyboard.js'],
                dest: 'js/gen-build.js'
            }
        },
        uglify: {
            web:{
                files: {
                    'js/gen-build.js': ['js/score_parser.js', 'js/schema_parser.js', 'coffee/musical.js', 'coffee/*.js', 'js/gen.js', 'js/viewer.js', 'js/keyboard.js']
                }
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-pug');
    grunt.loadNpmTasks('grunt-jison');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.registerTask('default', ['jison:score', 'jison:schema']);
    grunt.registerTask('web', ['pug:web', 'uglify:web']);
    grunt.registerTask('app', ['pug:app']);

}