// Konfigurasi semua game Kejar yang didukung
window.KEJAR_GAMES = {
  toeic: [
    {
      slug: 'toeic_reading_preparation',
      label: 'TOEIC Reading Preparations',
      tagline: 'Latihan reading TOEIC',
      img: 'assets/kejar/toeic-reading.png'
    },
    {
      slug: 'toeicwords',
      label: 'TOEIC Words',
      tagline: 'Latihan kosakata TOEIC',
      img: 'assets/kejar/toeic-words.png'
    }
  ],
  matrikulasi: [
    {
      slug: 'obr',
      label: 'Operasi Bilangan Riil',
      tagline: 'Latihan bilangan riil',
      img: 'assets/kejar/obr.png'
    },
    {
      slug: 'katabaku',
      label: 'Kata Baku',
      tagline: 'Latihan kata baku bahasa Indonesia',
      img: 'assets/kejar/katabaku.png'
    },
    {
      slug: 'vocabulary',
      label: 'Vocabulary',
      tagline: 'Latihan kosakata bahasa Inggris',
      img: 'assets/kejar/vocabulary.png'
    },
    {
      slug: 'menulisefektif',
      label: 'Menulis Efektif',
      tagline: 'Latihan menulis kalimat efektif',
      img: 'assets/kejar/menulis-efektif.png'
    }
  ]
};

// Helper: cari game dari slug
window.findKejarGame = function (slug) {
  const all = [...(window.KEJAR_GAMES.toeic || []), ...(window.KEJAR_GAMES.matrikulasi || [])];
  return all.find(g => g.slug === slug) || null;
};