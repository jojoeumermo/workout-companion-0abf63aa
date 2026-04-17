export interface FoodItem {
  id: string;
  name: string;
  category: string;
  per100g: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sodium?: number;   // mg
    sugar?: number;    // g
    calcium?: number;  // mg
    iron?: number;     // mg
    vitaminC?: number; // mg
    vitaminD?: number; // mcg
  };
  commonPortions: { label: string; grams: number }[];
}

export const FOOD_CATEGORIES = [
  'Carnes e Aves',
  'Peixes e Frutos do Mar',
  'Ovos e Laticínios',
  'Leguminosas',
  'Cereais e Grãos',
  'Pães e Massas',
  'Frutas',
  'Verduras e Legumes',
  'Oleaginosas',
  'Suplementos',
  'Bebidas',
  'Lanches e Fast Food',
  'Outros',
] as const;

export const FOOD_DATABASE: FoodItem[] = [
  // ═══════════════════════════════════════
  // CARNES E AVES
  // ═══════════════════════════════════════
  { id: 'f001', name: 'Frango Grelhado (peito)', category: 'Carnes e Aves', per100g: { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sodium: 74, iron: 1.0 }, commonPortions: [{ label: 'Porção pequena', grams: 100 }, { label: 'Porção média', grams: 150 }, { label: 'Filé grande', grams: 200 }] },
  { id: 'f002', name: 'Carne Bovina Patinho Cozido', category: 'Carnes e Aves', per100g: { calories: 219, protein: 27, carbs: 0, fat: 12, fiber: 0, sodium: 60, iron: 2.7 }, commonPortions: [{ label: 'Porção', grams: 100 }, { label: 'Bife médio', grams: 150 }] },
  { id: 'f003', name: 'Carne Moída Refogada', category: 'Carnes e Aves', per100g: { calories: 250, protein: 24, carbs: 0, fat: 17, fiber: 0, sodium: 80, iron: 2.5 }, commonPortions: [{ label: 'Porção', grams: 100 }, { label: 'Porção grande', grams: 150 }] },
  { id: 'f004', name: 'Frango Coxinha da Coxa Cozida', category: 'Carnes e Aves', per100g: { calories: 174, protein: 26, carbs: 0, fat: 7.5, fiber: 0, sodium: 80 }, commonPortions: [{ label: 'Coxinha', grams: 80 }, { label: 'Porção', grams: 150 }] },
  { id: 'f005', name: 'Peru (peito)', category: 'Carnes e Aves', per100g: { calories: 135, protein: 30, carbs: 0, fat: 1.5, fiber: 0, sodium: 65 }, commonPortions: [{ label: 'Fatia', grams: 50 }, { label: 'Porção', grams: 100 }] },
  { id: 'f006', name: 'Alcatra Grelhada', category: 'Carnes e Aves', per100g: { calories: 210, protein: 26, carbs: 0, fat: 11, fiber: 0, sodium: 65, iron: 2.5 }, commonPortions: [{ label: 'Bife médio', grams: 130 }, { label: 'Bife grande', grams: 200 }] },
  { id: 'f007', name: 'Filé Mignon Grelhado', category: 'Carnes e Aves', per100g: { calories: 190, protein: 28, carbs: 0, fat: 8, fiber: 0, sodium: 60, iron: 2.2 }, commonPortions: [{ label: 'Bife médio', grams: 130 }] },
  { id: 'f008', name: 'Linguiça Frango Grelhada', category: 'Carnes e Aves', per100g: { calories: 180, protein: 18, carbs: 1, fat: 12, fiber: 0, sodium: 650 }, commonPortions: [{ label: '1 gomo', grams: 80 }] },
  { id: 'f081', name: 'Picanha Grelhada', category: 'Carnes e Aves', per100g: { calories: 223, protein: 24, carbs: 0, fat: 14, fiber: 0, sodium: 65, iron: 2.4 }, commonPortions: [{ label: 'Fatia', grams: 100 }, { label: 'Porção', grams: 150 }] },
  { id: 'f082', name: 'Fraldinha Grelhada', category: 'Carnes e Aves', per100g: { calories: 200, protein: 25, carbs: 0, fat: 11, fiber: 0, sodium: 60 }, commonPortions: [{ label: 'Porção', grams: 130 }] },
  { id: 'f083', name: 'Lombo de Porco Assado', category: 'Carnes e Aves', per100g: { calories: 215, protein: 26, carbs: 0, fat: 12, fiber: 0, sodium: 75 }, commonPortions: [{ label: 'Fatia média', grams: 120 }] },
  { id: 'f084', name: 'Bacon Frito', category: 'Carnes e Aves', per100g: { calories: 541, protein: 37, carbs: 1.4, fat: 42, fiber: 0, sodium: 1580 }, commonPortions: [{ label: '2 fatias', grams: 20 }, { label: 'Porção', grams: 50 }] },
  { id: 'f085', name: 'Frango Desfiado Cozido', category: 'Carnes e Aves', per100g: { calories: 155, protein: 29, carbs: 0, fat: 4, fiber: 0, sodium: 70 }, commonPortions: [{ label: 'Porção', grams: 100 }, { label: 'Porção grande', grams: 150 }] },
  { id: 'f086', name: 'Costela Bovina Assada', category: 'Carnes e Aves', per100g: { calories: 240, protein: 22, carbs: 0, fat: 16, fiber: 0, sodium: 65, iron: 2.8 }, commonPortions: [{ label: 'Porção', grams: 150 }] },
  { id: 'f087', name: 'Presunto Fatiado', category: 'Carnes e Aves', per100g: { calories: 95, protein: 16, carbs: 1, fat: 3, fiber: 0, sodium: 890 }, commonPortions: [{ label: 'Fatia', grams: 20 }, { label: '3 fatias', grams: 60 }] },
  { id: 'f088', name: 'Peito de Peru Defumado', category: 'Carnes e Aves', per100g: { calories: 115, protein: 22, carbs: 2, fat: 2.5, fiber: 0, sodium: 790 }, commonPortions: [{ label: 'Fatia', grams: 20 }, { label: '3 fatias', grams: 60 }] },
  { id: 'f089', name: 'Carne Seca Cozida', category: 'Carnes e Aves', per100g: { calories: 220, protein: 30, carbs: 0, fat: 11, fiber: 0, sodium: 1200, iron: 3.5 }, commonPortions: [{ label: 'Porção', grams: 100 }] },
  { id: 'f090', name: 'Fígado Bovino Frito', category: 'Carnes e Aves', per100g: { calories: 192, protein: 26, carbs: 5, fat: 8, fiber: 0, sodium: 80, iron: 6.8 }, commonPortions: [{ label: 'Fatia', grams: 100 }] },
  { id: 'f091', name: 'Salsicha Cozida', category: 'Carnes e Aves', per100g: { calories: 290, protein: 13, carbs: 3, fat: 26, fiber: 0, sodium: 950 }, commonPortions: [{ label: '1 unidade', grams: 50 }, { label: '2 unidades', grams: 100 }] },
  { id: 'f092', name: 'Sobrecoxa Frango Assada', category: 'Carnes e Aves', per100g: { calories: 218, protein: 23, carbs: 0, fat: 13, fiber: 0, sodium: 80 }, commonPortions: [{ label: '1 sobrecoxa', grams: 120 }] },

  // ═══════════════════════════════════════
  // PEIXES E FRUTOS DO MAR
  // ═══════════════════════════════════════
  { id: 'f009', name: 'Tilápia Grelhada', category: 'Peixes e Frutos do Mar', per100g: { calories: 96, protein: 20, carbs: 0, fat: 1.7, fiber: 0, sodium: 56 }, commonPortions: [{ label: 'Filé pequeno', grams: 100 }, { label: 'Filé grande', grams: 180 }] },
  { id: 'f010', name: 'Atum em Lata (em água)', category: 'Peixes e Frutos do Mar', per100g: { calories: 109, protein: 24, carbs: 0, fat: 1.0, fiber: 0, sodium: 300 }, commonPortions: [{ label: '½ lata', grams: 90 }, { label: 'Lata inteira', grams: 170 }] },
  { id: 'f011', name: 'Salmão Grelhado', category: 'Peixes e Frutos do Mar', per100g: { calories: 208, protein: 20, carbs: 0, fat: 13, fiber: 0, sodium: 59, calcium: 12 }, commonPortions: [{ label: 'Filé médio', grams: 150 }] },
  { id: 'f012', name: 'Sardinha em Lata', category: 'Peixes e Frutos do Mar', per100g: { calories: 208, protein: 25, carbs: 0, fat: 11, fiber: 0, sodium: 505, calcium: 382 }, commonPortions: [{ label: 'Lata', grams: 125 }] },
  { id: 'f013', name: 'Camarão Cozido', category: 'Peixes e Frutos do Mar', per100g: { calories: 99, protein: 24, carbs: 0.2, fat: 0.3, fiber: 0, sodium: 224 }, commonPortions: [{ label: 'Porção', grams: 100 }] },
  { id: 'f093', name: 'Bacalhau Cozido', category: 'Peixes e Frutos do Mar', per100g: { calories: 105, protein: 23, carbs: 0, fat: 0.9, fiber: 0, sodium: 5000 }, commonPortions: [{ label: 'Porção demolhada', grams: 120 }] },
  { id: 'f094', name: 'Merluza Grelhada', category: 'Peixes e Frutos do Mar', per100g: { calories: 90, protein: 18, carbs: 0, fat: 1.5, fiber: 0, sodium: 90 }, commonPortions: [{ label: 'Filé', grams: 130 }] },
  { id: 'f095', name: 'Truta Grelhada', category: 'Peixes e Frutos do Mar', per100g: { calories: 190, protein: 21, carbs: 0, fat: 11, fiber: 0 }, commonPortions: [{ label: 'Filé', grams: 130 }] },
  { id: 'f096', name: 'Lula Grelhada', category: 'Peixes e Frutos do Mar', per100g: { calories: 92, protein: 16, carbs: 3.1, fat: 1.4, fiber: 0, sodium: 300 }, commonPortions: [{ label: 'Porção', grams: 100 }] },
  { id: 'f097', name: 'Polvo Cozido', category: 'Peixes e Frutos do Mar', per100g: { calories: 82, protein: 15, carbs: 2.2, fat: 1.0, fiber: 0, sodium: 230 }, commonPortions: [{ label: 'Porção', grams: 150 }] },
  { id: 'f098', name: 'Atum em Óleo (escorrido)', category: 'Peixes e Frutos do Mar', per100g: { calories: 198, protein: 29, carbs: 0, fat: 9, fiber: 0, sodium: 400 }, commonPortions: [{ label: '½ lata', grams: 90 }] },
  { id: 'f099', name: 'Corvina Grelhada', category: 'Peixes e Frutos do Mar', per100g: { calories: 105, protein: 22, carbs: 0, fat: 2, fiber: 0 }, commonPortions: [{ label: 'Filé', grams: 130 }] },
  { id: 'f100', name: 'Saint Peter Assado', category: 'Peixes e Frutos do Mar', per100g: { calories: 98, protein: 21, carbs: 0, fat: 1.8, fiber: 0 }, commonPortions: [{ label: 'Filé', grams: 150 }] },

  // ═══════════════════════════════════════
  // OVOS E LATICÍNIOS
  // ═══════════════════════════════════════
  { id: 'f014', name: 'Ovo Inteiro Cozido', category: 'Ovos e Laticínios', per100g: { calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, sodium: 124, calcium: 50 }, commonPortions: [{ label: '1 ovo médio', grams: 50 }, { label: '2 ovos', grams: 100 }, { label: '3 ovos', grams: 150 }] },
  { id: 'f015', name: 'Clara de Ovo', category: 'Ovos e Laticínios', per100g: { calories: 52, protein: 11, carbs: 0.7, fat: 0.2, fiber: 0, sodium: 166 }, commonPortions: [{ label: '1 clara', grams: 33 }, { label: '3 claras', grams: 100 }] },
  { id: 'f016', name: 'Queijo Minas Frescal', category: 'Ovos e Laticínios', per100g: { calories: 264, protein: 17, carbs: 3, fat: 20, fiber: 0, sodium: 380, calcium: 500 }, commonPortions: [{ label: 'Fatia', grams: 30 }, { label: 'Porção', grams: 60 }] },
  { id: 'f017', name: 'Queijo Cottage', category: 'Ovos e Laticínios', per100g: { calories: 98, protein: 11, carbs: 3.4, fat: 4.3, fiber: 0, sodium: 364, calcium: 83 }, commonPortions: [{ label: 'Porção', grams: 100 }, { label: 'Colher grande', grams: 50 }] },
  { id: 'f018', name: 'Iogurte Natural Integral', category: 'Ovos e Laticínios', per100g: { calories: 61, protein: 3.5, carbs: 4.7, fat: 3.3, fiber: 0, sodium: 46, calcium: 121 }, commonPortions: [{ label: 'Pote 170g', grams: 170 }, { label: 'Pote 200g', grams: 200 }] },
  { id: 'f019', name: 'Iogurte Grego Integral', category: 'Ovos e Laticínios', per100g: { calories: 97, protein: 9, carbs: 3.8, fat: 5, fiber: 0, sodium: 36, calcium: 110 }, commonPortions: [{ label: 'Pote 100g', grams: 100 }, { label: 'Pote 150g', grams: 150 }] },
  { id: 'f020', name: 'Leite Integral', category: 'Ovos e Laticínios', per100g: { calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, fiber: 0, sodium: 44, calcium: 113 }, commonPortions: [{ label: 'Copo 200ml', grams: 200 }, { label: 'Copo 250ml', grams: 250 }] },
  { id: 'f021', name: 'Whey Protein (scoop)', category: 'Ovos e Laticínios', per100g: { calories: 380, protein: 80, carbs: 5, fat: 3, fiber: 0, sodium: 150, calcium: 120 }, commonPortions: [{ label: '1 scoop (30g)', grams: 30 }] },
  { id: 'f057', name: 'Omelete (2 ovos)', category: 'Ovos e Laticínios', per100g: { calories: 154, protein: 11, carbs: 0.5, fat: 12, fiber: 0, sodium: 130 }, commonPortions: [{ label: 'Omelete 2 ovos', grams: 120 }] },
  { id: 'f062', name: 'Cream Cheese Light', category: 'Ovos e Laticínios', per100g: { calories: 175, protein: 6, carbs: 4, fat: 15, fiber: 0, sodium: 350, calcium: 95 }, commonPortions: [{ label: '1 col. sopa', grams: 20 }] },
  { id: 'f071', name: 'Queijo Muçarela', category: 'Ovos e Laticínios', per100g: { calories: 280, protein: 22, carbs: 2, fat: 20, fiber: 0, sodium: 620, calcium: 505 }, commonPortions: [{ label: '1 fatia fina', grams: 20 }, { label: 'Porção', grams: 50 }] },
  { id: 'f072', name: 'Requeijão Cremoso', category: 'Ovos e Laticínios', per100g: { calories: 255, protein: 9, carbs: 3, fat: 23, fiber: 0, sodium: 490, calcium: 140 }, commonPortions: [{ label: '1 col. sopa', grams: 25 }] },
  { id: 'f101', name: 'Queijo Parmesão Ralado', category: 'Ovos e Laticínios', per100g: { calories: 420, protein: 36, carbs: 3.2, fat: 29, fiber: 0, sodium: 1500, calcium: 1109 }, commonPortions: [{ label: '1 col. sopa', grams: 10 }, { label: 'Porção', grams: 30 }] },
  { id: 'f102', name: 'Queijo Cheddar', category: 'Ovos e Laticínios', per100g: { calories: 404, protein: 23, carbs: 1.3, fat: 33, fiber: 0, sodium: 620, calcium: 750 }, commonPortions: [{ label: 'Fatia', grams: 20 }, { label: 'Porção', grams: 40 }] },
  { id: 'f103', name: 'Queijo Ricota', category: 'Ovos e Laticínios', per100g: { calories: 174, protein: 11, carbs: 3, fat: 13, fiber: 0, sodium: 84, calcium: 207 }, commonPortions: [{ label: 'Porção', grams: 80 }] },
  { id: 'f104', name: 'Iogurte Desnatado Natural', category: 'Ovos e Laticínios', per100g: { calories: 35, protein: 3.4, carbs: 4.7, fat: 0.1, fiber: 0, sodium: 46, calcium: 121 }, commonPortions: [{ label: 'Pote 170g', grams: 170 }] },
  { id: 'f105', name: 'Leite Desnatado', category: 'Ovos e Laticínios', per100g: { calories: 36, protein: 3.4, carbs: 5.1, fat: 0.1, fiber: 0, sodium: 44, calcium: 124 }, commonPortions: [{ label: 'Copo 200ml', grams: 200 }] },
  { id: 'f106', name: 'Bebida de Amêndoa', category: 'Ovos e Laticínios', per100g: { calories: 17, protein: 0.6, carbs: 2.2, fat: 1.0, fiber: 0.3, sodium: 65, calcium: 180 }, commonPortions: [{ label: 'Copo 200ml', grams: 200 }] },
  { id: 'f107', name: 'Leite de Coco (caixinha)', category: 'Ovos e Laticínios', per100g: { calories: 215, protein: 2.2, carbs: 3.3, fat: 22, fiber: 0 }, commonPortions: [{ label: '2 col. sopa', grams: 30 }, { label: 'Porção', grams: 100 }] },

  // ═══════════════════════════════════════
  // LEGUMINOSAS
  // ═══════════════════════════════════════
  { id: 'f022', name: 'Feijão Carioca Cozido', category: 'Leguminosas', per100g: { calories: 77, protein: 4.8, carbs: 14, fat: 0.5, fiber: 8.5, sodium: 2, iron: 2.0, calcium: 27 }, commonPortions: [{ label: 'Concha pequena', grams: 80 }, { label: 'Concha média', grams: 130 }, { label: 'Concha grande', grams: 180 }] },
  { id: 'f023', name: 'Feijão Preto Cozido', category: 'Leguminosas', per100g: { calories: 77, protein: 5, carbs: 14, fat: 0.5, fiber: 8.7, sodium: 2, iron: 2.1 }, commonPortions: [{ label: 'Concha', grams: 130 }] },
  { id: 'f024', name: 'Lentilha Cozida', category: 'Leguminosas', per100g: { calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 7.9, iron: 3.3, calcium: 19 }, commonPortions: [{ label: 'Porção', grams: 100 }] },
  { id: 'f025', name: 'Grão-de-Bico Cozido', category: 'Leguminosas', per100g: { calories: 164, protein: 8.9, carbs: 27, fat: 2.6, fiber: 7.6, sodium: 7, iron: 2.9, calcium: 49 }, commonPortions: [{ label: 'Porção', grams: 100 }] },
  { id: 'f068', name: 'Proteína Vegetal de Soja (PTS)', category: 'Leguminosas', per100g: { calories: 332, protein: 52, carbs: 36, fat: 1, fiber: 4, sodium: 10, iron: 9.7 }, commonPortions: [{ label: 'Porção hidratada', grams: 100 }] },
  { id: 'f108', name: 'Feijão Branco Cozido', category: 'Leguminosas', per100g: { calories: 139, protein: 9.7, carbs: 25, fat: 0.5, fiber: 6.3, iron: 3.7, calcium: 90 }, commonPortions: [{ label: 'Porção', grams: 100 }] },
  { id: 'f109', name: 'Edamame Cozido', category: 'Leguminosas', per100g: { calories: 122, protein: 11, carbs: 10, fat: 5, fiber: 5.2, sodium: 4, calcium: 63, iron: 2.3, vitaminC: 6.1 }, commonPortions: [{ label: 'Porção', grams: 100 }, { label: 'Xícara', grams: 155 }] },
  { id: 'f110', name: 'Tofu Firme', category: 'Leguminosas', per100g: { calories: 76, protein: 8, carbs: 1.9, fat: 4.2, fiber: 0.3, sodium: 7, calcium: 350, iron: 2.7 }, commonPortions: [{ label: 'Fatia', grams: 80 }, { label: 'Porção', grams: 150 }] },
  { id: 'f111', name: 'Ervilha Verde Cozida', category: 'Leguminosas', per100g: { calories: 84, protein: 5.4, carbs: 15, fat: 0.4, fiber: 5.1, sodium: 3, vitaminC: 14, iron: 1.5 }, commonPortions: [{ label: 'Porção', grams: 80 }, { label: 'Xícara', grams: 160 }] },
  { id: 'f112', name: 'Feijão Fradinho Cozido', category: 'Leguminosas', per100g: { calories: 116, protein: 8, carbs: 21, fat: 0.4, fiber: 6, iron: 2.5 }, commonPortions: [{ label: 'Porção', grams: 100 }] },

  // ═══════════════════════════════════════
  // CEREAIS E GRÃOS
  // ═══════════════════════════════════════
  { id: 'f026', name: 'Arroz Branco Cozido', category: 'Cereais e Grãos', per100g: { calories: 128, protein: 2.5, carbs: 28, fat: 0.2, fiber: 0.2, sodium: 1 }, commonPortions: [{ label: 'Colher de servir', grams: 80 }, { label: 'Porção média (2 col)', grams: 160 }, { label: 'Porção grande (3 col)', grams: 240 }] },
  { id: 'f027', name: 'Arroz Integral Cozido', category: 'Cereais e Grãos', per100g: { calories: 124, protein: 2.6, carbs: 25.8, fat: 1.0, fiber: 2.7, sodium: 5 }, commonPortions: [{ label: 'Colher de servir', grams: 80 }, { label: 'Porção média', grams: 160 }] },
  { id: 'f028', name: 'Aveia em Flocos', category: 'Cereais e Grãos', per100g: { calories: 394, protein: 14, carbs: 67, fat: 8.5, fiber: 9.1, sodium: 2, iron: 4.7, calcium: 54 }, commonPortions: [{ label: '3 col. sopa', grams: 30 }, { label: '5 col. sopa', grams: 50 }] },
  { id: 'f029', name: 'Batata Doce Cozida', category: 'Cereais e Grãos', per100g: { calories: 86, protein: 1.6, carbs: 20, fat: 0.1, fiber: 3.0, sodium: 55, vitaminC: 19.6 }, commonPortions: [{ label: 'Unidade pequena', grams: 100 }, { label: 'Unidade média', grams: 150 }, { label: 'Unidade grande', grams: 200 }] },
  { id: 'f030', name: 'Batata Inglesa Cozida', category: 'Cereais e Grãos', per100g: { calories: 86, protein: 1.7, carbs: 19.7, fat: 0.1, fiber: 1.8, sodium: 6, vitaminC: 13 }, commonPortions: [{ label: 'Unidade média', grams: 130 }] },
  { id: 'f043', name: 'Arroz Branco + Feijão (prato)', category: 'Cereais e Grãos', per100g: { calories: 109, protein: 4.0, carbs: 22, fat: 0.4, fiber: 2.5 }, commonPortions: [{ label: 'Prato simples', grams: 250 }] },
  { id: 'f056', name: 'Arroz de Forno / Risoto', category: 'Cereais e Grãos', per100g: { calories: 150, protein: 4, carbs: 28, fat: 3.5, fiber: 0.5 }, commonPortions: [{ label: 'Porção', grams: 180 }] },
  { id: 'f063', name: 'Granola', category: 'Cereais e Grãos', per100g: { calories: 471, protein: 9, carbs: 64, fat: 21, fiber: 5.3, sodium: 15 }, commonPortions: [{ label: '3 col. sopa', grams: 40 }] },
  { id: 'f070', name: 'Cuscuz Cozido', category: 'Cereais e Grãos', per100g: { calories: 112, protein: 3.8, carbs: 24, fat: 0.2, fiber: 1.4 }, commonPortions: [{ label: 'Porção', grams: 150 }] },
  { id: 'f080', name: 'Quinoa Cozida', category: 'Cereais e Grãos', per100g: { calories: 120, protein: 4.4, carbs: 22, fat: 2, fiber: 2.8, iron: 1.5, calcium: 17 }, commonPortions: [{ label: 'Porção', grams: 100 }, { label: 'Porção grande', grams: 150 }] },
  { id: 'f113', name: 'Macarrão Integral Cozido', category: 'Cereais e Grãos', per100g: { calories: 124, protein: 5, carbs: 26, fat: 0.7, fiber: 3.2 }, commonPortions: [{ label: 'Porção pequena', grams: 100 }, { label: 'Porção média', grams: 160 }] },
  { id: 'f114', name: 'Mandioca / Aipim Cozido', category: 'Cereais e Grãos', per100g: { calories: 125, protein: 1.0, carbs: 30, fat: 0.3, fiber: 1.8, sodium: 10 }, commonPortions: [{ label: 'Porção', grams: 100 }, { label: 'Pedaço grande', grams: 200 }] },
  { id: 'f115', name: 'Fubá de Milho (cozido/polenta)', category: 'Cereais e Grãos', per100g: { calories: 100, protein: 2.5, carbs: 22, fat: 0.5, fiber: 1.4 }, commonPortions: [{ label: 'Porção', grams: 150 }] },
  { id: 'f116', name: 'Inhame Cozido', category: 'Cereais e Grãos', per100g: { calories: 118, protein: 1.5, carbs: 28, fat: 0.1, fiber: 4.1, vitaminC: 17 }, commonPortions: [{ label: 'Porção', grams: 100 }] },
  { id: 'f117', name: 'Pipoca Caseira (sem manteiga)', category: 'Cereais e Grãos', per100g: { calories: 382, protein: 12, carbs: 78, fat: 4.5, fiber: 14.5, sodium: 8 }, commonPortions: [{ label: 'Xícara (15g)', grams: 15 }, { label: 'Porção grande', grams: 30 }] },

  // ═══════════════════════════════════════
  // PÃES E MASSAS
  // ═══════════════════════════════════════
  { id: 'f031', name: 'Macarrão Cozido', category: 'Pães e Massas', per100g: { calories: 131, protein: 4.5, carbs: 26, fat: 1.1, fiber: 1.8 }, commonPortions: [{ label: 'Porção pequena', grams: 100 }, { label: 'Porção média', grams: 150 }, { label: 'Porção grande', grams: 220 }] },
  { id: 'f032', name: 'Pão Francês', category: 'Pães e Massas', per100g: { calories: 300, protein: 8, carbs: 58, fat: 3.1, fiber: 2.3, sodium: 480 }, commonPortions: [{ label: '1 unidade', grams: 50 }] },
  { id: 'f033', name: 'Pão Integral', category: 'Pães e Massas', per100g: { calories: 243, protein: 9, carbs: 44, fat: 3.0, fiber: 6.9, sodium: 390 }, commonPortions: [{ label: '1 fatia', grams: 25 }, { label: '2 fatias', grams: 50 }] },
  { id: 'f034', name: 'Tapioca', category: 'Pães e Massas', per100g: { calories: 357, protein: 0.5, carbs: 88, fat: 0.1, fiber: 0.1 }, commonPortions: [{ label: '1 tapioca média', grams: 50 }] },
  { id: 'f074', name: 'Pão de Queijo', category: 'Pães e Massas', per100g: { calories: 315, protein: 8, carbs: 47, fat: 11, fiber: 0.5, sodium: 290 }, commonPortions: [{ label: '1 unidade pequena', grams: 30 }, { label: '1 unidade grande', grams: 60 }] },
  { id: 'f060', name: 'Pizza (fatia média)', category: 'Pães e Massas', per100g: { calories: 266, protein: 11, carbs: 33, fat: 10, fiber: 1.5, sodium: 600 }, commonPortions: [{ label: '1 fatia', grams: 100 }, { label: '2 fatias', grams: 200 }] },
  { id: 'f118', name: 'Wrap / Tortilha de Trigo', category: 'Pães e Massas', per100g: { calories: 306, protein: 8, carbs: 53, fat: 7, fiber: 3.5, sodium: 600 }, commonPortions: [{ label: '1 unidade', grams: 40 }] },
  { id: 'f119', name: 'Pão de Forma Integral', category: 'Pães e Massas', per100g: { calories: 247, protein: 10, carbs: 44, fat: 3.5, fiber: 7.5, sodium: 430 }, commonPortions: [{ label: '1 fatia', grams: 24 }, { label: '2 fatias', grams: 48 }] },
  { id: 'f120', name: 'Lasanha Bolonhesa (pronta)', category: 'Pães e Massas', per100g: { calories: 140, protein: 7, carbs: 16, fat: 5, fiber: 1.2, sodium: 350 }, commonPortions: [{ label: 'Porção', grams: 250 }] },
  { id: 'f121', name: 'Crepioca (tapioca + ovo)', category: 'Pães e Massas', per100g: { calories: 190, protein: 8, carbs: 30, fat: 5, fiber: 0.2 }, commonPortions: [{ label: '1 unidade', grams: 60 }] },

  // ═══════════════════════════════════════
  // FRUTAS
  // ═══════════════════════════════════════
  { id: 'f035', name: 'Banana Nanica', category: 'Frutas', per100g: { calories: 92, protein: 1.3, carbs: 23, fat: 0.1, fiber: 1.9, sodium: 1, vitaminC: 8.7 }, commonPortions: [{ label: 'Unidade pequena', grams: 80 }, { label: 'Unidade média', grams: 100 }, { label: 'Unidade grande', grams: 130 }] },
  { id: 'f036', name: 'Maçã', category: 'Frutas', per100g: { calories: 56, protein: 0.3, carbs: 15, fat: 0.1, fiber: 1.3, vitaminC: 5.7 }, commonPortions: [{ label: 'Unidade', grams: 150 }] },
  { id: 'f037', name: 'Mamão Papaia', category: 'Frutas', per100g: { calories: 40, protein: 0.5, carbs: 10, fat: 0.1, fiber: 1.8, vitaminC: 61.8 }, commonPortions: [{ label: 'Fatia média', grams: 200 }] },
  { id: 'f038', name: 'Manga', category: 'Frutas', per100g: { calories: 65, protein: 0.5, carbs: 17, fat: 0.3, fiber: 1.8, vitaminC: 36.4 }, commonPortions: [{ label: '½ unidade', grams: 150 }] },
  { id: 'f039', name: 'Laranja', category: 'Frutas', per100g: { calories: 47, protein: 0.9, carbs: 12, fat: 0.1, fiber: 2.4, vitaminC: 53.2 }, commonPortions: [{ label: 'Unidade', grams: 130 }] },
  { id: 'f040', name: 'Uva', category: 'Frutas', per100g: { calories: 69, protein: 0.6, carbs: 18, fat: 0.2, fiber: 0.9, vitaminC: 10.8 }, commonPortions: [{ label: '1 cacho pequeno', grams: 100 }] },
  { id: 'f041', name: 'Morango', category: 'Frutas', per100g: { calories: 33, protein: 0.7, carbs: 7.7, fat: 0.3, fiber: 2.0, vitaminC: 58.8 }, commonPortions: [{ label: '5 unidades', grams: 70 }, { label: 'Xícara', grams: 150 }] },
  { id: 'f042', name: 'Abacate', category: 'Frutas', per100g: { calories: 160, protein: 2, carbs: 9, fat: 14.7, fiber: 6.7, sodium: 7, vitaminC: 10 }, commonPortions: [{ label: '½ unidade', grams: 70 }] },
  { id: 'f075', name: 'Açaí com Granola (tigela)', category: 'Frutas', per100g: { calories: 150, protein: 2.5, carbs: 22, fat: 7, fiber: 3 }, commonPortions: [{ label: 'Tigela 300g', grams: 300 }] },
  { id: 'f122', name: 'Melancia', category: 'Frutas', per100g: { calories: 30, protein: 0.6, carbs: 7.6, fat: 0.2, fiber: 0.4, vitaminC: 8.1 }, commonPortions: [{ label: 'Fatia', grams: 250 }] },
  { id: 'f123', name: 'Melão', category: 'Frutas', per100g: { calories: 34, protein: 0.8, carbs: 8.2, fat: 0.1, fiber: 0.9, vitaminC: 36.7 }, commonPortions: [{ label: 'Fatia', grams: 200 }] },
  { id: 'f124', name: 'Abacaxi', category: 'Frutas', per100g: { calories: 50, protein: 0.5, carbs: 13.1, fat: 0.1, fiber: 1.4, vitaminC: 47.8 }, commonPortions: [{ label: 'Fatia', grams: 80 }, { label: 'Xícara picado', grams: 165 }] },
  { id: 'f125', name: 'Pera', category: 'Frutas', per100g: { calories: 57, protein: 0.4, carbs: 15, fat: 0.1, fiber: 3.1, vitaminC: 4.3 }, commonPortions: [{ label: 'Unidade', grams: 150 }] },
  { id: 'f126', name: 'Kiwi', category: 'Frutas', per100g: { calories: 61, protein: 1.1, carbs: 15, fat: 0.5, fiber: 3.0, vitaminC: 92.7 }, commonPortions: [{ label: '1 unidade', grams: 70 }] },
  { id: 'f127', name: 'Goiaba', category: 'Frutas', per100g: { calories: 68, protein: 2.6, carbs: 14, fat: 1.0, fiber: 5.4, vitaminC: 228.3 }, commonPortions: [{ label: '1 unidade', grams: 80 }] },
  { id: 'f128', name: 'Tangerina / Mexerica', category: 'Frutas', per100g: { calories: 53, protein: 0.8, carbs: 13, fat: 0.3, fiber: 1.7, vitaminC: 26.7 }, commonPortions: [{ label: '1 unidade', grams: 100 }] },
  { id: 'f129', name: 'Mirtilo / Blueberry', category: 'Frutas', per100g: { calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3, fiber: 2.4, vitaminC: 9.7 }, commonPortions: [{ label: 'Xícara', grams: 148 }] },
  { id: 'f130', name: 'Limão (suco)', category: 'Frutas', per100g: { calories: 22, protein: 0.4, carbs: 7, fat: 0.2, fiber: 0.3, vitaminC: 38.7 }, commonPortions: [{ label: '1 limão (suco)', grams: 50 }] },

  // ═══════════════════════════════════════
  // VERDURAS E LEGUMES
  // ═══════════════════════════════════════
  { id: 'f044', name: 'Brócolis Cozido', category: 'Verduras e Legumes', per100g: { calories: 35, protein: 2.4, carbs: 7.2, fat: 0.4, fiber: 2.6, sodium: 41, vitaminC: 64.9, calcium: 47 }, commonPortions: [{ label: 'Porção', grams: 100 }, { label: 'Prato cheio', grams: 200 }] },
  { id: 'f045', name: 'Espinafre Refogado', category: 'Verduras e Legumes', per100g: { calories: 27, protein: 2.9, carbs: 1.4, fat: 0.8, fiber: 2.1, sodium: 50, iron: 2.7, calcium: 136, vitaminC: 28 }, commonPortions: [{ label: 'Porção', grams: 100 }] },
  { id: 'f046', name: 'Cenoura Cozida', category: 'Verduras e Legumes', per100g: { calories: 35, protein: 0.8, carbs: 8.2, fat: 0.2, fiber: 3.0, vitaminC: 3.6 }, commonPortions: [{ label: 'Unidade', grams: 60 }, { label: 'Porção', grams: 100 }] },
  { id: 'f047', name: 'Alface', category: 'Verduras e Legumes', per100g: { calories: 11, protein: 1.3, carbs: 1.5, fat: 0.3, fiber: 1.4, vitaminC: 9.2, calcium: 18 }, commonPortions: [{ label: 'Folhas (porção)', grams: 50 }] },
  { id: 'f048', name: 'Tomate', category: 'Verduras e Legumes', per100g: { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, sodium: 5, vitaminC: 13.7 }, commonPortions: [{ label: '1 unidade média', grams: 100 }] },
  { id: 'f049', name: 'Abobrinha Cozida', category: 'Verduras e Legumes', per100g: { calories: 17, protein: 1.2, carbs: 3.6, fat: 0.1, fiber: 1.1, vitaminC: 17.9 }, commonPortions: [{ label: 'Porção', grams: 100 }] },
  { id: 'f050', name: 'Pepino', category: 'Verduras e Legumes', per100g: { calories: 16, protein: 0.7, carbs: 3.6, fat: 0.1, fiber: 0.5, vitaminC: 2.8 }, commonPortions: [{ label: '½ unidade', grams: 100 }] },
  { id: 'f058', name: 'Salada Verde Simples', category: 'Verduras e Legumes', per100g: { calories: 20, protein: 1.5, carbs: 3, fat: 0.3, fiber: 1.8 }, commonPortions: [{ label: 'Prato de salada', grams: 100 }, { label: 'Prato grande', grams: 180 }] },
  { id: 'f059', name: 'Sopa de Legumes', category: 'Verduras e Legumes', per100g: { calories: 35, protein: 1.5, carbs: 7, fat: 0.5, fiber: 1.5 }, commonPortions: [{ label: 'Tigela', grams: 300 }] },
  { id: 'f069', name: 'Milho Verde Cozido', category: 'Verduras e Legumes', per100g: { calories: 86, protein: 3.2, carbs: 19, fat: 1.2, fiber: 2.9, sodium: 15, vitaminC: 6.8 }, commonPortions: [{ label: 'Espiga', grams: 120 }, { label: 'Porção', grams: 100 }] },
  { id: 'f131', name: 'Couve Refogada', category: 'Verduras e Legumes', per100g: { calories: 50, protein: 2.7, carbs: 7.5, fat: 1.3, fiber: 3.7, sodium: 30, vitaminC: 120, calcium: 135, iron: 1.7 }, commonPortions: [{ label: 'Porção', grams: 60 }] },
  { id: 'f132', name: 'Berinjela Assada', category: 'Verduras e Legumes', per100g: { calories: 33, protein: 0.8, carbs: 8.1, fat: 0.2, fiber: 3.4, vitaminC: 2.2 }, commonPortions: [{ label: 'Porção', grams: 100 }] },
  { id: 'f133', name: 'Beterraba Cozida', category: 'Verduras e Legumes', per100g: { calories: 44, protein: 1.7, carbs: 9.9, fat: 0.2, fiber: 2.8, sodium: 77, vitaminC: 3.6 }, commonPortions: [{ label: 'Fatia', grams: 40 }, { label: 'Porção', grams: 100 }] },
  { id: 'f134', name: 'Couve-flor Cozida', category: 'Verduras e Legumes', per100g: { calories: 23, protein: 1.8, carbs: 4.1, fat: 0.5, fiber: 2.0, vitaminC: 48.2 }, commonPortions: [{ label: 'Porção', grams: 100 }] },
  { id: 'f135', name: 'Pimentão Vermelho', category: 'Verduras e Legumes', per100g: { calories: 31, protein: 1.0, carbs: 6.0, fat: 0.3, fiber: 2.1, vitaminC: 127.7 }, commonPortions: [{ label: '½ unidade', grams: 70 }] },
  { id: 'f136', name: 'Cebola', category: 'Verduras e Legumes', per100g: { calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7, vitaminC: 7.4 }, commonPortions: [{ label: '½ unidade', grams: 55 }] },
  { id: 'f137', name: 'Chuchu Cozido', category: 'Verduras e Legumes', per100g: { calories: 24, protein: 0.9, carbs: 5.6, fat: 0.2, fiber: 1.7, vitaminC: 7.7 }, commonPortions: [{ label: 'Porção', grams: 100 }] },
  { id: 'f138', name: 'Batata Baroa / Mandioquinha', category: 'Verduras e Legumes', per100g: { calories: 96, protein: 1.5, carbs: 23, fat: 0.2, fiber: 2.0, vitaminC: 20.2 }, commonPortions: [{ label: 'Unidade', grams: 100 }] },
  { id: 'f139', name: 'Quiabo Cozido', category: 'Verduras e Legumes', per100g: { calories: 33, protein: 2.0, carbs: 7.5, fat: 0.2, fiber: 3.2, vitaminC: 23, calcium: 82 }, commonPortions: [{ label: 'Porção', grams: 80 }] },

  // ═══════════════════════════════════════
  // OLEAGINOSAS
  // ═══════════════════════════════════════
  { id: 'f051', name: 'Amendoim Tostado', category: 'Oleaginosas', per100g: { calories: 567, protein: 25, carbs: 16, fat: 49, fiber: 8.5, sodium: 6 }, commonPortions: [{ label: '1 colher sopa', grams: 15 }, { label: 'Punhado', grams: 30 }] },
  { id: 'f052', name: 'Castanha-do-Pará', category: 'Oleaginosas', per100g: { calories: 659, protein: 14, carbs: 12, fat: 67, fiber: 7.5, sodium: 3 }, commonPortions: [{ label: '1 unidade', grams: 5 }, { label: '3 unidades', grams: 15 }] },
  { id: 'f053', name: 'Pasta de Amendoim Integral', category: 'Oleaginosas', per100g: { calories: 589, protein: 25, carbs: 20, fat: 50, fiber: 6, sodium: 5 }, commonPortions: [{ label: '1 col. sopa', grams: 15 }, { label: '2 col. sopa', grams: 30 }] },
  { id: 'f054', name: 'Amêndoas', category: 'Oleaginosas', per100g: { calories: 579, protein: 21, carbs: 22, fat: 50, fiber: 12.5, sodium: 1, calcium: 264 }, commonPortions: [{ label: '10 unidades', grams: 15 }, { label: 'Porção', grams: 28 }] },
  { id: 'f140', name: 'Nozes', category: 'Oleaginosas', per100g: { calories: 654, protein: 15, carbs: 14, fat: 65, fiber: 6.7, sodium: 2 }, commonPortions: [{ label: '4 metades', grams: 20 }, { label: 'Porção', grams: 30 }] },
  { id: 'f141', name: 'Pistache Tostado (sem sal)', category: 'Oleaginosas', per100g: { calories: 562, protein: 20, carbs: 28, fat: 45, fiber: 10.3, sodium: 1 }, commonPortions: [{ label: 'Porção', grams: 28 }] },
  { id: 'f142', name: 'Castanha de Caju Tostada', category: 'Oleaginosas', per100g: { calories: 553, protein: 18, carbs: 33, fat: 44, fiber: 3.3, sodium: 12 }, commonPortions: [{ label: 'Porção', grams: 28 }] },
  { id: 'f143', name: 'Avelã', category: 'Oleaginosas', per100g: { calories: 628, protein: 15, carbs: 17, fat: 61, fiber: 9.7, sodium: 0, calcium: 114 }, commonPortions: [{ label: '10 unidades', grams: 15 }] },
  { id: 'f144', name: 'Tahini / Pasta de Gergelim', category: 'Oleaginosas', per100g: { calories: 595, protein: 17, carbs: 21, fat: 54, fiber: 9.3, sodium: 115, calcium: 420 }, commonPortions: [{ label: '1 col. sopa', grams: 15 }] },
  { id: 'f145', name: 'Semente de Chia', category: 'Oleaginosas', per100g: { calories: 486, protein: 17, carbs: 42, fat: 31, fiber: 34.4, sodium: 16, calcium: 631, iron: 7.7 }, commonPortions: [{ label: '1 col. sopa', grams: 10 }, { label: '2 col. sopa', grams: 20 }] },
  { id: 'f146', name: 'Semente de Linhaça', category: 'Oleaginosas', per100g: { calories: 534, protein: 18, carbs: 29, fat: 42, fiber: 27.3, sodium: 30 }, commonPortions: [{ label: '1 col. sopa', grams: 10 }] },

  // ═══════════════════════════════════════
  // SUPLEMENTOS
  // ═══════════════════════════════════════
  { id: 'f147', name: 'Whey Concentrado (pó)', category: 'Suplementos', per100g: { calories: 380, protein: 75, carbs: 8, fat: 5, fiber: 0, sodium: 150, calcium: 110 }, commonPortions: [{ label: '1 scoop (30g)', grams: 30 }, { label: '1.5 scoop (45g)', grams: 45 }] },
  { id: 'f148', name: 'Whey Isolado (pó)', category: 'Suplementos', per100g: { calories: 368, protein: 88, carbs: 2, fat: 1, fiber: 0, sodium: 95, calcium: 120 }, commonPortions: [{ label: '1 scoop (30g)', grams: 30 }] },
  { id: 'f149', name: 'Caseína (pó)', category: 'Suplementos', per100g: { calories: 375, protein: 80, carbs: 4, fat: 2.5, fiber: 0, sodium: 200, calcium: 600 }, commonPortions: [{ label: '1 scoop (35g)', grams: 35 }] },
  { id: 'f150', name: 'Maltodextrina', category: 'Suplementos', per100g: { calories: 380, protein: 0, carbs: 95, fat: 0, fiber: 0, sodium: 40 }, commonPortions: [{ label: '1 col. sopa (30g)', grams: 30 }] },
  { id: 'f151', name: 'Albumina (pó)', category: 'Suplementos', per100g: { calories: 370, protein: 80, carbs: 3, fat: 1.5, fiber: 0, sodium: 600 }, commonPortions: [{ label: '1 col. sopa (25g)', grams: 25 }] },
  { id: 'f152', name: 'Creatina Monoidratada', category: 'Suplementos', per100g: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }, commonPortions: [{ label: '1 dose (5g)', grams: 5 }] },
  { id: 'f153', name: 'Hipercalórico (pó)', category: 'Suplementos', per100g: { calories: 380, protein: 14, carbs: 74, fat: 4, fiber: 1 }, commonPortions: [{ label: '1 dose (100g)', grams: 100 }] },
  { id: 'f154', name: 'Colágeno Hidrolisado (pó)', category: 'Suplementos', per100g: { calories: 360, protein: 90, carbs: 1, fat: 0, fiber: 0, sodium: 90 }, commonPortions: [{ label: '1 col. sopa (10g)', grams: 10 }] },

  // ═══════════════════════════════════════
  // BEBIDAS
  // ═══════════════════════════════════════
  { id: 'f065', name: 'Café com Leite (200ml)', category: 'Bebidas', per100g: { calories: 20, protein: 1.1, carbs: 1.7, fat: 0.8, fiber: 0 }, commonPortions: [{ label: 'Copo 200ml', grams: 200 }] },
  { id: 'f066', name: 'Suco de Laranja Natural', category: 'Bebidas', per100g: { calories: 45, protein: 0.7, carbs: 10.4, fat: 0.2, fiber: 0.2, vitaminC: 50 }, commonPortions: [{ label: 'Copo 200ml', grams: 200 }] },
  { id: 'f067', name: 'Leite Desnatado (bebida)', category: 'Bebidas', per100g: { calories: 36, protein: 3.4, carbs: 5.1, fat: 0.1, fiber: 0, calcium: 124 }, commonPortions: [{ label: 'Copo 200ml', grams: 200 }] },
  { id: 'f155', name: 'Água de Coco Natural', category: 'Bebidas', per100g: { calories: 19, protein: 0.7, carbs: 3.7, fat: 0.2, fiber: 1.1, sodium: 105 }, commonPortions: [{ label: 'Copo 200ml', grams: 200 }, { label: 'Caixinha 300ml', grams: 300 }] },
  { id: 'f156', name: 'Isotônico Gatorade', category: 'Bebidas', per100g: { calories: 26, protein: 0, carbs: 6.5, fat: 0, fiber: 0, sodium: 46 }, commonPortions: [{ label: 'Garrafa 500ml', grams: 500 }] },
  { id: 'f157', name: 'Refrigerante Cola', category: 'Bebidas', per100g: { calories: 42, protein: 0, carbs: 10.6, fat: 0, fiber: 0, sodium: 10 }, commonPortions: [{ label: 'Lata 350ml', grams: 350 }, { label: 'Garrafa 500ml', grams: 500 }] },
  { id: 'f158', name: 'Refrigerante Diet/Zero', category: 'Bebidas', per100g: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 10 }, commonPortions: [{ label: 'Lata 350ml', grams: 350 }] },
  { id: 'f159', name: 'Cerveja Long Neck', category: 'Bebidas', per100g: { calories: 43, protein: 0.5, carbs: 3.6, fat: 0, fiber: 0 }, commonPortions: [{ label: 'Long Neck 355ml', grams: 355 }] },
  { id: 'f160', name: 'Vinho Tinto (taça)', category: 'Bebidas', per100g: { calories: 85, protein: 0.1, carbs: 2.6, fat: 0, fiber: 0 }, commonPortions: [{ label: 'Taça 150ml', grams: 150 }] },
  { id: 'f161', name: 'Café Puro (sem açúcar)', category: 'Bebidas', per100g: { calories: 2, protein: 0.3, carbs: 0, fat: 0, fiber: 0 }, commonPortions: [{ label: 'Xícara 100ml', grams: 100 }] },

  // ═══════════════════════════════════════
  // LANCHES E FAST FOOD
  // ═══════════════════════════════════════
  { id: 'f162', name: 'X-Burguer Artesanal', category: 'Lanches e Fast Food', per100g: { calories: 280, protein: 14, carbs: 28, fat: 13, fiber: 1.5, sodium: 600 }, commonPortions: [{ label: '1 sanduíche', grams: 200 }] },
  { id: 'f163', name: 'Hambúrguer de Frango Grelhado', category: 'Lanches e Fast Food', per100g: { calories: 200, protein: 18, carbs: 22, fat: 5, fiber: 1.5 }, commonPortions: [{ label: '1 sanduíche', grams: 180 }] },
  { id: 'f164', name: 'Batata Frita (fast food média)', category: 'Lanches e Fast Food', per100g: { calories: 312, protein: 3.4, carbs: 41, fat: 15, fiber: 3.8, sodium: 400 }, commonPortions: [{ label: 'Porção média', grams: 114 }] },
  { id: 'f165', name: 'Nuggets de Frango (10 und)', category: 'Lanches e Fast Food', per100g: { calories: 297, protein: 15, carbs: 18, fat: 19, fiber: 0.8, sodium: 600 }, commonPortions: [{ label: '4 unidades', grams: 74 }, { label: '10 unidades', grams: 185 }] },
  { id: 'f166', name: 'Coxinha de Frango', category: 'Lanches e Fast Food', per100g: { calories: 250, protein: 9, carbs: 28, fat: 12, fiber: 1.0, sodium: 420 }, commonPortions: [{ label: '1 unidade média', grams: 100 }] },
  { id: 'f167', name: 'Pastel de Carne Frito', category: 'Lanches e Fast Food', per100g: { calories: 290, protein: 12, carbs: 30, fat: 14, fiber: 1.0, sodium: 500 }, commonPortions: [{ label: '1 unidade', grams: 100 }] },
  { id: 'f168', name: 'Hot Dog Simples', category: 'Lanches e Fast Food', per100g: { calories: 225, protein: 9, carbs: 26, fat: 10, fiber: 1.0, sodium: 660 }, commonPortions: [{ label: '1 unidade', grams: 150 }] },
  { id: 'f169', name: 'Wrap de Frango Grelhado', category: 'Lanches e Fast Food', per100g: { calories: 185, protein: 16, carbs: 22, fat: 4, fiber: 2.0 }, commonPortions: [{ label: '1 unidade', grams: 200 }] },
  { id: 'f061', name: 'Hambúrguer de Frango', category: 'Lanches e Fast Food', per100g: { calories: 210, protein: 18, carbs: 18, fat: 7, fiber: 1 }, commonPortions: [{ label: '1 hambúrguer', grams: 150 }] },
  { id: 'f170', name: 'Croissant de Queijo e Presunto', category: 'Lanches e Fast Food', per100g: { calories: 330, protein: 10, carbs: 35, fat: 17, fiber: 1.5, sodium: 600 }, commonPortions: [{ label: '1 unidade', grams: 80 }] },

  // ═══════════════════════════════════════
  // OUTROS
  // ═══════════════════════════════════════
  { id: 'f055', name: 'Azeite de Oliva Extra Virgem', category: 'Outros', per100g: { calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0 }, commonPortions: [{ label: '1 col. chá', grams: 5 }, { label: '1 col. sopa', grams: 10 }] },
  { id: 'f064', name: 'Mel', category: 'Outros', per100g: { calories: 304, protein: 0.3, carbs: 82, fat: 0, fiber: 0.2 }, commonPortions: [{ label: '1 col. chá', grams: 7 }, { label: '1 col. sopa', grams: 15 }] },
  { id: 'f076', name: 'Biscoito de Arroz', category: 'Outros', per100g: { calories: 390, protein: 6.5, carbs: 84, fat: 2.8, fiber: 1.0, sodium: 340 }, commonPortions: [{ label: '1 unidade', grams: 8 }, { label: '4 unidades', grams: 30 }] },
  { id: 'f077', name: 'Chocolate 70% Cacau', category: 'Outros', per100g: { calories: 598, protein: 7.8, carbs: 46, fat: 43, fiber: 10.9 }, commonPortions: [{ label: '2 quadradinhos', grams: 20 }] },
  { id: 'f079', name: 'Manteiga', category: 'Outros', per100g: { calories: 717, protein: 0.9, carbs: 0.1, fat: 81, fiber: 0, sodium: 714 }, commonPortions: [{ label: '1 col. chá', grams: 5 }, { label: '1 col. sopa', grams: 10 }] },
  { id: 'f171', name: 'Azeite de Coco (óleo)', category: 'Outros', per100g: { calories: 862, protein: 0, carbs: 0, fat: 100, fiber: 0 }, commonPortions: [{ label: '1 col. chá', grams: 5 }, { label: '1 col. sopa', grams: 10 }] },
  { id: 'f172', name: 'Farinha de Amêndoa', category: 'Outros', per100g: { calories: 571, protein: 21, carbs: 22, fat: 50, fiber: 11, sodium: 1 }, commonPortions: [{ label: '1/4 xícara', grams: 28 }] },
  { id: 'f173', name: 'Cacau em Pó (sem açúcar)', category: 'Outros', per100g: { calories: 228, protein: 20, carbs: 58, fat: 14, fiber: 37, iron: 13.9, calcium: 128 }, commonPortions: [{ label: '1 col. sopa', grams: 7 }, { label: '2 col. sopa', grams: 14 }] },
  { id: 'f174', name: 'Ketchup', category: 'Outros', per100g: { calories: 100, protein: 1.6, carbs: 24, fat: 0.1, fiber: 0.7, sodium: 907 }, commonPortions: [{ label: '1 col. sopa', grams: 15 }] },
  { id: 'f175', name: 'Mostarda Amarela', category: 'Outros', per100g: { calories: 66, protein: 4.4, carbs: 5.8, fat: 3.3, fiber: 2.0, sodium: 1120 }, commonPortions: [{ label: '1 col. chá', grams: 5 }] },
  { id: 'f176', name: 'Açúcar Mascavo', category: 'Outros', per100g: { calories: 380, protein: 0, carbs: 98, fat: 0, fiber: 0, sodium: 30 }, commonPortions: [{ label: '1 col. chá', grams: 5 }, { label: '1 col. sopa', grams: 12 }] },
  { id: 'f177', name: 'Geleia de Fruta (light)', category: 'Outros', per100g: { calories: 110, protein: 0.3, carbs: 28, fat: 0, fiber: 0.5 }, commonPortions: [{ label: '1 col. sopa', grams: 15 }] },

  // ═══════════════════════════════════════
  // CARNES E AVES — continuação
  // ═══════════════════════════════════════
  { id: 'f178', name: 'Frango à Parmegiana', category: 'Carnes e Aves', per100g: { calories: 190, protein: 17, carbs: 8, fat: 10, fiber: 0.5 }, commonPortions: [{ label: 'Porção', grams: 200 }] },
  { id: 'f179', name: 'Bife de Fígado de Frango', category: 'Carnes e Aves', per100g: { calories: 167, protein: 24, carbs: 1.0, fat: 7, fiber: 0, sodium: 88, iron: 8.5 }, commonPortions: [{ label: 'Porção', grams: 100 }] },
  { id: 'f180', name: 'Peito de Frango Cru', category: 'Carnes e Aves', per100g: { calories: 120, protein: 22, carbs: 0, fat: 2.6, fiber: 0, sodium: 64 }, commonPortions: [{ label: 'Filé 100g', grams: 100 }, { label: 'Filé grande 170g', grams: 170 }] },
  { id: 'f181', name: 'Contrafilé Grelhado', category: 'Carnes e Aves', per100g: { calories: 205, protein: 25, carbs: 0, fat: 11, fiber: 0, sodium: 62, iron: 2.3 }, commonPortions: [{ label: 'Bife médio', grams: 130 }] },
  { id: 'f182', name: 'Patinho Moído Cru', category: 'Carnes e Aves', per100g: { calories: 155, protein: 21, carbs: 0, fat: 7.5, fiber: 0, sodium: 68, iron: 2.7 }, commonPortions: [{ label: 'Porção', grams: 100 }] },

  // ═══════════════════════════════════════
  // PEIXES E FRUTOS DO MAR — continuação
  // ═══════════════════════════════════════
  { id: 'f183', name: 'Filé de Frango do Mar', category: 'Peixes e Frutos do Mar', per100g: { calories: 92, protein: 20, carbs: 0, fat: 1.2, fiber: 0 }, commonPortions: [{ label: 'Filé', grams: 130 }] },
  { id: 'f184', name: 'Salmão Cru (sashimi)', category: 'Peixes e Frutos do Mar', per100g: { calories: 179, protein: 20, carbs: 0, fat: 11, fiber: 0, sodium: 59 }, commonPortions: [{ label: '3 fatias (60g)', grams: 60 }] },
  { id: 'f185', name: 'Mariscos/Mexilhões Cozidos', category: 'Peixes e Frutos do Mar', per100g: { calories: 86, protein: 12, carbs: 4, fat: 2, fiber: 0, sodium: 286, calcium: 26, iron: 4.5 }, commonPortions: [{ label: 'Porção', grams: 100 }] },

  // ═══════════════════════════════════════
  // OVOS E LATICÍNIOS — continuação
  // ═══════════════════════════════════════
  { id: 'f186', name: 'Queijo Brie', category: 'Ovos e Laticínios', per100g: { calories: 334, protein: 21, carbs: 0.5, fat: 28, fiber: 0, sodium: 629, calcium: 184 }, commonPortions: [{ label: 'Fatia (20g)', grams: 20 }] },
  { id: 'f187', name: 'Queijo Minas Padrão', category: 'Ovos e Laticínios', per100g: { calories: 320, protein: 20, carbs: 3, fat: 25, fiber: 0, sodium: 450, calcium: 540 }, commonPortions: [{ label: 'Fatia', grams: 30 }] },
  { id: 'f188', name: 'Leite Condensado', category: 'Ovos e Laticínios', per100g: { calories: 321, protein: 8, carbs: 56, fat: 8.5, fiber: 0, sodium: 120 }, commonPortions: [{ label: '1 col. sopa', grams: 15 }] },
  { id: 'f189', name: 'Iogurte Proteico (Skyr)', category: 'Ovos e Laticínios', per100g: { calories: 62, protein: 10, carbs: 3.5, fat: 0.2, fiber: 0, sodium: 40, calcium: 110 }, commonPortions: [{ label: 'Pote 170g', grams: 170 }] },

  // ═══════════════════════════════════════
  // LEGUMINOSAS — continuação
  // ═══════════════════════════════════════
  { id: 'f190', name: 'Feijão Jalo Cozido', category: 'Leguminosas', per100g: { calories: 91, protein: 5.6, carbs: 17, fat: 0.4, fiber: 7.4, iron: 2.1 }, commonPortions: [{ label: 'Concha', grams: 130 }] },
  { id: 'f191', name: 'Hummus (pasta grão-de-bico)', category: 'Leguminosas', per100g: { calories: 166, protein: 7.9, carbs: 14, fat: 9.6, fiber: 6, sodium: 300 }, commonPortions: [{ label: '2 col. sopa', grams: 30 }, { label: 'Porção', grams: 100 }] },

  // ═══════════════════════════════════════
  // CEREAIS E GRÃOS — continuação
  // ═══════════════════════════════════════
  { id: 'f192', name: 'Trigo Bulgur Cozido', category: 'Cereais e Grãos', per100g: { calories: 83, protein: 3.1, carbs: 19, fat: 0.2, fiber: 4.5 }, commonPortions: [{ label: 'Porção', grams: 100 }] },
  { id: 'f193', name: 'Farinha de Aveia', category: 'Cereais e Grãos', per100g: { calories: 390, protein: 14, carbs: 66, fat: 8, fiber: 9.4, sodium: 2, iron: 4.5 }, commonPortions: [{ label: '3 col. sopa', grams: 30 }] },
  { id: 'f194', name: 'Batata Doce Assada', category: 'Cereais e Grãos', per100g: { calories: 90, protein: 2, carbs: 21, fat: 0.1, fiber: 3.3, sodium: 36, vitaminC: 18 }, commonPortions: [{ label: 'Unidade', grams: 130 }] },
  { id: 'f195', name: 'Macarrão ao Molho Tomate', category: 'Cereais e Grãos', per100g: { calories: 140, protein: 4.5, carbs: 27, fat: 2, fiber: 2, sodium: 200 }, commonPortions: [{ label: 'Prato médio', grams: 250 }] },
  { id: 'f196', name: 'Canjica Cozida', category: 'Cereais e Grãos', per100g: { calories: 129, protein: 3.5, carbs: 26, fat: 1.2, fiber: 2.1 }, commonPortions: [{ label: 'Tigela', grams: 200 }] },

  // ═══════════════════════════════════════
  // FRUTAS — continuação
  // ═══════════════════════════════════════
  { id: 'f197', name: 'Caju', category: 'Frutas', per100g: { calories: 43, protein: 1.0, carbs: 9.8, fat: 0.2, fiber: 1.7, vitaminC: 219 }, commonPortions: [{ label: '1 unidade', grams: 100 }] },
  { id: 'f198', name: 'Cajá / Seriguela', category: 'Frutas', per100g: { calories: 66, protein: 0.9, carbs: 15.5, fat: 0.4, fiber: 1.9, vitaminC: 36 }, commonPortions: [{ label: '3 unidades', grams: 100 }] },
  { id: 'f199', name: 'Framboesa', category: 'Frutas', per100g: { calories: 52, protein: 1.2, carbs: 11.9, fat: 0.7, fiber: 6.5, vitaminC: 26.2 }, commonPortions: [{ label: 'Xícara', grams: 123 }] },
  { id: 'f200', name: 'Ameixa Fresca', category: 'Frutas', per100g: { calories: 46, protein: 0.7, carbs: 11, fat: 0.3, fiber: 1.4, vitaminC: 9.5 }, commonPortions: [{ label: '1 unidade', grams: 70 }] },
  { id: 'f201', name: 'Banana Prata', category: 'Frutas', per100g: { calories: 98, protein: 1.3, carbs: 26, fat: 0.1, fiber: 2.0, vitaminC: 9 }, commonPortions: [{ label: '1 unidade', grams: 80 }] },
  { id: 'f202', name: 'Coco Fresco (polpa)', category: 'Frutas', per100g: { calories: 354, protein: 3.3, carbs: 15, fat: 33, fiber: 9 }, commonPortions: [{ label: 'Pedaço (30g)', grams: 30 }] },

  // ═══════════════════════════════════════
  // VERDURAS E LEGUMES — continuação
  // ═══════════════════════════════════════
  { id: 'f203', name: 'Agrião', category: 'Verduras e Legumes', per100g: { calories: 22, protein: 2.3, carbs: 1.3, fat: 0.7, fiber: 1.5, sodium: 41, vitaminC: 43, calcium: 120 }, commonPortions: [{ label: 'Maço pequeno', grams: 50 }] },
  { id: 'f204', name: 'Rúcula', category: 'Verduras e Legumes', per100g: { calories: 25, protein: 2.6, carbs: 3.7, fat: 0.7, fiber: 1.6, vitaminC: 15, calcium: 160 }, commonPortions: [{ label: 'Porção', grams: 40 }] },
  { id: 'f205', name: 'Repolho Cozido', category: 'Verduras e Legumes', per100g: { calories: 23, protein: 1.3, carbs: 5.4, fat: 0.1, fiber: 2.3, vitaminC: 30 }, commonPortions: [{ label: 'Porção', grams: 100 }] },
  { id: 'f206', name: 'Mandioquinha Cozida', category: 'Verduras e Legumes', per100g: { calories: 99, protein: 1.5, carbs: 23, fat: 0.2, fiber: 2.5, vitaminC: 20 }, commonPortions: [{ label: 'Unidade', grams: 100 }] },
  { id: 'f207', name: 'Vagem Cozida', category: 'Verduras e Legumes', per100g: { calories: 31, protein: 1.8, carbs: 7.1, fat: 0.1, fiber: 2.7, vitaminC: 12.2 }, commonPortions: [{ label: 'Porção', grams: 100 }] },
  { id: 'f208', name: 'Acelga Cozida', category: 'Verduras e Legumes', per100g: { calories: 20, protein: 1.9, carbs: 4.1, fat: 0.1, fiber: 2.1, sodium: 213, calcium: 58, vitaminC: 18 }, commonPortions: [{ label: 'Porção', grams: 100 }] },

  // ═══════════════════════════════════════
  // SUPLEMENTOS — continuação
  // ═══════════════════════════════════════
  { id: 'f209', name: 'Pré-Treino (dose)', category: 'Suplementos', per100g: { calories: 50, protein: 1, carbs: 12, fat: 0, fiber: 0, sodium: 200 }, commonPortions: [{ label: '1 dose (10g)', grams: 10 }] },
  { id: 'f210', name: 'BCAA (pó)', category: 'Suplementos', per100g: { calories: 390, protein: 97, carbs: 0, fat: 0, fiber: 0 }, commonPortions: [{ label: '1 dose (10g)', grams: 10 }] },
  { id: 'f211', name: 'Waxy Maize (pó)', category: 'Suplementos', per100g: { calories: 375, protein: 0, carbs: 93, fat: 0.5, fiber: 1 }, commonPortions: [{ label: '1 col. sopa (30g)', grams: 30 }] },
  { id: 'f212', name: 'Proteína de Arroz (pó)', category: 'Suplementos', per100g: { calories: 385, protein: 80, carbs: 10, fat: 3.5, fiber: 1.5 }, commonPortions: [{ label: '1 scoop (30g)', grams: 30 }] },

  // ═══════════════════════════════════════
  // BEBIDAS — continuação
  // ═══════════════════════════════════════
  { id: 'f213', name: 'Suco de Maracujá Natural', category: 'Bebidas', per100g: { calories: 25, protein: 0.7, carbs: 5.8, fat: 0.1, fiber: 0, vitaminC: 18 }, commonPortions: [{ label: 'Copo 200ml', grams: 200 }] },
  { id: 'f214', name: 'Suco de Acerola Natural', category: 'Bebidas', per100g: { calories: 40, protein: 0.4, carbs: 9.2, fat: 0.3, fiber: 1.0, vitaminC: 800 }, commonPortions: [{ label: 'Copo 200ml', grams: 200 }] },
  { id: 'f215', name: 'Chá Verde (sem açúcar)', category: 'Bebidas', per100g: { calories: 1, protein: 0.2, carbs: 0.2, fat: 0, fiber: 0 }, commonPortions: [{ label: 'Xícara 200ml', grams: 200 }] },
  { id: 'f216', name: 'Vitamina de Banana com Leite', category: 'Bebidas', per100g: { calories: 75, protein: 2.5, carbs: 15, fat: 1.2, fiber: 0.7 }, commonPortions: [{ label: 'Copo 300ml', grams: 300 }] },

  // ═══════════════════════════════════════
  // LANCHES E FAST FOOD — continuação
  // ═══════════════════════════════════════
  { id: 'f217', name: 'Empada de Frango', category: 'Lanches e Fast Food', per100g: { calories: 290, protein: 8, carbs: 30, fat: 16, fiber: 1, sodium: 380 }, commonPortions: [{ label: '1 unidade', grams: 80 }] },
  { id: 'f218', name: 'Enrolado de Salsicha', category: 'Lanches e Fast Food', per100g: { calories: 320, protein: 9, carbs: 35, fat: 17, fiber: 1, sodium: 500 }, commonPortions: [{ label: '1 unidade', grams: 70 }] },
  { id: 'f219', name: 'Bolo de Cenoura com Cobertura', category: 'Lanches e Fast Food', per100g: { calories: 360, protein: 4.5, carbs: 57, fat: 14, fiber: 1.2 }, commonPortions: [{ label: 'Fatia', grams: 80 }] },
  { id: 'f220', name: 'Tapioca Recheada (frango+queijo)', category: 'Lanches e Fast Food', per100g: { calories: 180, protein: 10, carbs: 24, fat: 5, fiber: 0.2 }, commonPortions: [{ label: '1 unidade', grams: 100 }] },

  // ═══════════════════════════════════════
  // OUTROS — continuação
  // ═══════════════════════════════════════
  { id: 'f221', name: 'Vinagrete Caseiro', category: 'Outros', per100g: { calories: 18, protein: 0.5, carbs: 3.5, fat: 0.3, fiber: 0.8, sodium: 120 }, commonPortions: [{ label: '2 col. sopa', grams: 30 }] },
  { id: 'f222', name: 'Proteína de Ervilha (pó)', category: 'Suplementos', per100g: { calories: 375, protein: 82, carbs: 5, fat: 3, fiber: 1.5, sodium: 370, iron: 5 }, commonPortions: [{ label: '1 scoop (30g)', grams: 30 }] },
  { id: 'f223', name: 'Açaí Puro (polpa congelada)', category: 'Frutas', per100g: { calories: 60, protein: 1.2, carbs: 6, fat: 5, fiber: 2.6, calcium: 35 }, commonPortions: [{ label: 'Polpa 100g', grams: 100 }, { label: 'Tigela 200g', grams: 200 }] },
  { id: 'f224', name: 'Manteiga de Coco', category: 'Outros', per100g: { calories: 650, protein: 8, carbs: 25, fat: 60, fiber: 15 }, commonPortions: [{ label: '1 col. sopa', grams: 15 }] },
  { id: 'f225', name: 'Flocos de Milho (cereal)', category: 'Cereais e Grãos', per100g: { calories: 363, protein: 7.5, carbs: 84, fat: 0.9, fiber: 2.0, sodium: 500 }, commonPortions: [{ label: 'Tigela (30g)', grams: 30 }] },
];

