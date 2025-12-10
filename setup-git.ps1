# Git Installation and Repository Setup Script
# Run this script AFTER installing Git

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Staff Scheduling - Git Setup" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if Git is installed
try {
    $gitVersion = git --version
    Write-Host "✓ Git is installed: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Git is not installed yet!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Git first:" -ForegroundColor Yellow
    Write-Host "1. Check your Downloads folder for Git installer" -ForegroundColor Yellow
    Write-Host "2. Run the installer with default settings" -ForegroundColor Yellow
    Write-Host "3. Restart PowerShell" -ForegroundColor Yellow
    Write-Host "4. Run this script again" -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "Setting up Git repository..." -ForegroundColor Cyan

# Navigate to project directory
$projectDir = "c:\Users\ebelf\Downloads\staff-scheduling-main\staff-scheduling-main"
Set-Location $projectDir

# Initialize Git repository
Write-Host "Initializing Git repository..." -ForegroundColor Yellow
git init

# Configure Git (update with your details)
Write-Host ""
Write-Host "Configuring Git..." -ForegroundColor Yellow
$userName = Read-Host "Enter your name for Git commits"
$userEmail = Read-Host "Enter your email for Git commits"

git config user.name "$userName"
git config user.email "$userEmail"

# Create .gitignore
Write-Host ""
Write-Host "Creating .gitignore..." -ForegroundColor Yellow
@"
# Dependencies
node_modules/
package-lock.json

# Environment variables
.env
.env.local
.env.production

# Build outputs
dist/
build/

# Logs
*.log
npm-debug.log*

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Old backend (not needed for Netlify)
backend/database.db
backend/.env

# Netlify
.netlify/
"@ | Out-File -FilePath ".gitignore" -Encoding UTF8

# Add all files
Write-Host "Adding files to Git..." -ForegroundColor Yellow
git add .

# Commit
Write-Host "Creating initial commit..." -ForegroundColor Yellow
git commit -m "Initial commit - Netlify serverless version"

Write-Host ""
Write-Host "==================================" -ForegroundColor Green
Write-Host "✓ Git repository setup complete!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Create a GitHub repository:" -ForegroundColor Yellow
Write-Host "   - Go to https://github.com/new" -ForegroundColor White
Write-Host "   - Name: staff-scheduling-netlify" -ForegroundColor White
Write-Host "   - DO NOT initialize with README" -ForegroundColor White
Write-Host ""
Write-Host "2. Push to GitHub:" -ForegroundColor Yellow
Write-Host "   Run these commands (replace YOUR_USERNAME):" -ForegroundColor White
Write-Host ""
Write-Host "   git remote add origin https://github.com/YOUR_USERNAME/staff-scheduling-netlify.git" -ForegroundColor Magenta
Write-Host "   git branch -M main" -ForegroundColor Magenta
Write-Host "   git push -u origin main" -ForegroundColor Magenta
Write-Host ""
Write-Host "3. Set up Supabase:" -ForegroundColor Yellow
Write-Host "   - Go to https://supabase.com" -ForegroundColor White
Write-Host "   - Create account and new project" -ForegroundColor White
Write-Host "   - Run the SQL schema from README.md" -ForegroundColor White
Write-Host "   - Get SUPABASE_URL and SUPABASE_KEY" -ForegroundColor White
Write-Host ""
Write-Host "4. Deploy to Netlify:" -ForegroundColor Yellow
Write-Host "   - Go to https://netlify.com" -ForegroundColor White
Write-Host "   - Import from GitHub" -ForegroundColor White
Write-Host "   - Add environment variables" -ForegroundColor White
Write-Host ""
Write-Host "See DEPLOYMENT_STEPS.md for detailed instructions" -ForegroundColor Cyan
