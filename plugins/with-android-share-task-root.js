const { withMainActivity } = require("@expo/config-plugins")

const MARKER = "Share intent: relaunch when not task root"

/**
 * Chrome, Google app, and some other hosts open the share target activity inside
 * their own task. That can spawn a second React instance while one is already
 * running, which trips Clerk's single-ClerkProvider guard and breaks Expo Router
 * linking. Relaunch into our own task (see facebook/react-native#39553).
 */
function withAndroidShareTaskRoot(config) {
  return withMainActivity(config, (config) => {
    let src = config.modResults.contents
    if (src.includes(MARKER)) {
      return config
    }

    if (!src.includes("import android.content.Intent")) {
      src = src.replace(
        /import android\.os\.Build/,
        "import android.content.Intent\nimport android.os.Build",
      )
    }

    src = src.replace(
      /override fun onCreate\(savedInstanceState: Bundle\?\) \{\s*\n/,
      `override fun onCreate(savedInstanceState: Bundle?) {
    // ${MARKER}
    if (!isTaskRoot) {
      val newIntent = Intent(intent)
      newIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
      startActivity(newIntent)
      finish()
      return
    }

`,
    )

    config.modResults.contents = src
    return config
  })
}

module.exports = withAndroidShareTaskRoot