export function searchFoods(query: string, category?: string): FoodItem[] {
  const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return FOOD_DATABASE.filter(food => {
    const nameNorm = food.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const matchesQuery = !q || nameNorm.includes(q);
    const matchesCategory = !category || food.category === category;
    return matchesQuery && matchesCategory;
  });
}

export function calcMacrosForGrams(food: FoodItem, grams: number) {
  const ratio = grams / 100;
  const round1 = (n: number) => Math.round(n * 10) / 10;
  const p = food.per100g;
  return {
    name: food.name,
    portion: `${grams}g`,
    calories: Math.round(p.calories * ratio),
    protein: round1(p.protein * ratio),
    carbs: round1(p.carbs * ratio),
    fat: round1(p.fat * ratio),
    fiber: round1(p.fiber * ratio),
    sodium: p.sodium ? Math.round(p.sodium * ratio) : 0,
    sugar: p.sugar ? round1(p.sugar * ratio) : 0,
    calcium: p.calcium ? Math.round(p.calcium * ratio) : 0,
    iron: p.iron ? round1(p.iron * ratio) : 0,
    vitaminC: p.vitaminC ? round1(p.vitaminC * ratio) : 0,
    vitaminD: p.vitaminD ? round1(p.vitaminD * ratio) : 0,
  };
}
