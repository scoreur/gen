
module.exports = function(grunt){
    grunt.initConfig({
        jade: {
            options: {
                client: false,
                pretty: true
            },
            app: {
                src: 'view/index.jade',
                dest: './app.html',
                options:{
                    data: grunt.file.readJSON('view/scripts_app.json')
                }
            },
            web: {
                src: 'view/index.jade',
                dest: './index.html',
                options:{
                    data: grunt.file.readJSON('view/scripts_web.json')
                }
            }
        },
        jison: {
            options: { moduleType: "commonjs" },
            compile: {
                files: [{src: 'js/parser.jison', dest: 'js/parser.js'}]
            }

        },
        concat: {
            options: {
                separator: ';'
            },
            dist: {
                src: ['coffee/musical.js', 'js/parser.js', 'coffee/*.js', 'js/gen.js', 'js/viewer.js', 'js/keyboard.js'],
                dest: 'js/gen-build.js'
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-jade');
    grunt.loadNpmTasks('grunt-jison');
    //grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.registerTask('default', ['jade:app', 'jison']);
    grunt.registerTask('web', ['jade:web', 'concat']);
    grunt.registerTask('app', ['jade:app']);

}