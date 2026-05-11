const { withMainActivity } = require("@expo/config-plugins")

const MARKER = "Share intent: relaunch when not task root"
const MARKER_FULL = `${MARKER} (super.onCreate required)`

/**
 * Chrome, Google app, and some other hosts open the share target activity inside
 * their own task. Relaunch into our own task (see facebook/react-native#39553).
 *
 * Android requires super.onCreate() before onCreate returns (SuperNotCalledException).
 *
 * expo-splash-screen injects SplashScreenManager before the *first* occurrence of
 * super.onCreate(null) in MainActivity. The redirect branch must not use
 * super.onCreate(null) or splash code is inserted inside the if block. Use
 * super.onCreate(savedInstanceState) there only.
 */
function withAndroidShareTaskRoot(config) {
  return withMainActivity(config, (config) => {
    let src = config.modResults.contents

    if (!src.includes("import android.content.Intent")) {
      src = src.replace(
        /import android\.os\.Build/,
        "import android.content.Intent\nimport android.os.Build",
      )
    }

    // Upgrade: v1 used finish()+return without super (SuperNotCalledException)
    if (src.includes(MARKER) && !src.includes(MARKER_FULL)) {
      src = src.replace(
        /\/\/ Share intent: relaunch when not task root\n/,
        `// ${MARKER_FULL}\n`,
      )
    }
    // Upgrade: v2 used super.onCreate(null) in redirect (breaks expo-splash-screen merge)
    if (
      src.includes(MARKER_FULL) &&
      /if \(!isTaskRoot\) \{[^}]*super\.onCreate\(null\)/s.test(src)
    ) {
      src = src.replace(
        /(if \(!isTaskRoot\) \{[\s\S]*?)super\.onCreate\(null\)/,
        "$1super.onCreate(savedInstanceState)",
      )
      config.modResults.contents = src
      return config
    }

    if (src.includes(MARKER_FULL)) {
      return config
    }

    const anchor = "override fun onCreate(savedInstanceState: Bundle?) {"
    const anchorIdx = src.indexOf(anchor)
    if (anchorIdx === -1) {
      return config
    }
    const insertAt = src.indexOf("\n", anchorIdx + anchor.length) + 1
    if (insertAt === 0) {
      return config
    }

    const block = `    // ${MARKER_FULL}
    if (!isTaskRoot) {
      val newIntent = Intent(intent)
      newIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
      startActivity(newIntent)
      super.onCreate(savedInstanceState)
      finish()
      return
    }

`

    config.modResults.contents = src.slice(0, insertAt) + block + src.slice(insertAt)
    return config
  })
}

module.exports = withAndroidShareTaskRoot
