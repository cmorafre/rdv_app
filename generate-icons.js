// Script simples para gerar ícones PNG a partir do SVG base
const fs = require('fs');
const path = require('path');

// Tamanhos necessários para PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Ler o SVG base
const svgContent = fs.readFileSync('./public/icons/icon-base.svg', 'utf8');

// Para cada tamanho, criar um SVG específico e depois converter
sizes.forEach(size => {
  // Ajustar o SVG para o tamanho específico
  const adjustedSvg = svgContent
    .replace('width="512"', `width="${size}"`)
    .replace('height="512"', `height="${size}"`);
  
  // Salvar SVG temporário
  const tempSvgPath = `./public/icons/temp-${size}.svg`;
  fs.writeFileSync(tempSvgPath, adjustedSvg);
  
  console.log(`✅ Gerado ícone para ${size}x${size}px`);
});

console.log('\n🎉 Todos os ícones foram preparados!');
console.log('📝 Para converter para PNG, use uma ferramenta online como:');
console.log('   - https://convertio.co/svg-png/');
console.log('   - https://cloudconvert.com/svg-to-png');
console.log('\n📁 Arquivos SVG criados em: ./public/icons/');