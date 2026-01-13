const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo config plugin to fix Gradle repository timeout issues
 * by adding fallback repositories to build.gradle and settings.gradle
 */
const withGradleRepositories = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.platformProjectRoot;
      const buildGradlePath = path.join(projectRoot, 'build.gradle');
      const settingsGradlePath = path.join(projectRoot, 'settings.gradle');
      const gradlePropsPath = path.join(projectRoot, 'gradle.properties');

      // Update build.gradle to add fallback repositories
      if (fs.existsSync(buildGradlePath)) {
        let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');

        // Add fallback repositories to buildscript repositories
        if (buildGradle.includes('buildscript')) {
          // Check if fallback repos are already added
          if (!buildGradle.includes('repo1.maven.org/maven2')) {
            // Add fallback repositories after existing repositories in buildscript
            const fallbackRepos = `        // Fallback repositories for EAS Build timeout issues
        maven {
            url "https://repo1.maven.org/maven2"
        }
        maven {
            url "https://oss.jfrog.org/artifactory/oss-snapshot-local"
        }
        maven {
            url "https://jfrog.io/artifactory/libs-release"
        }`;

            // Insert fallback repos before the closing brace of repositories block in buildscript
            buildGradle = buildGradle.replace(
              /(buildscript\s*\{[^}]*repositories\s*\{[^}]*)(\})/s,
              `$1${fallbackRepos}\n    $2`
            );
          }
        }

        // Add fallback repositories to allprojects repositories
        if (buildGradle.includes('allprojects')) {
          if (!buildGradle.includes('repo1.maven.org/maven2') || !buildGradle.match(/allprojects[^}]*repositories[^}]*repo1\.maven\.org/)) {
            const fallbackRepos = `        // Fallback repositories for EAS Build timeout issues
        maven {
            url "https://repo1.maven.org/maven2"
        }
        maven {
            url "https://oss.jfrog.org/artifactory/oss-snapshot-local"
        }
        maven {
            url "https://jfrog.io/artifactory/libs-release"
        }`;

            // Insert fallback repos in allprojects repositories block
            buildGradle = buildGradle.replace(
              /(allprojects\s*\{[^}]*repositories\s*\{[^}]*)(\})/s,
              `$1${fallbackRepos}\n    $2`
            );
          }
        }

        fs.writeFileSync(buildGradlePath, buildGradle, 'utf8');
      }

      // Update settings.gradle to configure plugin management repositories
      if (fs.existsSync(settingsGradlePath)) {
        let settingsGradle = fs.readFileSync(settingsGradlePath, 'utf8');

        // Add pluginManagement block if it doesn't exist
        if (!settingsGradle.includes('pluginManagement')) {
          const pluginManagementBlock = `
pluginManagement {
    repositories {
        google()
        mavenCentral()
        // Fallback repositories for EAS Build timeout issues
        maven {
            url "https://repo1.maven.org/maven2"
        }
        maven {
            url "https://oss.jfrog.org/artifactory/oss-snapshot-local"
        }
        maven {
            url "https://jfrog.io/artifactory/libs-release"
        }
        gradlePluginPortal()
    }
}
`;
          settingsGradle = pluginManagementBlock + settingsGradle;
        } else {
          // Add fallback repos to existing pluginManagement
          if (!settingsGradle.includes('repo1.maven.org/maven2') || !settingsGradle.match(/pluginManagement[^}]*repositories[^}]*repo1\.maven\.org/)) {
            const fallbackRepos = `        // Fallback repositories for EAS Build timeout issues
        maven {
            url "https://repo1.maven.org/maven2"
        }
        maven {
            url "https://oss.jfrog.org/artifactory/oss-snapshot-local"
        }
        maven {
            url "https://jfrog.io/artifactory/libs-release"
        }`;

            settingsGradle = settingsGradle.replace(
              /(pluginManagement\s*\{[^}]*repositories\s*\{[^}]*)(\})/s,
              `$1${fallbackRepos}\n    $2`
            );
          }
        }

        fs.writeFileSync(settingsGradlePath, settingsGradle, 'utf8');
      }

      // Update gradle.properties to add timeout settings
      if (fs.existsSync(gradlePropsPath)) {
        let gradleProps = fs.readFileSync(gradlePropsPath, 'utf8');

        // Add timeout settings if not already present
        if (!gradleProps.includes('systemProp.http.connectionTimeout')) {
          gradleProps += '\n\n# Increase timeout for network operations (fixes EAS Build timeout issues)\n';
          gradleProps += 'systemProp.http.connectionTimeout=60000\n';
          gradleProps += 'systemProp.http.socketTimeout=60000\n';
          gradleProps += 'org.gradle.internal.http.connectionTimeout=60000\n';
          gradleProps += 'org.gradle.internal.http.socketTimeout=60000\n';

          fs.writeFileSync(gradlePropsPath, gradleProps, 'utf8');
        }
      }

      return config;
    },
  ]);
};

module.exports = withGradleRepositories;

