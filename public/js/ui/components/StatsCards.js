export default function StatsCards(stats = { users: 0, projects: 0, companies: 0 }) {
  console.log('Renderizando StatsCards con:', stats);
  const container = document.createElement('div');
  container.className = 'grid grid-cols-1 md:grid-cols-3 gap-4';

  const cards = [
    { title: 'Usuarios', value: stats.users, icon: '👤' },
    { title: 'Proyectos', value: stats.projects, icon: '📁' },
    { title: 'Empresas', value: stats.companies, icon: '🏢' }
  ];

  cards.forEach(card => {
    console.log(`Creando tarjeta: ${card.title}`);
    const cardEl = document.createElement('div');
    cardEl.className = 'card p-4 rounded-lg text-center animate-fade-in';
    cardEl.innerHTML = `
      <div class="text-4xl mb-2">${card.icon}</div>
      <h3 class="text-xl font-semibold">${card.title}</h3>
      <p class="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">${card.value}</p>
    `;
    container.appendChild(cardEl);
  });

  return container;
}