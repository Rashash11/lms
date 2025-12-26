$ErrorActionPreference = "Continue"
npm run dev 2>&1 | Tee-Object -FilePath "dev-output.txt"
