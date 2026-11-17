LOCO 'n' DRIVE 3D - repo (Hinglish)

REPO ROOT ME ye sab hota hai (is zip me sab hai, sirf assets/assets_lite ko chhodkar):
  index.html race.js tablet.js touch.js controller.html sw.js logo.png   game code
  lib/ sounds/                                                         chhoti files (zip me hain)
  package.json capacitor.config.json apk-native/ resources/             APK ke liye
  .gitignore  .github/workflows/build-apk.yml                          dot-files (zip me hain)

TUMHE KHUD DAALNA HAI: apne purane road21 se assets/ aur assets_lite/ folder (paanchon banned .glb hata ke:
bmw golf mustang idbuzz tanker). Ye heavy hain, isliye zip me nahi.

STEPS:
1) GitHub repo banao, ye saari files (dot-files ko Add file > Create new file se naam .gitignore aur
   .github/workflows/build-apk.yml likh kar text paste karo) + assets, assets_lite upload karo.
2) Cloudflare Pages me repo connect: build command khali, output directory "/".
3) GitHub repo > Settings > Secrets and variables > Actions > Variables > SITE_URL = https://tumhari-site.pages.dev
4) Actions > Build APK > Run workflow > Artifacts se loco-n-drive-apk download.
Pehli APK build untested hai, error aaye to log bhej dena.
