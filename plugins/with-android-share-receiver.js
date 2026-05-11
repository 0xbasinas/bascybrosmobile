const fs = require("fs/promises")
const path = require("path")
const { AndroidConfig, withAndroidManifest, withDangerousMod, withMainActivity } = require("@expo/config-plugins")

const SHARE_RECEIVER_ACTIVITY = ".ShareReceiverActivity"
const MAIN_ACTIVITY_MARKER = "Share intent: persist forwarded intent"

function ensureIntentImport(src) {
  if (src.includes("import android.content.Intent")) {
    return src
  }

  if (src.includes("import android.os.Bundle")) {
    return src.replace(
      "import android.os.Bundle",
      "import android.content.Intent\nimport android.os.Bundle",
    )
  }

  return src.replace(/package [^\n]+\n+/, (match) => `${match}import android.content.Intent\n`)
}

function addShareReceiverActivity(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest)
    const activities = application.activity ?? []
    const mainActivity = activities.find((activity) => {
      const name = activity.$["android:name"]
      return name === ".MainActivity" || name?.endsWith(".MainActivity")
    })
    if (mainActivity) {
      mainActivity.$["android:launchMode"] = "singleTask"
    }
    const existing = activities.find((activity) => {
      const name = activity.$["android:name"]
      return name === SHARE_RECEIVER_ACTIVITY || name?.endsWith(".ShareReceiverActivity")
    })

    if (!existing) {
      activities.push({
        $: {
          "android:name": SHARE_RECEIVER_ACTIVITY,
          "android:exported": "true",
          "android:noHistory": "true",
          "android:excludeFromRecents": "true",
          "android:theme": "@android:style/Theme.Translucent.NoTitleBar",
        },
        "intent-filter": [
          {
            action: [{ $: { "android:name": "android.intent.action.SEND" } }],
            category: [{ $: { "android:name": "android.intent.category.DEFAULT" } }],
            data: [{ $: { "android:mimeType": "text/*" } }],
          },
        ],
      })
    }

    application.activity = activities
    return config
  })
}

function addMainActivityIntentPersistence(config) {
  return withMainActivity(config, (config) => {
    let src = ensureIntentImport(config.modResults.contents)

    if (src.includes(MAIN_ACTIVITY_MARKER)) {
      config.modResults.contents = src
      return config
    }

    const onNewIntentSignature = "override fun onNewIntent(intent: Intent) {"

    if (src.includes(onNewIntentSignature)) {
      if (src.includes("setIntent(intent)")) {
        config.modResults.contents = src
        return config
      }

      src = src.replace(
        /override fun onNewIntent\(intent: Intent\) \{\n(\s+)super\.onNewIntent\(intent\)\n/,
        `override fun onNewIntent(intent: Intent) {\n$1super.onNewIntent(intent)\n$1// ${MAIN_ACTIVITY_MARKER}\n$1setIntent(intent)\n`,
      )
      config.modResults.contents = src
      return config
    }

    const classEnd = src.lastIndexOf("\n}")
    if (classEnd === -1) {
      config.modResults.contents = src
      return config
    }

    const block = `
  // ${MAIN_ACTIVITY_MARKER}
  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
  }
`

    config.modResults.contents = src.slice(0, classEnd) + block + src.slice(classEnd)
    return config
  })
}

function addShareReceiverSource(config) {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const pkg = config.android?.package ?? AndroidConfig.Package.getPackage(config)
      if (!pkg) {
        throw new Error("Android package is required to generate ShareReceiverActivity")
      }

      const sourceDir = path.join(
        config.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "java",
        ...pkg.split("."),
      )

      await fs.mkdir(sourceDir, { recursive: true })
      await fs.writeFile(
        path.join(sourceDir, "ShareReceiverActivity.kt"),
        `package ${pkg}

import android.app.Activity
import android.content.Intent
import android.os.Bundle

class ShareReceiverActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    val incomingIntent = intent
    if (incomingIntent == null) {
      finish()
      return
    }

    val mainIntent = Intent(this, MainActivity::class.java).apply {
      action = incomingIntent.action
      setDataAndType(incomingIntent.data, incomingIntent.type)
      clipData = incomingIntent.clipData
      incomingIntent.extras?.let { putExtras(it) }
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
      addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
      addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
    }

    startActivity(mainIntent)
    finish()
  }
}
`,
      )

      return config
    },
  ])
}

function withAndroidShareReceiver(config) {
  config = addShareReceiverActivity(config)
  config = addMainActivityIntentPersistence(config)
  config = addShareReceiverSource(config)
  return config
}

module.exports = withAndroidShareReceiver
