export type NewsItem = {
  title: string;
  excerpt: string;
  date: string;
  category: string;
  image: string;
};

export const news: NewsItem[] = [
  {
    title: "Próximo Jogo: Ericeirense vs Mafra B",
    excerpt:
      "Grande jogo em perspectiva para o próximo fim de semana. A equipa está preparada para mais uma batalha em casa.",
    date: "15 Jan 2026",
    category: "Jogos",
    image:
      "https://images.unsplash.com/photo-1564833592193-3270b5618e7f?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Novo Reforço para a Época",
    excerpt:
      "O Ericeirense anuncia a contratação de um novo jogador para reforçar o plantel na segunda metade da temporada.",
    date: "10 Jan 2026",
    category: "Transferências",
    image:
      "https://images.unsplash.com/photo-1549923015-badf41b04831?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Treinos Intensivos no Complexo",
    excerpt:
      "A equipa técnica preparou sessões intensivas de treino para melhorar a forma física dos jogadores.",
    date: "10 Jan 2026",
    category: "Treinos",
    image:
      "https://images.unsplash.com/photo-1598044220037-fdfa316dca5a?auto=format&fit=crop&w=1200&q=80",
  },
];