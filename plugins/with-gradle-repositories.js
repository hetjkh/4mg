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
            // Add fallback repositories FIRST (before EAS internal repo) for better resolution
            // This ensures public repos are checked before the potentially timing-out EAS repo
            const fallbackRepos = `        // Public repositories (checked first to avoid EAS Artifactory timeout)
        maven {
            url "https://repo1.maven.org/maven2"
        }
        maven {
            url "https://oss.jfrog.org/artifactory/oss-snapshot-local"
        }
        maven {
            url "https://jfrog.io/artifactory/libs-release"
        }`;

            // Insert fallback repos at the BEGINNING of repositories block (after opening brace)
            // This ensures they're checked before EAS internal repository
            buildGradle = buildGradle.replace(
              /(buildscript\s*\{[^}]*repositories\s*\{)/s,
              `$1${fallbackRepos}\n`
            );
          }
        }

        // Add fallback repositories to allprojects repositories
        if (buildGradle.includes('allprojects')) {
          if (!buildGradle.includes('repo1.maven.org/maven2') || !buildGradle.match(/allprojects[^}]*repositories[^}]*repo1\.maven\.org/)) {
            const fallbackRepos = `        // Public repositories (checked first to avoid EAS Artifactory timeout)
        maven {
            url "https://repo1.maven.org/maven2"
        }
        maven {
            url "https://oss.jfrog.org/artifactory/oss-snapshot-local"
        }
        maven {
            url "https://jfrog.io/artifactory/libs-release"
        }`;

            // Insert fallback repos at the BEGINNING of allprojects repositories block
            buildGradle = buildGradle.replace(
              /(allprojects\s*\{[^}]*repositories\s*\{)/s,
              `$1${fallbackRepos}\n`
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
        // Public repositories FIRST (checked before EAS internal repo)
        maven {
            url "https://repo1.maven.org/maven2"
        }
        maven {
            url "https://oss.jfrog.org/artifactory/oss-snapshot-local"
        }
        maven {
            url "https://jfrog.io/artifactory/libs-release"
        }
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
`;
          settingsGradle = pluginManagementBlock + settingsGradle;
        } else {
          // Add fallback repos to existing pluginManagement
          if (!settingsGradle.includes('repo1.maven.org/maven2') || !settingsGradle.match(/pluginManagement[^}]*repositories[^}]*repo1\.maven\.org/)) {
            const fallbackRepos = `        // Public repositories FIRST (checked before EAS internal repo)
        maven {
            url "https://repo1.maven.org/maven2"
        }
        maven {
            url "https://oss.jfrog.org/artifactory/oss-snapshot-local"
        }
        maven {
            url "https://jfrog.io/artifactory/libs-release"
        }`;

            // Insert at the beginning of pluginManagement repositories
            settingsGradle = settingsGradle.replace(
              /(pluginManagement\s*\{[^}]*repositories\s*\{)/s,
              `$1${fallbackRepos}\n`
            );
          }
        }

        fs.writeFileSync(settingsGradlePath, settingsGradle, 'utf8');
      }

      // Update gradle.properties to add timeout settings, retry mechanisms, and worker limits
      if (fs.existsSync(gradlePropsPath)) {
        let gradleProps = fs.readFileSync(gradlePropsPath, 'utf8');

        // Add timeout settings if not already present
        if (!gradleProps.includes('systemProp.http.connectionTimeout')) {
          gradleProps += '\n\n# Fix EAS Build timeout issues - Network and retry configuration\n';
          gradleProps += '# Increase timeout for network operations\n';
          gradleProps += 'systemProp.http.connectionTimeout=60000\n';
          gradleProps += 'systemProp.http.socketTimeout=60000\n';
          gradleProps += 'org.gradle.internal.http.connectionTimeout=60000\n';
          gradleProps += 'org.gradle.internal.http.socketTimeout=60000\n';
          gradleProps += '\n# Retry mechanisms for failed downloads\n';
          gradleProps += 'maven.wagon.http.retryHandler.count=5\n';
          gradleProps += 'maven.wagon.http.readTimeout=60000\n';
          gradleProps += '\n# Limit concurrent workers to reduce network strain\n';
          gradleProps += 'org.gradle.workers.max=4\n';
          gradleProps += '\n# Configure repository resolution order\n';
          gradleProps += 'org.gradle.repository.quality=strict\n';

          fs.writeFileSync(gradlePropsPath, gradleProps, 'utf8');
        } else {
          // Add retry and worker settings even if timeout is already set
          if (!gradleProps.includes('maven.wagon.http.retryHandler.count')) {
            gradleProps += '\n# Retry mechanisms for failed downloads\n';
            gradleProps += 'maven.wagon.http.retryHandler.count=5\n';
            gradleProps += 'maven.wagon.http.readTimeout=60000\n';
          }
          if (!gradleProps.includes('org.gradle.workers.max')) {
            gradleProps += '\n# Limit concurrent workers to reduce network strain\n';
            gradleProps += 'org.gradle.workers.max=4\n';
          }
          fs.writeFileSync(gradlePropsPath, gradleProps, 'utf8');
        }
      }

      return config;
    },
  ]);
};

module.exports = withGradleRepositories;

