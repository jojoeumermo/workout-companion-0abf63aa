import { Exercise, MuscleGroup, Equipment } from '@/types/workout';

const img = (name: string) => `https://images.unsplash.com/photo-${name}?w=400&h=300&fit=crop`;

// Helper to create exercise
let idCounter = 0;
const ex = (
  name: string,
  muscleGroup: MuscleGroup,
  secondaryMuscles: MuscleGroup[],
  equipment: Equipment,
  description: string,
  instructions: string[],
): Exercise => ({
  id: `ex-${++idCounter}`,
  name,
  muscleGroup,
  secondaryMuscles,
  equipment,
  description,
  instructions,
  image: '',
});

export const exercises: Exercise[] = [
  // PEITO (20 exercises)
  ex('Supino Reto com Barra', 'Peito', ['Tríceps', 'Ombros'], 'Barra', 'Exercício principal para desenvolvimento do peitoral.', ['Deite no banco reto', 'Segure a barra na largura dos ombros', 'Desça até o peito', 'Empurre até extensão dos braços']),
  ex('Supino Inclinado com Barra', 'Peito', ['Ombros', 'Tríceps'], 'Barra', 'Enfatiza a parte superior do peitoral.', ['Ajuste o banco a 30-45 graus', 'Desça a barra até a parte superior do peito', 'Empurre para cima']),
  ex('Supino Declinado com Barra', 'Peito', ['Tríceps'], 'Barra', 'Enfatiza a parte inferior do peitoral.', ['Ajuste o banco em declínio', 'Desça a barra até a parte inferior do peito', 'Empurre para cima']),
  ex('Supino Reto com Halteres', 'Peito', ['Tríceps', 'Ombros'], 'Halteres', 'Permite maior amplitude de movimento.', ['Deite no banco com halteres', 'Desça os halteres ao lado do peito', 'Empurre para cima']),
  ex('Supino Inclinado com Halteres', 'Peito', ['Ombros', 'Tríceps'], 'Halteres', 'Trabalha a parte superior do peitoral com halteres.', ['Banco inclinado a 30-45 graus', 'Desça os halteres', 'Empurre para cima']),
  ex('Crucifixo com Halteres', 'Peito', [], 'Halteres', 'Isolamento do peitoral com movimento de abertura.', ['Deite no banco reto', 'Abra os braços com cotovelos levemente flexionados', 'Retorne à posição inicial']),
  ex('Crucifixo Inclinado', 'Peito', ['Ombros'], 'Halteres', 'Isolamento da parte superior do peitoral.', ['Banco inclinado', 'Realize o movimento de abertura', 'Controle a descida']),
  ex('Crossover', 'Peito', [], 'Cabos', 'Trabalha o peitoral com cabos cruzados.', ['Posicione-se entre as polias', 'Puxe os cabos para frente e para baixo', 'Cruze as mãos na frente do corpo']),
  ex('Peck Deck', 'Peito', [], 'Máquina', 'Isolamento do peitoral na máquina.', ['Sente-se na máquina', 'Posicione os braços nas almofadas', 'Feche os braços à frente']),
  ex('Flexão de Braço', 'Peito', ['Tríceps', 'Ombros'], 'Peso Corporal', 'Exercício básico para peitoral.', ['Apoie as mãos no chão', 'Desça o corpo mantendo o tronco reto', 'Empurre para cima']),
  ex('Flexão Diamante', 'Peito', ['Tríceps'], 'Peso Corporal', 'Variação que enfatiza tríceps e peitoral interno.', ['Mãos juntas formando um diamante', 'Desça o corpo', 'Empurre para cima']),
  ex('Flexão Inclinada', 'Peito', ['Ombros', 'Tríceps'], 'Peso Corporal', 'Flexão com pés elevados para mais intensidade.', ['Pés em banco elevado', 'Mãos no chão', 'Realize a flexão']),
  ex('Pullover com Halter', 'Peito', ['Costas'], 'Halteres', 'Trabalha peitoral e dorsal.', ['Deite perpendicular ao banco', 'Segure o halter acima do peito', 'Desça atrás da cabeça', 'Retorne']),
  ex('Supino na Smith Machine', 'Peito', ['Tríceps', 'Ombros'], 'Smith Machine', 'Supino guiado na Smith Machine.', ['Deite no banco sob a Smith', 'Desça a barra até o peito', 'Empurre para cima']),
  ex('Chest Press na Máquina', 'Peito', ['Tríceps'], 'Máquina', 'Supino na máquina para maior segurança.', ['Sente-se na máquina', 'Empurre as pegadas à frente', 'Retorne controlando']),
  ex('Crossover Alto', 'Peito', [], 'Cabos', 'Crossover com polias altas.', ['Polias na posição alta', 'Puxe para baixo e para frente', 'Cruze na frente do corpo']),
  ex('Crossover Baixo', 'Peito', [], 'Cabos', 'Crossover com polias baixas enfatizando parte superior.', ['Polias na posição baixa', 'Puxe para cima e para frente', 'Junte as mãos acima']),
  ex('Supino com Pegada Fechada', 'Peito', ['Tríceps'], 'Barra', 'Enfatiza tríceps e peitoral interno.', ['Pegada mais estreita que ombros', 'Desça a barra', 'Empurre para cima']),
  ex('Flexão com Apoio', 'Peito', ['Tríceps', 'Ombros'], 'Peso Corporal', 'Flexão com amplitude extra usando apoios.', ['Use apoios para as mãos', 'Desça mais fundo', 'Empurre para cima']),
  ex('Fly na Máquina', 'Peito', [], 'Máquina', 'Movimento de fly na máquina.', ['Sente-se na máquina', 'Abra e feche os braços', 'Controle o movimento']),

  // COSTAS (20 exercises)
  ex('Barra Fixa (Pull-up)', 'Costas', ['Bíceps'], 'Peso Corporal', 'Exercício fundamental para costas.', ['Segure a barra com pegada pronada', 'Puxe o corpo para cima', 'Desça controladamente']),
  ex('Puxada Frontal', 'Costas', ['Bíceps'], 'Máquina', 'Simula o movimento da barra fixa.', ['Sente-se na máquina', 'Puxe a barra até o peito', 'Retorne controlando']),
  ex('Puxada Aberta', 'Costas', ['Bíceps'], 'Máquina', 'Puxada com pegada mais aberta.', ['Pegada larga na barra', 'Puxe até o peito', 'Retorne lentamente']),
  ex('Puxada Supinada', 'Costas', ['Bíceps'], 'Máquina', 'Puxada com pegada supinada para mais bíceps.', ['Pegada supinada', 'Puxe até o peito', 'Retorne controlando']),
  ex('Remada Curvada com Barra', 'Costas', ['Bíceps'], 'Barra', 'Remada livre para espessura das costas.', ['Incline o tronco a 45 graus', 'Puxe a barra até o abdômen', 'Desça controladamente']),
  ex('Remada Unilateral com Halter', 'Costas', ['Bíceps'], 'Halteres', 'Remada com um braço para cada lado.', ['Apoie um joelho no banco', 'Puxe o halter até a cintura', 'Desça controlando']),
  ex('Remada Baixa (Sentado)', 'Costas', ['Bíceps'], 'Cabos', 'Remada na polia baixa sentado.', ['Sente-se e segure a pegada', 'Puxe até o abdômen', 'Retorne lentamente']),
  ex('Remada Cavaleira (T-Bar)', 'Costas', ['Bíceps'], 'Barra', 'Remada com barra em ângulo.', ['Posicione-se sobre a barra', 'Puxe até o peito', 'Desça controlando']),
  ex('Pulldown com Corda', 'Costas', [], 'Cabos', 'Puxada com corda na polia alta.', ['Segure a corda na polia alta', 'Puxe para baixo', 'Abra as mãos ao final']),
  ex('Pullover na Máquina', 'Costas', ['Peito'], 'Máquina', 'Pullover guiado na máquina.', ['Sente-se na máquina', 'Puxe a barra para baixo', 'Retorne controlando']),
  ex('Remada na Máquina', 'Costas', ['Bíceps'], 'Máquina', 'Remada guiada para segurança.', ['Sente-se na máquina', 'Puxe as pegadas', 'Retorne lentamente']),
  ex('Chin-up (Barra Supinada)', 'Costas', ['Bíceps'], 'Peso Corporal', 'Barra fixa com pegada supinada.', ['Pegada supinada na barra', 'Puxe o corpo para cima', 'Desça controlando']),
  ex('Remada Curvada Supinada', 'Costas', ['Bíceps'], 'Barra', 'Remada com pegada invertida.', ['Pegada supinada', 'Incline o tronco', 'Puxe a barra até o abdômen']),
  ex('Face Pull', 'Costas', ['Ombros'], 'Cabos', 'Exercício para deltoides posteriores e trapézio.', ['Polia na altura do rosto', 'Puxe a corda em direção ao rosto', 'Abra os braços ao puxar']),
  ex('Encolhimento com Barra', 'Costas', [], 'Barra', 'Isolamento do trapézio.', ['Segure a barra à frente', 'Eleve os ombros', 'Desça controlando']),
  ex('Encolhimento com Halteres', 'Costas', [], 'Halteres', 'Trapézio com halteres.', ['Segure os halteres ao lado', 'Eleve os ombros', 'Mantenha e desça']),
  ex('Superman', 'Costas', ['Glúteos'], 'Peso Corporal', 'Extensão lombar no solo.', ['Deite de bruços', 'Eleve braços e pernas', 'Mantenha e desça']),
  ex('Hiperextensão', 'Costas', ['Glúteos'], 'Banco', 'Extensão lombar no banco romano.', ['Posicione-se no banco', 'Desça o tronco', 'Suba até alinhar com as pernas']),
  ex('Remada Alta com Barra', 'Costas', ['Ombros'], 'Barra', 'Trabalha trapézio e deltoides.', ['Segure a barra com pegada fechada', 'Puxe até a altura do queixo', 'Desça controlando']),
  ex('Pulldown Unilateral', 'Costas', ['Bíceps'], 'Cabos', 'Puxada com um braço de cada vez.', ['Segure a pegada com uma mão', 'Puxe para baixo', 'Retorne controlando']),

  // OMBROS (15 exercises)
  ex('Desenvolvimento com Barra', 'Ombros', ['Tríceps'], 'Barra', 'Exercício principal para ombros.', ['Sentado ou em pé', 'Empurre a barra acima da cabeça', 'Desça até a altura das orelhas']),
  ex('Desenvolvimento com Halteres', 'Ombros', ['Tríceps'], 'Halteres', 'Desenvolvimento livre com halteres.', ['Sentado com halteres na altura dos ombros', 'Empurre para cima', 'Desça controlando']),
  ex('Elevação Lateral', 'Ombros', [], 'Halteres', 'Isolamento do deltoide lateral.', ['Em pé com halteres ao lado', 'Eleve os braços lateralmente', 'Desça controlando']),
  ex('Elevação Frontal', 'Ombros', ['Peito'], 'Halteres', 'Isolamento do deltoide anterior.', ['Em pé com halteres à frente', 'Eleve alternadamente à frente', 'Desça controlando']),
  ex('Arnold Press', 'Ombros', ['Tríceps'], 'Halteres', 'Desenvolvimento com rotação para trabalhar todos os deltoides.', ['Comece com palmas viradas para você', 'Rotacione enquanto empurra para cima', 'Inverta ao descer']),
  ex('Desenvolvimento na Máquina', 'Ombros', ['Tríceps'], 'Máquina', 'Desenvolvimento guiado na máquina.', ['Sente-se na máquina', 'Empurre as pegadas para cima', 'Desça controlando']),
  ex('Elevação Lateral no Cabo', 'Ombros', [], 'Cabos', 'Elevação lateral com cabo para tensão constante.', ['Polia na posição baixa', 'Eleve o braço lateralmente', 'Desça controlando']),
  ex('Elevação Lateral na Máquina', 'Ombros', [], 'Máquina', 'Elevação lateral guiada.', ['Sente-se na máquina', 'Eleve os braços lateralmente', 'Desça controlando']),
  ex('Crucifixo Inverso', 'Ombros', ['Costas'], 'Halteres', 'Trabalha deltoides posteriores.', ['Incline o tronco à frente', 'Abra os braços lateralmente', 'Retorne controlando']),
  ex('Crucifixo Inverso na Máquina', 'Ombros', ['Costas'], 'Máquina', 'Deltoide posterior na máquina.', ['Sente-se de frente para a máquina', 'Abra os braços', 'Retorne controlando']),
  ex('Press Militar', 'Ombros', ['Tríceps'], 'Barra', 'Desenvolvimento em pé com barra.', ['Em pé com barra na frente', 'Empurre acima da cabeça', 'Desça controlando']),
  ex('Desenvolvimento na Smith', 'Ombros', ['Tríceps'], 'Smith Machine', 'Desenvolvimento guiado na Smith Machine.', ['Sente-se sob a Smith', 'Empurre a barra para cima', 'Desça controlando']),
  ex('Elevação Lateral Inclinada', 'Ombros', [], 'Halteres', 'Elevação lateral com tronco inclinado.', ['Incline-se segurando em suporte', 'Eleve o halter lateralmente', 'Desça controlando']),
  ex('Face Pull com Corda', 'Ombros', ['Costas'], 'Cabos', 'Excelente para saúde dos ombros.', ['Polia alta com corda', 'Puxe em direção ao rosto', 'Abra os braços ao puxar']),
  ex('Desenvolvimento Landmine', 'Ombros', ['Peito', 'Tríceps'], 'Barra', 'Press com barra apoiada em ângulo.', ['Segure a ponta da barra', 'Empurre à frente e para cima', 'Retorne controlando']),

  // BÍCEPS (12 exercises)
  ex('Rosca Direta com Barra', 'Bíceps', ['Antebraço'], 'Barra', 'Exercício clássico para bíceps.', ['Em pé com barra', 'Flexione os braços', 'Desça controlando']),
  ex('Rosca Alternada com Halteres', 'Bíceps', ['Antebraço'], 'Halteres', 'Rosca alternando os braços.', ['Em pé com halteres', 'Flexione alternadamente', 'Desça controlando']),
  ex('Rosca Concentrada', 'Bíceps', [], 'Halteres', 'Isolamento máximo do bíceps.', ['Sentado com cotovelo apoiado na coxa', 'Flexione o braço', 'Desça controlando']),
  ex('Rosca Martelo', 'Bíceps', ['Antebraço'], 'Halteres', 'Trabalha bíceps e braquiorradial.', ['Pegada neutra com halteres', 'Flexione os braços', 'Desça controlando']),
  ex('Rosca Scott', 'Bíceps', [], 'Barra', 'Rosca no banco Scott para isolamento.', ['Apoie os braços no banco Scott', 'Flexione com barra ou halteres', 'Desça controlando']),
  ex('Rosca no Cabo', 'Bíceps', [], 'Cabos', 'Rosca com polia baixa.', ['Polia na posição baixa', 'Flexione os braços', 'Desça controlando']),
  ex('Rosca 21', 'Bíceps', [], 'Barra', 'Série de 21 repetições em 3 fases.', ['7 reps da parte inferior até o meio', '7 reps do meio até o topo', '7 reps completas']),
  ex('Rosca Inclinada', 'Bíceps', [], 'Halteres', 'Rosca com banco inclinado para mais alongamento.', ['Deite no banco inclinado', 'Flexione os braços', 'Desça controlando']),
  ex('Rosca Spider', 'Bíceps', [], 'Halteres', 'Rosca apoiado no lado inclinado do banco.', ['Deite de bruços no banco inclinado', 'Flexione os braços', 'Desça controlando']),
  ex('Rosca Inversa', 'Bíceps', ['Antebraço'], 'Barra', 'Rosca com pegada pronada.', ['Pegada pronada na barra', 'Flexione os braços', 'Desça controlando']),
  ex('Rosca na Máquina', 'Bíceps', [], 'Máquina', 'Rosca guiada na máquina.', ['Sente-se na máquina', 'Flexione os braços', 'Desça controlando']),
  ex('Rosca com Corda', 'Bíceps', ['Antebraço'], 'Cabos', 'Rosca martelo no cabo com corda.', ['Segure a corda na polia baixa', 'Flexione os braços', 'Desça controlando']),

  // TRÍCEPS (12 exercises)
  ex('Tríceps Corda', 'Tríceps', [], 'Cabos', 'Extensão de tríceps com corda.', ['Polia alta com corda', 'Estenda os braços para baixo', 'Abra a corda ao final']),
  ex('Tríceps Testa', 'Tríceps', [], 'Barra', 'Extensão deitado para tríceps.', ['Deitado no banco', 'Desça a barra até a testa', 'Estenda os braços']),
  ex('Tríceps Banco', 'Tríceps', ['Peito'], 'Banco', 'Mergulho entre bancos.', ['Apoie as mãos em um banco atrás', 'Desça o corpo flexionando os braços', 'Empurre para cima']),
  ex('Tríceps Francês', 'Tríceps', [], 'Halteres', 'Extensão acima da cabeça.', ['Sentado com halter atrás da cabeça', 'Estenda os braços para cima', 'Desça controlando']),
  ex('Tríceps Pulley', 'Tríceps', [], 'Cabos', 'Extensão com barra na polia alta.', ['Segure a barra reta na polia', 'Estenda os braços para baixo', 'Retorne controlando']),
  ex('Mergulho nas Paralelas', 'Tríceps', ['Peito', 'Ombros'], 'Peso Corporal', 'Exercício composto para tríceps.', ['Segure nas barras paralelas', 'Desça o corpo', 'Empurre para cima']),
  ex('Tríceps Coice', 'Tríceps', [], 'Halteres', 'Extensão para trás com halter.', ['Incline o tronco', 'Estenda o braço para trás', 'Retorne controlando']),
  ex('Tríceps na Máquina', 'Tríceps', [], 'Máquina', 'Extensão de tríceps na máquina.', ['Sente-se na máquina', 'Estenda os braços', 'Retorne controlando']),
  ex('Flexão Fechada', 'Tríceps', ['Peito'], 'Peso Corporal', 'Flexão com mãos próximas.', ['Mãos próximas no chão', 'Desça o corpo', 'Empurre para cima']),
  ex('Tríceps Unilateral no Cabo', 'Tríceps', [], 'Cabos', 'Extensão com um braço na polia.', ['Segure a pegada com uma mão', 'Estenda o braço para baixo', 'Retorne controlando']),
  ex('Tríceps com Barra W', 'Tríceps', [], 'Barra', 'Tríceps testa com barra W.', ['Deitado com barra W', 'Desça até a testa', 'Estenda os braços']),
  ex('Supino Fechado', 'Tríceps', ['Peito'], 'Barra', 'Supino com pegada estreita para tríceps.', ['Pegada na largura dos ombros', 'Desça a barra', 'Empurre para cima']),

  // PERNAS (18 exercises)
  ex('Agachamento Livre', 'Pernas', ['Glúteos'], 'Barra', 'Exercício rei para pernas.', ['Barra apoiada nos trapézios', 'Desça até a paralela ou abaixo', 'Empurre para cima']),
  ex('Leg Press', 'Pernas', ['Glúteos'], 'Máquina', 'Prensa de pernas na máquina.', ['Sente-se na máquina', 'Desça a plataforma flexionando os joelhos', 'Empurre para cima']),
  ex('Hack Machine', 'Pernas', ['Glúteos'], 'Máquina', 'Agachamento guiado na máquina.', ['Posicione-se na máquina', 'Desça controlando', 'Empurre para cima']),
  ex('Cadeira Extensora', 'Pernas', [], 'Máquina', 'Isolamento do quadríceps.', ['Sente-se na máquina', 'Estenda as pernas', 'Desça controlando']),
  ex('Cadeira Flexora', 'Pernas', [], 'Máquina', 'Isolamento dos isquiotibiais.', ['Deite na máquina', 'Flexione as pernas', 'Retorne controlando']),
  ex('Afundo (Lunge)', 'Pernas', ['Glúteos'], 'Halteres', 'Avanço para pernas e glúteos.', ['Dê um passo à frente', 'Desça o joelho de trás', 'Empurre para cima']),
  ex('Passada', 'Pernas', ['Glúteos'], 'Halteres', 'Caminhada com avanço.', ['Dê passos alternados à frente', 'Desça a cada passo', 'Continue caminhando']),
  ex('Stiff', 'Pernas', ['Glúteos', 'Costas'], 'Barra', 'Levantamento com pernas estendidas.', ['Segure a barra à frente', 'Incline o tronco mantendo pernas quase estendidas', 'Retorne à posição ereta']),
  ex('Levantamento Terra', 'Pernas', ['Costas', 'Glúteos'], 'Barra', 'Exercício composto fundamental.', ['Barra no chão à frente', 'Segure e levante com as pernas e costas', 'Desça controlando']),
  ex('Agachamento Frontal', 'Pernas', ['Abdômen'], 'Barra', 'Agachamento com barra à frente.', ['Barra apoiada nos deltoides anteriores', 'Desça mantendo tronco ereto', 'Empurre para cima']),
  ex('Agachamento Búlgaro', 'Pernas', ['Glúteos'], 'Halteres', 'Agachamento unilateral com pé elevado.', ['Pé de trás no banco', 'Desça o joelho', 'Empurre para cima']),
  ex('Agachamento na Smith', 'Pernas', ['Glúteos'], 'Smith Machine', 'Agachamento guiado na Smith Machine.', ['Posicione-se sob a barra', 'Desça controlando', 'Empurre para cima']),
  ex('Leg Press 45°', 'Pernas', ['Glúteos'], 'Máquina', 'Prensa de pernas em 45 graus.', ['Sente-se na máquina', 'Desça a plataforma', 'Empurre para cima']),
  ex('Agachamento Sumô', 'Pernas', ['Glúteos'], 'Halteres', 'Agachamento com pernas afastadas.', ['Pernas bem afastadas', 'Desça com o peso entre as pernas', 'Empurre para cima']),
  ex('Mesa Flexora', 'Pernas', [], 'Máquina', 'Flexão de pernas deitado.', ['Deite na máquina', 'Flexione as pernas', 'Retorne controlando']),
  ex('Flexora em Pé', 'Pernas', [], 'Máquina', 'Flexão de pernas em pé.', ['Em pé na máquina', 'Flexione uma perna', 'Retorne controlando']),
  ex('Agachamento Goblet', 'Pernas', ['Glúteos'], 'Halteres', 'Agachamento segurando halter no peito.', ['Segure halter junto ao peito', 'Desça em agachamento', 'Empurre para cima']),
  ex('Step Up', 'Pernas', ['Glúteos'], 'Halteres', 'Subida no banco com carga.', ['Suba no banco com uma perna', 'Retorne ao chão', 'Alterne as pernas']),

  // GLÚTEOS (8 exercises)
  ex('Hip Thrust', 'Glúteos', ['Pernas'], 'Barra', 'Exercício principal para glúteos.', ['Costas apoiadas no banco', 'Barra sobre o quadril', 'Empurre o quadril para cima', 'Desça controlando']),
  ex('Glute Bridge', 'Glúteos', ['Pernas'], 'Peso Corporal', 'Ponte de glúteos no solo.', ['Deitado de costas', 'Pés no chão', 'Eleve o quadril', 'Desça controlando']),
  ex('Abdução na Máquina', 'Glúteos', [], 'Máquina', 'Abdução das pernas na máquina.', ['Sente-se na máquina', 'Abra as pernas', 'Retorne controlando']),
  ex('Coice no Cabo', 'Glúteos', [], 'Cabos', 'Extensão de quadril no cabo.', ['Polia baixa presa ao tornozelo', 'Empurre a perna para trás', 'Retorne controlando']),
  ex('Elevação Pélvica', 'Glúteos', ['Pernas'], 'Peso Corporal', 'Elevação do quadril com uma perna.', ['Deitado com uma perna estendida', 'Eleve o quadril', 'Desça controlando']),
  ex('Abdução com Elástico', 'Glúteos', [], 'Elástico', 'Abdução usando mini band.', ['Elástico acima dos joelhos', 'Abra as pernas lateralmente', 'Retorne controlando']),
  ex('Agachamento com Elástico', 'Glúteos', ['Pernas'], 'Elástico', 'Agachamento com mini band.', ['Elástico acima dos joelhos', 'Realize o agachamento mantendo tensão', 'Empurre para cima']),
  ex('Kickback na Máquina', 'Glúteos', [], 'Máquina', 'Coice na máquina para glúteos.', ['Posicione-se na máquina', 'Empurre a plataforma para trás', 'Retorne controlando']),

  // ABDÔMEN (10 exercises)
  ex('Crunch', 'Abdômen', [], 'Peso Corporal', 'Abdominal básico.', ['Deitado de costas', 'Flexione o tronco elevando os ombros', 'Desça controlando']),
  ex('Prancha', 'Abdômen', [], 'Peso Corporal', 'Isometria para core.', ['Apoie antebraços e pés no chão', 'Mantenha o corpo reto', 'Segure a posição']),
  ex('Elevação de Pernas', 'Abdômen', [], 'Peso Corporal', 'Eleva as pernas deitado ou suspenso.', ['Deitado ou suspenso na barra', 'Eleve as pernas', 'Desça controlando']),
  ex('Abdominal Bicicleta', 'Abdômen', [], 'Peso Corporal', 'Abdominal com rotação e pedalada.', ['Deitado de costas', 'Alterne cotovelo ao joelho oposto', 'Mantenha o ritmo']),
  ex('Prancha Lateral', 'Abdômen', [], 'Peso Corporal', 'Isometria lateral para oblíquos.', ['Apoie um antebraço lateralmente', 'Mantenha o corpo reto', 'Segure a posição']),
  ex('Abdominal na Máquina', 'Abdômen', [], 'Máquina', 'Crunch na máquina com carga.', ['Sente-se na máquina', 'Flexione o tronco', 'Retorne controlando']),
  ex('Abdominal Infra', 'Abdômen', [], 'Peso Corporal', 'Trabalha a parte inferior do abdômen.', ['Deitado de costas', 'Eleve o quadril do chão', 'Desça controlando']),
  ex('Russian Twist', 'Abdômen', [], 'Peso Corporal', 'Rotação do tronco sentado.', ['Sentado com tronco inclinado', 'Rotacione de um lado ao outro', 'Mantenha os pés elevados']),
  ex('Ab Wheel', 'Abdômen', [], 'Outro', 'Roda abdominal.', ['Ajoelhado com a roda', 'Estenda o corpo à frente', 'Retorne à posição inicial']),
  ex('Crunch no Cabo', 'Abdômen', [], 'Cabos', 'Abdominal ajoelhado no cabo.', ['Ajoelhado com corda na polia alta', 'Flexione o tronco para baixo', 'Retorne controlando']),

  // PANTURRILHA (5 exercises)
  ex('Panturrilha em Pé', 'Panturrilha', [], 'Máquina', 'Elevação de panturrilha em pé.', ['Na máquina em pé', 'Eleve os calcanhares', 'Desça controlando']),
  ex('Panturrilha Sentado', 'Panturrilha', [], 'Máquina', 'Elevação de panturrilha sentado.', ['Sentado na máquina', 'Eleve os calcanhares', 'Desça controlando']),
  ex('Panturrilha no Leg Press', 'Panturrilha', [], 'Máquina', 'Panturrilha usando o leg press.', ['Pés na borda da plataforma', 'Empurre com as pontas dos pés', 'Retorne controlando']),
  ex('Panturrilha Unilateral', 'Panturrilha', [], 'Halteres', 'Panturrilha com um pé de cada vez.', ['Em pé com halter', 'Eleve o calcanhar de uma perna', 'Desça controlando']),
  ex('Panturrilha no Step', 'Panturrilha', [], 'Peso Corporal', 'Panturrilha em degrau com peso corporal.', ['Pontas dos pés no degrau', 'Eleve os calcanhares', 'Desça alongando']),

  // ANTEBRAÇO (5 exercises)
  ex('Rosca de Punho', 'Antebraço', [], 'Barra', 'Flexão de punho para antebraço.', ['Antebraços apoiados nos joelhos', 'Flexione os punhos para cima', 'Desça controlando']),
  ex('Rosca de Punho Inversa', 'Antebraço', [], 'Barra', 'Extensão de punho para antebraço.', ['Antebraços apoiados, palmas para baixo', 'Estenda os punhos para cima', 'Desça controlando']),
  ex('Farmer Walk', 'Antebraço', ['Corpo Inteiro'], 'Halteres', 'Caminhada com carga pesada.', ['Segure halteres pesados', 'Caminhe mantendo postura', 'Mantenha por tempo ou distância']),
  ex('Wrist Roller', 'Antebraço', [], 'Outro', 'Enrolar corda com peso.', ['Segure o bastão à frente', 'Enrole a corda com os punhos', 'Desenrole controlando']),
  ex('Dead Hang', 'Antebraço', ['Costas'], 'Peso Corporal', 'Suspensão na barra fixa.', ['Segure na barra fixa', 'Mantenha-se suspenso', 'Segure pelo máximo de tempo']),

  // CARDIO (5 exercises)
  ex('Corrida na Esteira', 'Cardio', ['Pernas'], 'Máquina', 'Corrida na esteira ergométrica.', ['Ajuste velocidade e inclinação', 'Corra mantendo postura', 'Monitore frequência cardíaca']),
  ex('Bicicleta Ergométrica', 'Cardio', ['Pernas'], 'Máquina', 'Pedalada na bicicleta estacionária.', ['Ajuste a altura do banco', 'Pedale no ritmo desejado', 'Monitore intensidade']),
  ex('Elíptico', 'Cardio', ['Corpo Inteiro'], 'Máquina', 'Exercício no transport.', ['Posicione-se na máquina', 'Mova braços e pernas', 'Mantenha ritmo constante']),
  ex('Pular Corda', 'Cardio', ['Panturrilha'], 'Outro', 'Exercício cardiovascular com corda.', ['Segure a corda nas mãos', 'Salte passando a corda sob os pés', 'Mantenha ritmo constante']),
  ex('Burpee', 'Cardio', ['Corpo Inteiro'], 'Peso Corporal', 'Exercício de corpo inteiro de alta intensidade.', ['Em pé, desça ao chão', 'Faça uma flexão', 'Salte de volta e pule']),
];

export const muscleGroups: MuscleGroup[] = [
  'Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps',
  'Pernas', 'Glúteos', 'Abdômen', 'Panturrilha', 'Antebraço', 'Cardio',
];

export const equipmentList: Equipment[] = [
  'Barra', 'Halteres', 'Máquina', 'Cabos', 'Peso Corporal',
  'Kettlebell', 'Elástico', 'Smith Machine', 'Banco', 'Outro',
];

export const getExerciseById = (id: string): Exercise | undefined =>
  exercises.find(e => e.id === id);

export const getExercisesByMuscle = (muscle: MuscleGroup): Exercise[] =>
  exercises.filter(e => e.muscleGroup === muscle);
