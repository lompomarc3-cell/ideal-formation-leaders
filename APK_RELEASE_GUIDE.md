# Guide officiel de génération de l’APK IFL

Ce document est la procédure de référence pour générer une nouvelle version Android de l’application IFL (Flutter + API Next.js), la signer, la vérifier, la publier sur GitHub Releases et mettre à jour la landing page Cloudflare.

> **Objectif :** qu’un nouvel agent puisse reprendre la génération sans rediagnostiquer toute la chaîne Android.

## 1. Architecture du projet

- Application mobile : `flutter/`
- Package Android : `com.ifl.ifl`
- Version Flutter : définie dans `flutter/pubspec.yaml`
- Configuration Android : `flutter/android/app/build.gradle.kts`
- Plugin Android/Kotlin : `flutter/android/settings.gradle.kts`
- Wrapper Gradle : `flutter/android/gradle/wrapper/gradle-wrapper.properties`
- Landing page : `ifl_landing/index.html`
- Workflow reproductible : `.github/workflows/build-apk-v4.yml`
- Release GitHub : dépôt `lompomarc3-cell/ideal-formation-leaders`

## 2. Règle essentielle sur le keystore

Le keystore est la signature de l’application. Pour une mise à jour Android, il faut réutiliser **le même keystore historique**. Ne jamais en générer un nouveau sans autorisation explicite : une nouvelle signature oblige les utilisateurs à désinstaller l’ancienne application avant l’installation.

Le fichier de signature ne doit jamais être commité :

- `flutter/android/app/ifl-keystore.jks`
- `flutter/android/key.properties`

Ces fichiers sont exclus par `.gitignore`. Le keystore de la version v4.0.0 a été créé parce que l’ancien fichier était introuvable. Son empreinte peut être contrôlée localement avec :

```bash
keytool -list -v \
  -keystore flutter/android/app/ifl-keystore.jks \
  -storepass '<mot-de-passe>' | grep SHA256
```

Pour une future version, vérifier d’abord la présence et l’empreinte du keystore avant de penser à en générer un autre.

## 3. Secrets GitHub Actions obligatoires

Le workflow utilise exclusivement des secrets GitHub chiffrés. Les noms attendus sont :

- `ANDROID_KEYSTORE_BASE64` : contenu du fichier JKS encodé en base64
- `ANDROID_STORE_PASSWORD` : mot de passe du keystore
- `ANDROID_KEY_PASSWORD` : mot de passe de la clé
- `ANDROID_KEY_ALIAS` : alias de la clé

Ne jamais écrire leurs valeurs dans Git, dans ce README, dans les logs ou dans le code source. Pour enregistrer ou remplacer le keystore :

```bash
base64 -w0 flutter/android/app/ifl-keystore.jks | \
  gh secret set ANDROID_KEYSTORE_BASE64 --repo lompomarc3-cell/ideal-formation-leaders

gh secret set ANDROID_STORE_PASSWORD --body '<valeur>' \
  --repo lompomarc3-cell/ideal-formation-leaders

gh secret set ANDROID_KEY_PASSWORD --body '<valeur>' \
  --repo lompomarc3-cell/ideal-formation-leaders

gh secret set ANDROID_KEY_ALIAS --body '<valeur>' \
  --repo lompomarc3-cell/ideal-formation-leaders
```

## 4. Pourquoi le build se fait sur GitHub Actions

L’environnement Manus peut être ARM64. Les outils Android téléchargés par Gradle, notamment AAPT2, sont parfois x86_64 et ne peuvent pas s’exécuter sur ARM64. Le build local peut alors échouer avec :

- `Exec format error`
- `AAPT2 ... Syntax error`
- impossibilité d’exécuter un binaire x86_64

La solution validée est le runner GitHub Actions `ubuntu-latest`, qui fournit un environnement x86_64 compatible avec Flutter, Gradle, AGP et AAPT2. Il ne faut pas perdre du temps à réinstaller plusieurs variantes locales si l’erreur indique une incompatibilité d’architecture.

## 5. Versions et configuration validées

La chaîne qui a produit l’APK v4.0.0 fonctionnel utilise :

- Flutter stable `3.50.0`
- Java Temurin `21`
- Gradle `9.5.0`
- Android Gradle Plugin `9.3.1`
- Kotlin Gradle Plugin `2.4.20`
- Android compile SDK `36`
- Java/Kotlin JVM target `17`
- `versionName = "4.0.0"`
- `versionCode = 51`

Le projet utilise la DSL Android compatible Flutter 3.50. Les anciens réglages Java 11 et `kotlinOptions` ont dû être remplacés par :

```kotlin
compileOptions {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}
```

Ne pas rétrograder Gradle/AGP sans vérifier la compatibilité avec la version Flutter configurée.

## 6. Préparer une nouvelle version

Pour une nouvelle version, modifier au minimum :

1. `flutter/pubspec.yaml` : `version: X.Y.Z+CODE`
2. `flutter/android/app/build.gradle.kts` : `versionCode` et `versionName`
3. `ifl_landing/index.html` : version affichée et lien vers l’asset GitHub
4. `.github/workflows/build-apk-v4.yml` : adapter le nom de workflow, le tag, la version attendue dans la vérification et les notes de release si nécessaire

Le workflow actuel contient volontairement des valeurs v4.0.0 (`versionCode 51`, tag `v4.0.0`). Pour une version ultérieure, les occurrences doivent être remplacées ensemble.

## 7. Lancer le build reproductible

Après avoir poussé les changements sur `main`, le workflow est déclenché automatiquement. Il peut aussi être lancé manuellement avec `workflow_dispatch`.

Avec GitHub CLI :

