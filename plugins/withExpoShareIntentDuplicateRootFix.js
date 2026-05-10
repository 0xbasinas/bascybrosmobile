const { withDangerousMod } = require("@expo/config-plugins")
const fs = require("fs")
const path = require("path")

const PATCH_SENTINEL = "// [bascybros] patched: skip isTaskRoot activity relaunch (duplicate ClerkProvider)"

/**
 * expo-share-intent's Android handleShareIntent() relaunches MainActivity when
 * !activity.isTaskRoot. That can overlap two activities briefly, mounting two
 * React roots in one JS runtime and triggering @clerk/expo's duplicate
 * ClerkProvider guard. We rely on android:launchMode singleTask + onNewIntent instead.
 */
function withExpoShareIntentDuplicateRootFix(config) {
  return withDangerousMod(config, [
    "android",
    async (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot
      const ktPath = path.join(
        projectRoot,
        "node_modules",
        "expo-share-intent",
        "android",
        "src",
        "main",
        "java",
        "expo",
        "modules",
        "shareintent",
        "ExpoShareIntentModule.kt",
      )

      if (!fs.existsSync(ktPath)) {
        console.warn(
          "[withExpoShareIntentDuplicateRootFix] ExpoShareIntentModule.kt missing; skipping.",
        )
        return cfg
      }

      let src = fs.readFileSync(ktPath, "utf8")
      if (src.includes(PATCH_SENTINEL)) {
        return cfg
      }

      const block =
        "            if (activity != null && !activity.isTaskRoot) {\n" +
        "                val newIntent = Intent(intent).apply {\n" +
        "                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)\n" +
        "                }\n" +
        "                activity.startActivity(newIntent)\n" +
        "                activity.finish()\n" +
        "                return\n" +
        "            }\n"

      if (!src.includes(block)) {
        console.warn(
          "[withExpoShareIntentDuplicateRootFix] Expected Kotlin block not found; skipping.",
        )
        return cfg
      }

      const replacement = `            ${PATCH_SENTINEL}\n`

      fs.writeFileSync(ktPath, src.replace(block, replacement), "utf8")
      return cfg
    },
  ])
}

module.exports = withExpoShareIntentDuplicateRootFix
