# ⬡ AUTISTA: O LAUDO

**RPG de Storytelling Neurodivergente Brasileiro**

Site oficial do RPG AUTISTA: O LAUDO — um jogo de narrativa colaborativa criado por e para pessoas neurodivergentes. Explore histórias de autoconhecimento, apoio mútuo e identidade através de mecânicas pensadas para cérebros que funcionam de formas diferentes.

[![GitHub Pages](https://img.shields.io/badge/deploy-GitHub%20Pages-blue)](https://bmsrk.github.io/autistaolaudo)
[![Licença CC BY 4.0](https://img.shields.io/badge/licença-CC%20BY%204.0-green)](https://creativecommons.org/licenses/by/4.0/)

---

## 📁 Estrutura de Pastas

```
/
├── index.html            ← Página inicial com hero e botões
├── regras.html           ← Manual completo de regras
├── ficha.html            ← Criador de ficha interativo + export PDF
├── assets/
│   ├── css/
│   │   └── style.css     ← Estilos globais (modo escuro/claro, design system)
│   └── js/
│       ├── main.js       ← Scripts compartilhados (tema, navbar, colapsíveis)
│       └── ficha.js      ← Lógica do criador de ficha e geração de PDF
└── README.md
```

---

## ✨ Funcionalidades

- **Página Inicial** — Hero com título, subtítulo empoderador e 3 botões principais
- **Manual de Regras** — Regras completas com navegação lateral, seções colapsíveis e tabelas
- **Criador de Ficha Interativo:**
  - Formulário completo com todos os campos (nome, idade, nível de suporte, laudo, 6 atributos, interesses especiais, forças, fraquezas, habilidades especiais, barra de sobrecarga, inventário, história)
  - Preview em tempo real da ficha ao lado do formulário
  - **Geração de PDF** com layout bonito e profissional (via jsPDF CDN)
  - Auto-salvamento no `localStorage`
- **Modo escuro/claro** com preferência salva
- Design totalmente responsivo
- Acessível (contraste alto, fontes legíveis, ARIA, navegação por teclado)

---

## 🚀 Como Rodar Localmente

Não precisa de servidor! Basta abrir os arquivos HTML diretamente no navegador:

```bash
# Clone o repositório
git clone https://github.com/bmsrk/autistaolaudo.git
cd autistaolaudo

# Abra no navegador (exemplo no Linux/Mac)
open index.html

# Ou use um servidor local simples (recomendado para evitar erros de CORS)
npx serve .
# ou
python3 -m http.server 8080
```

Acesse: `http://localhost:8080` (ou `http://localhost:3000` com `npx serve`)

---

## 🌐 Deploy no GitHub Pages

### Método 1 — Interface Web (mais fácil)

1. Acesse o repositório no GitHub
2. Vá em **Settings** → **Pages**
3. Em **Source**, selecione `Deploy from a branch`
4. Em **Branch**, selecione `main` e pasta `/ (root)`
5. Clique em **Save**
6. Aguarde ~2 minutos e acesse: `https://SEU_USUARIO.github.io/autistaolaudo`

### Método 2 — GitHub Actions (automático)

Adicione um arquivo `.github/workflows/pages.yml`:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
      - id: deployment
        uses: actions/deploy-pages@v4
```

---

## 🤝 Contribuindo

1. Fork o repositório
2. Crie uma branch (`git checkout -b feature/nova-regra`)
3. Faça suas alterações
4. Commit (`git commit -m 'Adiciona nova regra de...'`)
5. Push (`git push origin feature/nova-regra`)
6. Abra um Pull Request

### O que contribuir?

- 📖 Novas regras, expansões ou cenários
- 🎨 Melhorias de design e acessibilidade
- 🌍 Traduções
- 🐛 Correções de bugs
- ♿ Melhorias de acessibilidade

---

## 📜 Licença

Este trabalho está licenciado sob [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/).

Você pode compartilhar, adaptar e criar a partir deste material, para qualquer finalidade, desde que dê o crédito adequado.

---

## 💙 Créditos

Criado com amor e neurodivergência no Brasil. 🇧🇷

> "Nenhum tipo de mente é inferior. Nenhuma forma de processar o mundo é errada."
