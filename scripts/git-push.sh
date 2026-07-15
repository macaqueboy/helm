#!/bin/bash
set -e
cd /home/hermes/projects/helm

# Asegurar .gitignore excluye .next y node_modules
cat > .gitignore << 'EOF'
node_modules/
.next/
.env
*.db
*.sqlite
*.log
.DS_Store
EOF

# Inicializar git si no existe
if [ ! -d .git ]; then
  git init
  git config user.email "pablo@macaqueboy.com"
  git config user.name "Pablo"
fi

# Agregar todo (excluyendo .gitignore patterns)
git add .

# Commit con mensaje
git commit -m "Initial: Helm brutalist platform (nextjs15 + drizzle + brutalist design)" || true

# Remote origin
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/macaqueboy/helm.git

# Push con token desde .env
GH_TOKEN=$(grep GH_TOKEN /home/hermes/.hermes/.env | cut -d= -f2)
git push -f https://macaqueboy:${GH_TOKEN}@github.com/macaqueboy/helm.git HEAD:main

echo "✓ Push exitoso a github.com/macaqueboy/helm"