```bash
export GH_TOKEN='<token GitHub fourni par l’utilisateur>'
gh workflow run build-apk-v4.yml \
  --repo lompomarc3-cell/ideal-formation-leaders

gh run list \
  --repo lompomarc3-cell/ideal-formation-leaders \
  --workflow build-apk-v4.yml \
  --limit 1
```

Le workflow exécute :

1. checkout du dépôt ;
2. installation de Java 21 ;
3. installation de Flutter 3.50.0 ;
4. restauration temporaire du keystore depuis les secrets ;
5. `flutter pub get` ;
6. `flutter build apk --release --no-tree-shake-icons` ;
7. vérification de la signature et des métadonnées ;
8. création ou mise à jour de la release GitHub.

## 8. Vérifications obligatoires

Le workflow doit rester en échec si l’une de ces vérifications échoue :

```bash
apksigner verify --verbose app-release.apk
```

Les résultats attendus sont :

- `Verified using v2 scheme ...: true`
- `Verified using v3 scheme ...: true`
- package `com.ifl.ifl`
- `versionCode='CODE'`
- `versionName='X.Y.Z'`

Une installation avec `adb` est utile si un appareil ou un émulateur est disponible. Elle n’était pas possible dans l’environnement ARM64 utilisé pour v4.0.0, mais l’APK a été vérifié par le runner GitHub et testé ensuite par l’utilisateur.

## 9. Publication GitHub Release

La release v4.0.0 est disponible ici :

- [Release IFL v4.0.0](https://github.com/lompomarc3-cell/ideal-formation-leaders/releases/tag/v4.0.0)

L’asset effectivement publié par GitHub Actions est :

```text
app-release.apk
```

Lien de téléchargement utilisé par la landing :

```text
https://github.com/lompomarc3-cell/ideal-formation-leaders/releases/download/v4.0.0/app-release.apk
```

Toujours vérifier le nom réel de l’asset avec :

```bash
gh release view vX.Y.Z \
  --repo lompomarc3-cell/ideal-formation-leaders
```

Puis tester le lien final avec `curl -I -L`. Un lien vers un nom d’asset inexistant renvoie HTTP 404 même si la release existe.

## 10. Mise à jour de la landing page

Modifier `ifl_landing/index.html` pour mettre à jour :

- le texte de version ;
- le message concernant le nouveau keystore, uniquement si la signature a changé ;
- le lien de téléchargement vers le nom réel de l’asset ;
- le nom du fichier téléchargé ;
- la date ou le numéro de release affiché.

Déployer :

```bash
export CLOUDFLARE_API_TOKEN='<token Cloudflare fourni par l’utilisateur>'
export CLOUDFLARE_ACCOUNT_ID='<account ID fourni par l’utilisateur>'
npx wrangler pages deploy ifl_landing \
  --project-name=ifl-landing \
  --branch=main
```

Vérifier ensuite :

```bash
curl -I https://ifl-landing.pages.dev/
curl -I -L \
  https://github.com/lompomarc3-cell/ideal-formation-leaders/releases/download/vX.Y.Z/app-release.apk
```

## 11. Checklist finale

- [ ] Le keystore historique a été recherché et son empreinte contrôlée.
- [ ] Aucun JKS, `key.properties`, mot de passe ou token n’est commité.
- [ ] Les quatre secrets GitHub Actions sont présents.
- [ ] La version Flutter et la version Android correspondent.
- [ ] Le workflow GitHub Actions est déclenché sur le bon commit.
- [ ] Le build distant est `success`.
- [ ] V2 et V3 sont `true`.
- [ ] Le package, le versionCode et le versionName sont corrects.
- [ ] La release GitHub existe et contient l’APK.
- [ ] Le lien de téléchargement réel répond HTTP 200.
- [ ] La landing répond HTTP 200 et pointe vers le bon asset.
- [ ] Le dépôt local est propre et synchronisé avec `origin/main`.

## 12. Dépannage rapide

| Symptôme | Cause probable | Solution |
|---|---|---|
| `flutter: command not found` | PATH incomplet dans un job séparé | Exporter le chemin Flutter dans la même commande ou utiliser GitHub Actions |
| `Gradle version ... lower than Flutter minimum` | Wrapper trop ancien | Aligner le wrapper sur le template Flutter utilisé |
| `AGP version ... lower than Flutter minimum` | Plugin Android trop ancien | Mettre à jour AGP et Kotlin ensemble |
| erreurs `android {}` / `kotlinOptions` deprecated sous AGP 9 | Ancienne DSL Android | Migrer vers `compileOptions` Java 17 et `kotlin.compilerOptions` |
| `JAVA_COMPILER` absent | Runtime Java uniquement | Utiliser un JDK complet avec `javac` |
| `AAPT2 ... Exec format error` | Runner ARM64 avec binaire AAPT2 x86_64 | Construire sur GitHub Actions `ubuntu-latest` |
| release présente mais téléchargement HTTP 404 | Mauvais nom d’asset | Lire `gh release view` et utiliser le nom réellement publié |
| l’ancienne application refuse la mise à jour | Signature différente | Réutiliser le keystore historique ou informer l’utilisateur qu’une désinstallation est nécessaire |

## 13. Sécurité et reprise par un autre agent

Les tokens fournis dans un brief ne doivent jamais être recopiés dans ce fichier. Ils doivent être lus depuis le canal sécurisé de la session et utilisés uniquement pour l’opération demandée. En cas de rotation, mettre à jour les secrets GitHub/Cloudflare concernés sans modifier ce guide avec les valeurs.

La procédure reproductible est conservée dans le dépôt lui-même : ce fichier, le workflow GitHub Actions et les règles `.gitignore` constituent la mémoire opérationnelle du pipeline APK IFL.
