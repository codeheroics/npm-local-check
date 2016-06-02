const { exec } = require('child_process')
const semver = require('semver')
const cmd = 'npm list --depth 0 --json'

let packageDependencies

try {
  const { dependencies, devDependencies } = require('./package.json')
  packageDependencies = Object.assign({}, dependencies, devDependencies)
} catch (err) {
  if (err instanceof SyntaxError) {
    console.error('SyntaxError. Is your package.json correctly formed?')
    process.exit(1)
  }
  if (err.message === 'Cannot find module \'./package.json\'') {
    console.error(`No package.json was found in ${process.cwd()}`)
    process.exit(1)
  }
  throw err
}
// Swallow error, which is sent if there is anything wrong with npm list
// (including stderr on extraneous packages, which we'll handle)
exec(cmd, (err, stdout) => { // eslint-disable-line handle-callback-err
  const { dependencies: installedDependencies } = JSON.parse(stdout)

  Object.keys(installedDependencies).forEach(dependency => {
    const { missing, version: installedDependencyVersion } = installedDependencies[dependency]
    const packageRequestedVersion = packageDependencies[dependency]
    if (!packageRequestedVersion) return console.log(dependency, 'is extraneous')
    if (missing) return console.log(dependency, 'needs to be installed')
    if (!semver.satisfies(installedDependencyVersion, packageRequestedVersion)) {
      console.log(dependency, 'needs an update from', installedDependencyVersion, 'to', packageRequestedVersion)
    }
  })
})
