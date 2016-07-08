
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
        concat: {
            options: {
                separator: ';'
            },
            dist: {
                src: ['coffee/musical.js', 'coffee/*.js', 'js/gen.js'],
                dest: 'js/gen-build.js'
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-jade');
    //grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.registerTask('default', ['jade:app']);
    grunt.registerTask('web', ['jade:web', 'concat']);
    grunt.registerTask('app', ['jade:app']);
}