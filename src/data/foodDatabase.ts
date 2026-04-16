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
  'Bebidas',
  'Outros',
] as const;

export const FOOD_DATABASE: FoodItem[] = [
  { id: 'f001', name: 'Frango Grelhado (peito)', category: 'Carnes e Aves', per100g: { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 }, commonPortions: [{ label: 'Porção pequena', grams: 100 }, { label: 'Porção média', grams: 150 }, { label: 'Filé grande', grams: 200 }] },
  { id: 'f002', name: 'Carne Bovina Patinho Cozido', category: 'Carnes e Aves', per100g: { calories: 219, protein: 27, carbs: 0, fat: 12, fiber: 0 }, commonPortions: [{ label: 'Porção', grams: 100 }, { label: 'Bife médio', grams: 150 }] },
  { id: 'f003', name: 'Carne Moída Refogada', category: 'Carnes e Aves', per100g: { calories: 250, protein: 24, carbs: 0, fat: 17, fiber: 0 }, commonPortions: [{ label: 'Porção', grams: 100 }, { label: 'Porção grande', grams: 150 }] },
  { id: 'f004', name: 'Frango Coxinha da Coxa Cozida', category: 'Carnes e Aves', per100g: { calories: 174, protein: 26, carbs: 0, fat: 7.5, fiber: 0 }, commonPortions: [{ label: 'Coxinha', grams: 80 }, { label: 'Porção', grams: 150 }] },
  { id: 'f005', name: 'Peru (peito)', category: 'Carnes e Aves', per100g: { calories: 135, protein: 30, carbs: 0, fat: 1.5, fiber: 0 }, commonPortions: [{ label: 'Fatia', grams: 50 }, { label: 'Porção', grams: 100 }] },
  { id: 'f006', name: 'Alcatra Grelhada', category: 'Carnes e Aves', per100g: { calories: 210, protein: 26, carbs: 0, fat: 11, fiber: 0 }, commonPortions: [{ label: 'Bife médio', grams: 130 }, { label: 'Bife grande', grams: 200 }] },
  { id: 'f007', name: 'Filé Mignon Grelhado', category: 'Carnes e Aves', per100g: { calories: 190, protein: 28, carbs: 0, fat: 8, fiber: 0 }, commonPortions: [{ label: 'Bife médio', grams: 130 }] },
  { id: 'f008', name: 'Linguiça Frango Grelhada', category: 'Carnes e Aves', per100g: { calories: 180, protein: 18, carbs: 1, fat: 12, fiber: 0 }, commonPortions: [{ label: '1 gomo', grams: 80 }] },
  { id: 'f009', name: 'Tilápia Grelhada', category: 'Peixes e Frutos do Mar', per100g: { calories: 96, protein: 20, carbs: 0, fat: 1.7, fiber: 0 }, commonPortions: [{ label: 'Filé pequeno', grams: 100 }, { label: 'Filé grande', grams: 180 }] },
  { id: 'f010', name: 'Atum em Lata (em água)', category: 'Peixes e Frutos do Mar', per100g: { calories: 109, protein: 24, carbs: 0, fat: 1.0, fiber: 0 }, commonPortions: [{ label: '½ lata', grams: 90 }, { label: 'Lata inteira', grams: 170 }] },
  { id: 'f011', name: 'Salmão Grelhado', category: 'Peixes e Frutos do Mar', per100g: { calories: 208, protein: 20, carbs: 0, fat: 13, fiber: 0 }, commonPortions: [{ label: 'Filé médio', grams: 150 }] },
  { id: 'f012', name: 'Sardinha em Lata', category: 'Peixes e Frutos do Mar', per100g: { calories: 208, protein: 25, carbs: 0, fat: 11, fiber: 0 }, commonPortions: [{ label: 'Lata', grams: 125 }] },
  { id: 'f013', name: 'Camarão Cozido', category: 'Peixes e Frutos do Mar', per100g: { calories: 99, protein: 24, carbs: 0.2, fat: 0.3, fiber: 0 }, commonPortions: [{ label: 'Porção', grams: 100 }] },
  { id: 'f014', name: 'Ovo Inteiro Cozido', category: 'Ovos e Laticínios', per100g: { calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0 }, commonPortions: [{ label: '1 ovo médio', grams: 50 }, { label: '2 ovos', grams: 100 }, { label: '3 ovos', grams: 150 }] },
  { id: 'f015', name: 'Clara de Ovo', category: 'Ovos e Laticínios', per100g: { calories: 52, protein: 11, carbs: 0.7, fat: 0.2, fiber: 0 }, commonPortions: [{ label: '1 clara', grams: 33 }, { label: '3 claras', grams: 100 }] },
  { id: 'f016', name: 'Queijo Minas Frescal', category: 'Ovos e Laticínios', per100g: { calories: 264, protein: 17, carbs: 3, fat: 20, fiber: 0 }, commonPortions: [{ label: 'Fatia', grams: 30 }, { label: 'Porção', grams: 60 }] },
  { id: 'f017', name: 'Queijo Cottage', category: 'Ovos e Laticínios', per100g: { calories: 98, protein: 11, carbs: 3.4, fat: 4.3, fiber: 0 }, commonPortions: [{ label: 'Porção', grams: 100 }, { label: 'Colher grande', grams: 50 }] },
  { id: 'f018', name: 'Iogurte Natural Integral', category: 'Ovos e Laticínios', per100g: { calories: 61, protein: 3.5, carbs: 4.7, fat: 3.3, fiber: 0 }, commonPortions: [{ label: 'Pote 170g', grams: 170 }, { label: 'Pote 200g', grams: 200 }] },
  { id: 'f019', name: 'Iogurte Grego Integral', category: 'Ovos e Laticínios', per100g: { calories: 97, protein: 9, carbs: 3.8, fat: 5, fiber: 0 }, commonPortions: [{ label: 'Pote 100g', grams: 100 }, { label: 'Pote 150g', grams: 150 }] },
  { id: 'f020', name: 'Leite Integral', category: 'Ovos e Laticínios', per100g: { calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, fiber: 0 }, commonPortions: [{ label: 'Copo 200ml', grams: 200 }, { label: 'Copo 250ml', grams: 250 }] },
  { id: 'f021', name: 'Whey Protein (scoop)', category: 'Ovos e Laticínios', per100g: { calories: 380, protein: 80, carbs: 5, fat: 3, fiber: 0 }, commonPortions: [{ label: '1 scoop (30g)', grams: 30 }] },
  { id: 'f022', name: 'Feijão Carioca Cozido', category: 'Leguminosas', per100g: { calories: 77, protein: 4.8, carbs: 14, fat: 0.5, fiber: 8.5 }, commonPortions: [{ label: 'Concha pequena', grams: 80 }, { label: 'Concha média', grams: 130 }, { label: 'Concha grande', grams: 180 }] },
  { id: 'f023', name: 'Feijão Preto Cozido', category: 'Leguminosas', per100g: { calories: 77, protein: 5, carbs: 14, fat: 0.5, fiber: 8.7 }, commonPortions: [{ label: 'Concha', grams: 130 }] },
  { id: 'f024', name: 'Lentilha Cozida', category: 'Leguminosas', per100g: { calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 7.9 }, commonPortions: [{ label: 'Porção', grams: 100 }] },
  { id: 'f025', name: 'Grão-de-Bico Cozido', category: 'Leguminosas', per100g: { calories: 164, protein: 8.9, carbs: 27, fat: 2.6, fiber: 7.6 }, commonPortions: [{ label: 'Porção', grams: 100 }] },
  { id: 'f026', name: 'Arroz Branco Cozido', category: 'Cereais e Grãos', per100g: { calories: 128, protein: 2.5, carbs: 28, fat: 0.2, fiber: 0.2 }, commonPortions: [{ label: 'Colher de servir', grams: 80 }, { label: 'Porção média (2 col)', grams: 160 }, { label: 'Porção grande (3 col)', grams: 240 }] },
  { id: 'f027', name: 'Arroz Integral Cozido', category: 'Cereais e Grãos', per100g: { calories: 124, protein: 2.6, carbs: 25.8, fat: 1.0, fiber: 2.7 }, commonPortions: [{ label: 'Colher de servir', grams: 80 }, { label: 'Porção média', grams: 160 }] },
  { id: 'f028', name: 'Aveia em Flocos', category: 'Cereais e Grãos', per100g: { calories: 394, protein: 14, carbs: 67, fat: 8.5, fiber: 9.1 }, commonPortions: [{ label: '3 col. sopa', grams: 30 }, { label: '5 col. sopa', grams: 50 }] },
  { id: 'f029', name: 'Batata Doce Cozida', category: 'Cereais e Grãos', per100g: { calories: 86, protein: 1.6, carbs: 20, fat: 0.1, fiber: 3.0 }, commonPortions: [{ label: 'Unidade pequena', grams: 100 }, { label: 'Unidade média', grams: 150 }, { label: 'Unidade grande', grams: 200 }] },
  { id: 'f030', name: 'Batata Inglesa Cozida', category: 'Cereais e Grãos', per100g: { calories: 86, protein: 1.7, carbs: 19.7, fat: 0.1, fiber: 1.8 }, commonPortions: [{ label: 'Unidade média', grams: 130 }] },
  { id: 'f031', name: 'Macarrão Cozido', category: 'Pães e Massas', per100g: { calories: 131, protein: 4.5, carbs: 26, fat: 1.1, fiber: 1.8 }, commonPortions: [{ label: 'Porção pequena', grams: 100 }, { label: 'Porção média', grams: 150 }, { label: 'Porção grande', grams: 220 }] },
  { id: 'f032', name: 'Pão Francês', category: 'Pães e Massas', per100g: { calories: 300, protein: 8, carbs: 58, fat: 3.1, fiber: 2.3 }, commonPortions: [{ label: '1 unidade', grams: 50 }] },
  { id: 'f033', name: 'Pão Integral', category: 'Pães e Massas', per100g: { calories: 243, protein: 9, carbs: 44, fat: 3.0, fiber: 6.9 }, commonPortions: [{ label: '1 fatia', grams: 25 }, { label: '2 fatias', grams: 50 }] },
  { id: 'f034', name: 'Tapioca', category: 'Pães e Massas', per100g: { calories: 357, protein: 0.5, carbs: 88, fat: 0.1, fiber: 0.1 }, commonPortions: [{ label: '1 tapioca média', grams: 50 }] },
  { id: 'f035', name: 'Banana Nanica', category: 'Frutas', per100g: { calories: 92, protein: 1.3, carbs: 23, fat: 0.1, fiber: 1.9 }, commonPortions: [{ label: 'Unidade pequena', grams: 80 }, { label: 'Unidade média', grams: 100 }, { label: 'Unidade grande', grams: 130 }] },
  { id: 'f036', name: 'Maçã', category: 'Frutas', per100g: { calories: 56, protein: 0.3, carbs: 15, fat: 0.1, fiber: 1.3 }, commonPortions: [{ label: 'Unidade', grams: 150 }] },
  { id: 'f037', name: 'Mamão Papaia', category: 'Frutas', per100g: { calories: 40, protein: 0.5, carbs: 10, fat: 0.1, fiber: 1.8 }, commonPortions: [{ label: 'Fatia média', grams: 200 }] },
  { id: 'f038', name: 'Manga', category: 'Frutas', per100g: { calories: 65, protein: 0.5, carbs: 17, fat: 0.3, fiber: 1.8 }, commonPortions: [{ label: '½ unidade', grams: 150 }] },
  { id: 'f039', name: 'Laranja', category: 'Frutas', per100g: { calories: 47, protein: 0.9, carbs: 12, fat: 0.1, fiber: 2.4 }, commonPortions: [{ label: 'Unidade', grams: 130 }] },
  { id: 'f040', name: 'Uva (verde ou roxa)', category: 'Frutas', per100g: { calories: 69, protein: 0.6, carbs: 18, fat: 0.2, fiber: 0.9 }, commonPortions: [{ label: '1 cacho pequeno', grams: 100 }] },
  { id: 'f041', name: 'Morango', category: 'Frutas', per100g: { calories: 33, protein: 0.7, carbs: 7.7, fat: 0.3, fiber: 2.0 }, commonPortions: [{ label: '5 unidades', grams: 70 }, { label: 'Xícara', grams: 150 }] },
  { id: 'f042', name: 'Abacate', category: 'Frutas', per100g: { calories: 160, protein: 2, carbs: 9, fat: 14.7, fiber: 6.7 }, commonPortions: [{ label: '½ unidade', grams: 70 }] },
  { id: 'f043', name: 'Arroz Branco + Feijão (prato)', category: 'Cereais e Grãos', per100g: { calories: 109, protein: 4.0, carbs: 22, fat: 0.4, fiber: 2.5 }, commonPortions: [{ label: 'Prato simples', grams: 250 }] },
  { id: 'f044', name: 'Brócolis Cozido', category: 'Verduras e Legumes', per100g: { calories: 35, protein: 2.4, carbs: 7.2, fat: 0.4, fiber: 2.6 }, commonPortions: [{ label: 'Porção', grams: 100 }, { label: 'Prato cheio', grams: 200 }] },
  { id: 'f045', name: 'Espinafre Refogado', category: 'Verduras e Legumes', per100g: { calories: 27, protein: 2.9, carbs: 1.4, fat: 0.8, fiber: 2.1 }, commonPortions: [{ label: 'Porção', grams: 100 }] },
  { id: 'f046', name: 'Cenoura Cozida', category: 'Verduras e Legumes', per100g: { calories: 35, protein: 0.8, carbs: 8.2, fat: 0.2, fiber: 3.0 }, commonPortions: [{ label: 'Unidade', grams: 60 }, { label: 'Porção', grams: 100 }] },
  { id: 'f047', name: 'Alface', category: 'Verduras e Legumes', per100g: { calories: 11, protein: 1.3, carbs: 1.5, fat: 0.3, fiber: 1.4 }, commonPortions: [{ label: 'Folhas (porção)', grams: 50 }] },
  { id: 'f048', name: 'Tomate', category: 'Verduras e Legumes', per100g: { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2 }, commonPortions: [{ label: '1 unidade média', grams: 100 }] },
  { id: 'f049', name: 'Abobrinha Cozida', category: 'Verduras e Legumes', per100g: { calories: 17, protein: 1.2, carbs: 3.6, fat: 0.1, fiber: 1.1 }, commonPortions: [{ label: 'Porção', grams: 100 }] },
  { id: 'f050', name: 'Pepino', category: 'Verduras e Legumes', per100g: { calories: 16, protein: 0.7, carbs: 3.6, fat: 0.1, fiber: 0.5 }, commonPortions: [{ label: '½ unidade', grams: 100 }] },
  { id: 'f051', name: 'Amendoim', category: 'Oleaginosas', per100g: { calories: 567, protein: 25, carbs: 16, fat: 49, fiber: 8.5 }, commonPortions: [{ label: '1 colher sopa', grams: 15 }, { label: 'Punhado', grams: 30 }] },
  { id: 'f052', name: 'Castanha-do-Pará', category: 'Oleaginosas', per100g: { calories: 659, protein: 14, carbs: 12, fat: 67, fiber: 7.5 }, commonPortions: [{ label: '1 unidade', grams: 5 }, { label: '3 unidades', grams: 15 }] },
  { id: 'f053', name: 'Pasta de Amendoim Integral', category: 'Oleaginosas', per100g: { calories: 589, protein: 25, carbs: 20, fat: 50, fiber: 6 }, commonPortions: [{ label: '1 col. sopa', grams: 15 }, { label: '2 col. sopa', grams: 30 }] },
  { id: 'f054', name: 'Amêndoas', category: 'Oleaginosas', per100g: { calories: 579, protein: 21, carbs: 22, fat: 50, fiber: 12.5 }, commonPortions: [{ label: '10 unidades', grams: 15 }, { label: 'Porção', grams: 28 }] },
  { id: 'f055', name: 'Azeite de Oliva', category: 'Outros', per100g: { calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0 }, commonPortions: [{ label: '1 col. chá', grams: 5 }, { label: '1 col. sopa', grams: 10 }] },
  { id: 'f056', name: 'Arroz de Forno / Risoto', category: 'Cereais e Grãos', per100g: { calories: 150, protein: 4, carbs: 28, fat: 3.5, fiber: 0.5 }, commonPortions: [{ label: 'Porção', grams: 180 }] },
  { id: 'f057', name: 'Omelete (2 ovos)', category: 'Ovos e Laticínios', per100g: { calories: 154, protein: 11, carbs: 0.5, fat: 12, fiber: 0 }, commonPortions: [{ label: 'Omelete 2 ovos', grams: 120 }] },
  { id: 'f058', name: 'Salada Verde Simples', category: 'Verduras e Legumes', per100g: { calories: 20, protein: 1.5, carbs: 3, fat: 0.3, fiber: 1.8 }, commonPortions: [{ label: 'Prato de salada', grams: 100 }, { label: 'Prato grande', grams: 180 }] },
  { id: 'f059', name: 'Sopa de Legumes', category: 'Verduras e Legumes', per100g: { calories: 35, protein: 1.5, carbs: 7, fat: 0.5, fiber: 1.5 }, commonPortions: [{ label: 'Tigela', grams: 300 }] },
  { id: 'f060', name: 'Pizza (fatia média)', category: 'Pães e Massas', per100g: { calories: 266, protein: 11, carbs: 33, fat: 10, fiber: 1.5 }, commonPortions: [{ label: '1 fatia', grams: 100 }, { label: '2 fatias', grams: 200 }] },
  { id: 'f061', name: 'Hambúrguer de Frango', category: 'Carnes e Aves', per100g: { calories: 210, protein: 18, carbs: 18, fat: 7, fiber: 1 }, commonPortions: [{ label: '1 hambúrguer', grams: 150 }] },
  { id: 'f062', name: 'Cream Cheese Light', category: 'Ovos e Laticínios', per100g: { calories: 175, protein: 6, carbs: 4, fat: 15, fiber: 0 }, commonPortions: [{ label: '1 col. sopa', grams: 20 }] },
  { id: 'f063', name: 'Granola', category: 'Cereais e Grãos', per100g: { calories: 471, protein: 9, carbs: 64, fat: 21, fiber: 5.3 }, commonPortions: [{ label: '3 col. sopa', grams: 40 }] },
  { id: 'f064', name: 'Mel', category: 'Outros', per100g: { calories: 304, protein: 0.3, carbs: 82, fat: 0, fiber: 0.2 }, commonPortions: [{ label: '1 col. chá', grams: 7 }, { label: '1 col. sopa', grams: 15 }] },
  { id: 'f065', name: 'Café com Leite (200ml)', category: 'Bebidas', per100g: { calories: 20, protein: 1.1, carbs: 1.7, fat: 0.8, fiber: 0 }, commonPortions: [{ label: 'Copo 200ml', grams: 200 }] },
  { id: 'f066', name: 'Suco de Laranja Natural (200ml)', category: 'Bebidas', per100g: { calories: 45, protein: 0.7, carbs: 10.4, fat: 0.2, fiber: 0.2 }, commonPortions: [{ label: 'Copo 200ml', grams: 200 }] },
  { id: 'f067', name: 'Leite Desnatado', category: 'Bebidas', per100g: { calories: 36, protein: 3.4, carbs: 5.1, fat: 0.1, fiber: 0 }, commonPortions: [{ label: 'Copo 200ml', grams: 200 }] },
  { id: 'f068', name: 'Proteína Vegetal de Soja', category: 'Leguminosas', per100g: { calories: 332, protein: 52, carbs: 36, fat: 1, fiber: 4 }, commonPortions: [{ label: 'Porção hidratada', grams: 100 }] },
  { id: 'f069', name: 'Milho Verde Cozido', category: 'Verduras e Legumes', per100g: { calories: 86, protein: 3.2, carbs: 19, fat: 1.2, fiber: 2.9 }, commonPortions: [{ label: 'Espiga', grams: 120 }, { label: 'Porção', grams: 100 }] },
  { id: 'f070', name: 'Cuscuz Cozido', category: 'Cereais e Grãos', per100g: { calories: 112, protein: 3.8, carbs: 24, fat: 0.2, fiber: 1.4 }, commonPortions: [{ label: 'Porção', grams: 150 }] },
  { id: 'f071', name: 'Queijo Muçarela', category: 'Ovos e Laticínios', per100g: { calories: 280, protein: 22, carbs: 2, fat: 20, fiber: 0 }, commonPortions: [{ label: '1 fatia fina', grams: 20 }, { label: 'Porção', grams: 50 }] },
  { id: 'f072', name: 'Requeijão Cremoso', category: 'Ovos e Laticínios', per100g: { calories: 255, protein: 9, carbs: 3, fat: 23, fiber: 0 }, commonPortions: [{ label: '1 col. sopa', grams: 25 }] },
  { id: 'f073', name: 'Presunto Cozido', category: 'Carnes e Aves', per100g: { calories: 95, protein: 16, carbs: 1, fat: 3, fiber: 0 }, commonPortions: [{ label: 'Fatia', grams: 20 }, { label: '3 fatias', grams: 60 }] },
  { id: 'f074', name: 'Pão de Queijo', category: 'Pães e Massas', per100g: { calories: 315, protein: 8, carbs: 47, fat: 11, fiber: 0.5 }, commonPortions: [{ label: '1 unidade pequena', grams: 30 }, { label: '1 unidade grande', grams: 60 }] },
  { id: 'f075', name: 'Açaí com Granola (tigela)', category: 'Frutas', per100g: { calories: 150, protein: 2.5, carbs: 22, fat: 7, fiber: 3 }, commonPortions: [{ label: 'Tigela 300g', grams: 300 }] },
  { id: 'f076', name: 'Biscoito de Arroz', category: 'Outros', per100g: { calories: 390, protein: 6.5, carbs: 84, fat: 2.8, fiber: 1.0 }, commonPortions: [{ label: '1 unidade', grams: 8 }, { label: '4 unidades', grams: 30 }] },
  { id: 'f077', name: 'Chocolate 70% Cacau', category: 'Outros', per100g: { calories: 598, protein: 7.8, carbs: 46, fat: 43, fiber: 10.9 }, commonPortions: [{ label: '2 quadradinhos', grams: 20 }] },
  { id: 'f078', name: 'Frango à Parmegiana', category: 'Carnes e Aves', per100g: { calories: 190, protein: 17, carbs: 8, fat: 10, fiber: 0.5 }, commonPortions: [{ label: 'Porção', grams: 200 }] },
  { id: 'f079', name: 'Manteiga', category: 'Outros', per100g: { calories: 717, protein: 0.9, carbs: 0.1, fat: 81, fiber: 0 }, commonPortions: [{ label: '1 col. chá', grams: 5 }, { label: '1 col. sopa', grams: 10 }] },
  { id: 'f080', name: 'Quinoa Cozida', category: 'Cereais e Grãos', per100g: { calories: 120, protein: 4.4, carbs: 22, fat: 2, fiber: 2.8 }, commonPortions: [{ label: 'Porção', grams: 100 }, { label: 'Porção grande', grams: 150 }] },
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
  return {
    name: food.name,
    portion: `${grams}g`,
    calories: Math.round(food.per100g.calories * ratio),
    protein: Math.round(food.per100g.protein * ratio * 10) / 10,
    carbs: Math.round(food.per100g.carbs * ratio * 10) / 10,
    fat: Math.round(food.per100g.fat * ratio * 10) / 10,
    fiber: Math.round(food.per100g.fiber * ratio * 10) / 10,
  };
}
