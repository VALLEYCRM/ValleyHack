module.exports = function(grunt) {

  grunt.initConfig({
  pkg: grunt.file.readJSON('package.json'),

  shell: {
    addAndDeploy: {
      command: mess => ['git add .', 'git commit -m' + mess, 'git push salty master -f'].join('&&')
    },
  },
});



  grunt.loadNpmTasks('grunt-shell');


  grunt.registerTask('testGrunt', () => {
    console.log('testing grunt!');
  })


}

