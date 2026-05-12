# Development Setup

## Recommended Local Development Folder

Avoid placing active code under OneDrive to reduce file-locking and sync issues.

Recommended Windows path:

```text
C:\Projects\jr-shelf-life-label-app
```

## Required Software

Install these on the development computer:

- Codex
- Git for Windows
- Node.js LTS
- Android Studio
- GitHub CLI
- 7-Zip
- VS Code, optional

## Verify Installation

Open PowerShell and run:

```powershell
git --version
node --version
npm --version
npx --version
```

After Android Studio is installed:

```powershell
adb version
```

If `adb` is not found, add Android SDK platform-tools to the Windows PATH.

Typical path:

```text
C:\Users\<username>\AppData\Local\Android\Sdk\platform-tools
```

## GitHub Login

Install GitHub CLI:

```powershell
winget install --id GitHub.cli
```

Restart PowerShell, then run:

```powershell
gh auth login
```

Recommended choices:

```text
GitHub.com
HTTPS
Authenticate Git with your GitHub credentials: Yes
Login with a web browser
```

Configure Git user:

```powershell
git config --global user.name "jr-jhshen"
git config --global user.email "your-github-email@example.com"
```

## Clone Repository

```powershell
mkdir C:\Projects
cd C:\Projects
git clone https://github.com/jr-jhshen/jr-shelf-life-label-app.git
cd jr-shelf-life-label-app
```

## Android Phone Setup

On the Oppo Android phone:

1. Enable Developer options
2. Enable USB debugging
3. Connect the phone by USB
4. Accept the USB debugging prompt

Check device connection:

```powershell
adb devices
```

## SDK Handling

Do not commit the full Gprinter SDK package to GitHub at the beginning.

Use a local-only folder if needed:

```text
vendor/gprinter-sdk/
```

Add this to `.gitignore`:

```text
vendor/gprinter-sdk/
```

