'use strict';

const execSync = require('child_process').execSync;
const pkg = require('../package');
const fs = require('fs');
const semver = require('semver');

module.exports = function(grunt) {
  grunt.registerTask('bump', 'Bumps the package version, updates the changelog, makes a tag commit', releaseType => {
    const curVersion = pkg.version;
    const nextVersion = semver.inc(curVersion, releaseType);
    if (!nextVersion) {
      grunt.fail.fatal('Invalid release type: ' + releaseType);
    }

    // Update the changelog
    const repoUrl = pkg.repository.url;
    const getCommitLog = `git --no-pager log v${curVersion}... --pretty=format:"+ %s ([view](${repoUrl}/commit/%H))"`;
    const commitLog = execSync(getCommitLog);
    const changes = commitLog.replace(/^\+ Merge.*[\r\n]*/gm, ''); // Filter out merge commits
    const date = new Date().toISOString().slice(0, 10);
    const versionHeader = '## ' + nextVersion + ' (' + date + ')\n';
    var changelog = fs.readFileSync('CHANGELOG.md', 'utf8');
    if (changelog.indexOf(versionHeader, 13) >= 0) {
      grunt.log.warn('Changelog already updated.');
      return;
    }
    changelog = '# CHANGELOG\n\n' +
                versionHeader + changes + '\n' +
                changelog.replace(/^# CHANGELOG\s+/, '\n');
    fs.writeFileSync('CHANGELOG.md', changelog);
    grunt.log.ok('Added changes to the changelog.');
    execSync('git commit -am "Update CHANGELOG"');
    grunt.log.ok('Committed the changelog.');

    // Update package version
    const stdout = execSync(`npm version ${releaseType} -m "v%s"`);
    grunt.log.ok('Updated package version and created tagged commit:\n' + stdout);
  });
};