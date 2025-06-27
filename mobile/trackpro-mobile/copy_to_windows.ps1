# PowerShell script to copy TrackPro Mobile to Windows
# Run this from PowerShell as Administrator

# Create directory structure
New-Item -ItemType Directory -Path "C:\trackpro-mobile" -Force
Set-Location "C:\trackpro-mobile"

# Copy files from WSL
Write-Host "Copying project files from WSL..."
wsl cp -r /home/aarsen07/trackpro/mobile/trackpro-mobile/. .

# Install dependencies
Write-Host "Installing dependencies..."
npm install

Write-Host "Setup complete! Now run: npx expo start"