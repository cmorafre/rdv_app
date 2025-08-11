const fs = require('fs');

// Criar um ícone PNG simples usando dados base64
// Este é um ícone 72x72 simples com fundo azul e texto RDV
const createSimpleIcon = (size) => {
  // Canvas simples com fundo gradiente azul e texto RDV
  const canvas = `
  <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#3b82f6"/>
        <stop offset="100%" style="stop-color:#1e293b"/>
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" rx="${size * 0.125}" fill="url(#bg)"/>
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" 
          fill="white" font-family="Arial, sans-serif" font-size="${size * 0.25}" font-weight="bold">
      RDV
    </text>
    <circle cx="${size * 0.75}" cy="${size * 0.75}" r="${size * 0.08}" fill="#16a34a"/>
  </svg>`;
  
  return canvas;
};

// Tamanhos necessários
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Gerar ícones SVG que funcionarão como PNG temporariamente
sizes.forEach(size => {
  const iconSvg = createSimpleIcon(size);
  fs.writeFileSync(`./public/icons/icon-${size}x${size}.png`, iconSvg);
  console.log(`✅ Criado ícone ${size}x${size}`);
});

console.log('\n🎉 Ícones placeholder criados com sucesso!');
console.log('📱 O PWA já pode ser testado, mesmo com ícones temporários');